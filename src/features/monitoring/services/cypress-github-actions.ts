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

    return {
      success,
      totalTests: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration,
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
