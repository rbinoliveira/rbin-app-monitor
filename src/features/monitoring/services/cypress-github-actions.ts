import AdmZip from 'adm-zip'

import type { CypressRunResult } from './cypress-runner'

const GITHUB_API_BASE = 'https://api.github.com'
const POLL_INTERVAL_MS = 30_000
const MAX_POLL_DURATION_MS = 9 * 60 * 1000 // 9 minutes

interface GitHubWorkflowRun {
  id: number
  status: string | null
  conclusion: string | null
  created_at: string
  updated_at: string
  html_url: string
  run_started_at: string | null
}

interface GitHubWorkflowRunsResponse {
  workflow_runs: GitHubWorkflowRun[]
}

interface GitHubArtifact {
  id: number
  name: string
  expired: boolean
}

interface GitHubArtifactsResponse {
  artifacts: GitHubArtifact[]
}

interface CypressResultsJson {
  // flat format (custom script)
  totalTests?: number
  total?: number
  passes?: number
  passed?: number
  failures?: number
  failed?: number
  duration?: number
  // mochawesome nested format
  stats?: {
    tests?: number
    passes?: number
    failures?: number
    pending?: number
    duration?: number
  }
}

function makeHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

function makeErrorResult(error: string): CypressRunResult {
  return {
    success: false,
    totalTests: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    duration: 0,
    specFiles: [],
    output: '',
    error,
  }
}

async function dispatchWorkflow(
  owner: string,
  repo: string,
  workflow: string,
  token: string,
): Promise<void> {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/actions/workflows/${workflow}/dispatches`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      ...makeHeaders(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ref: 'main' }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`GitHub dispatch failed (${response.status}): ${text}`)
  }
}

async function pollForCompletedRun(
  owner: string,
  repo: string,
  workflow: string,
  token: string,
  dispatchedAt: Date,
): Promise<GitHubWorkflowRun> {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/actions/workflows/${workflow}/runs?per_page=5&event=workflow_dispatch`
  const deadline = Date.now() + MAX_POLL_DURATION_MS

  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))

    const response = await fetch(url, { headers: makeHeaders(token) })
    if (!response.ok) continue

    const data = (await response.json()) as GitHubWorkflowRunsResponse
    const run = data.workflow_runs.find(
      (r) => new Date(r.created_at) >= dispatchedAt,
    )

    if (!run) continue
    if (run.status === 'completed') return run
  }

  throw new Error('GitHub Actions workflow timed out after 9 minutes')
}

async function downloadArtifactResults(
  owner: string,
  repo: string,
  runId: number,
  token: string,
): Promise<Pick<
  CypressRunResult,
  'totalTests' | 'passed' | 'failed' | 'skipped' | 'duration'
> | null> {
  try {
    // 1. List artifacts for the run
    const artifactsUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/actions/runs/${runId}/artifacts`
    const artifactsRes = await fetch(artifactsUrl, {
      headers: makeHeaders(token),
    })
    if (!artifactsRes.ok) return null

    const artifactsData = (await artifactsRes.json()) as GitHubArtifactsResponse
    const artifact = artifactsData.artifacts.find(
      (a) => a.name === 'cypress-results' && !a.expired,
    )
    if (!artifact) return null

    // 2. Download the ZIP (GitHub redirects to S3 — fetch follows automatically)
    const downloadUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/actions/artifacts/${artifact.id}/zip`
    const zipRes = await fetch(downloadUrl, { headers: makeHeaders(token) })
    if (!zipRes.ok) return null

    const zipBuffer = Buffer.from(await zipRes.arrayBuffer())

    // 3. Extract output.json from ZIP
    const zip = new AdmZip(zipBuffer)
    const entry = zip.getEntry('output.json')
    if (!entry) return null

    const json = JSON.parse(
      entry.getData().toString('utf-8'),
    ) as CypressResultsJson

    // 4. Normalize — support flat format and mochawesome nested format
    const stats = json.stats
    const totalTests = json.totalTests ?? json.total ?? stats?.tests ?? 0
    const passed = json.passes ?? json.passed ?? stats?.passes ?? 0
    const failed = json.failures ?? json.failed ?? stats?.failures ?? 0
    const skipped = stats?.pending ?? 0
    const duration = json.duration ?? stats?.duration ?? 0

    return { totalTests, passed, failed, skipped, duration }
  } catch {
    return null
  }
}

function getTokenForOwner(owner: string): string | null {
  const single = process.env.GITHUB_ACTIONS_TOKEN
  const map = process.env.GITHUB_ACTIONS_TOKENS

  if (map) {
    try {
      const tokens = JSON.parse(map) as Record<string, string>
      if (tokens[owner]) return tokens[owner]
    } catch {
      // fall through to single token
    }
  }

  return single ?? null
}

export async function callGitHubActionsCypressRun(
  owner: string,
  repo: string,
  workflow = 'cypress-e2e.yml',
): Promise<CypressRunResult> {
  const token = getTokenForOwner(owner)
  if (!token) {
    return makeErrorResult(
      `No GitHub token configured for owner "${owner}". Set GITHUB_ACTIONS_TOKEN or GITHUB_ACTIONS_TOKENS.`,
    )
  }

  try {
    const dispatchedAt = new Date()
    await dispatchWorkflow(owner, repo, workflow, token)

    const run = await pollForCompletedRun(
      owner,
      repo,
      workflow,
      token,
      dispatchedAt,
    )

    const success = run.conclusion === 'success'
    const startedAt = run.run_started_at
      ? new Date(run.run_started_at)
      : new Date(run.created_at)
    const duration = new Date(run.updated_at).getTime() - startedAt.getTime()

    const artifactResults = await downloadArtifactResults(
      owner,
      repo,
      run.id,
      token,
    )

    return {
      success,
      totalTests: artifactResults?.totalTests ?? 0,
      passed: artifactResults?.passed ?? 0,
      failed: artifactResults?.failed ?? 0,
      skipped: artifactResults?.skipped ?? 0,
      duration: artifactResults?.duration ?? duration,
      specFiles: [],
      output: run.html_url,
      error: success ? undefined : `Workflow concluded: ${run.conclusion}`,
    }
  } catch (error) {
    return makeErrorResult(
      error instanceof Error ? error.message : 'Unknown error',
    )
  }
}

export function parseGithubRepo(repo: string): {
  owner: string
  repo: string
} | null {
  const parts = repo.trim().split('/')
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null
  return { owner: parts[0], repo: parts[1] }
}
