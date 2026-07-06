import { NextRequest, NextResponse } from 'next/server'

import { requireApiAuth, requireRateLimit } from '@/features/auth/libs/api-auth'
import {
  dispatchCypressRun,
  makeCypressErrorResult,
  parseGithubRepo,
} from '@/features/monitoring/services/cypress-github-actions'
import { reconcilePendingCypressResult } from '@/features/monitoring/services/cypress-reconcile'
import {
  getPendingCypressResults,
  saveCypressResult,
  savePendingCypressResult,
} from '@/features/monitoring/services/cypress-results'
import { getActiveProjects } from '@/features/projects/services/projects'
import { getUserGithubToken } from '@/features/settings/services/user-github-credential'
import type { ApiResponse } from '@/shared/types/api-response.type'
import type { CypressResult } from '@/shared/types/cypress-result.type'

export const maxDuration = 300

const WAIT_BUDGET_MS = 220_000
const WAIT_POLL_INTERVAL_MS = 20_000

interface DispatchSummary {
  projectId: string
  projectName: string
  dispatched: boolean
  error?: string
}

async function reconcileExistingPending(): Promise<Record<string, number>> {
  const summary: Record<string, number> = {
    completed: 0,
    expired: 0,
    stillRunning: 0,
    failed: 0,
  }

  const pending = await getPendingCypressResults()
  for (const item of pending) {
    try {
      const outcome = await reconcilePendingCypressResult(item)
      if (outcome === 'completed') summary.completed++
      else if (outcome === 'expired') summary.expired++
      else summary.stillRunning++
    } catch (error) {
      summary.failed++
      console.error(
        `Error reconciling pending result ${item.id} (${item.projectName}):`,
        error,
      )
    }
  }

  return summary
}

export async function GET(request: NextRequest) {
  const authResponse = requireApiAuth(request, {
    requireSecret: true,
    secretKey: 'CRON_SECRET',
  })
  if (authResponse) return authResponse

  const rateLimitResponse = requireRateLimit(request, {
    maxRequests: 10,
    windowMs: 60000,
  })
  if (rateLimitResponse) return rateLimitResponse

  const waitDeadline = Date.now() + WAIT_BUDGET_MS

  try {
    const reconciled = await reconcileExistingPending()

    const projects = await getActiveProjects()
    const projectsWithCypress = projects.filter((p) => p.cypressGithubRepo)

    const dispatches: DispatchSummary[] = []
    const batchPending: CypressResult[] = []

    await Promise.all(
      projectsWithCypress.map(async (project) => {
        try {
          const parsed = parseGithubRepo(project.cypressGithubRepo!)
          if (!parsed) {
            throw new Error(
              `Invalid cypressGithubRepo format: ${project.cypressGithubRepo}`,
            )
          }

          const credential = await getUserGithubToken(project.userId)
          if (!credential) {
            throw new Error(
              `User ${project.userId} has no GitHub integration configured`,
            )
          }

          console.log(
            `Dispatching GitHub Actions Cypress for project: ${project.name}`,
          )
          const dispatched = await dispatchCypressRun(
            parsed.owner,
            parsed.repo,
            credential.token,
          )

          const pending = await savePendingCypressResult({
            projectId: project.id,
            projectName: project.name,
            trigger: 'cron',
            githubRepo: `${parsed.owner}/${parsed.repo}`,
            githubRunId: dispatched.runId,
            output: dispatched.htmlUrl,
          })

          batchPending.push(pending)
          dispatches.push({
            projectId: project.id,
            projectName: project.name,
            dispatched: true,
          })
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Unknown error'
          console.error(
            `Error dispatching Cypress for project ${project.name}:`,
            error,
          )

          try {
            await saveCypressResult({
              projectId: project.id,
              projectName: project.name,
              result: makeCypressErrorResult(message),
              trigger: 'cron',
            })
          } catch (saveError) {
            console.error(
              `Error saving dispatch failure for ${project.name}:`,
              saveError,
            )
          }

          dispatches.push({
            projectId: project.id,
            projectName: project.name,
            dispatched: false,
            error: message,
          })
        }
      }),
    )

    let remaining = [...batchPending]
    while (remaining.length > 0 && Date.now() < waitDeadline) {
      const waitMs = Math.min(WAIT_POLL_INTERVAL_MS, waitDeadline - Date.now())
      if (waitMs <= 0) break
      await new Promise((resolve) => setTimeout(resolve, waitMs))

      const stillRunning: CypressResult[] = []
      for (const item of remaining) {
        try {
          const outcome = await reconcilePendingCypressResult(item)
          if (outcome === 'still-running') stillRunning.push(item)
        } catch (error) {
          console.error(
            `Error collecting result for ${item.projectName}:`,
            error,
          )
          stillRunning.push(item)
        }
      }
      remaining = stillRunning
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        totalProjects: projectsWithCypress.length,
        reconciled,
        dispatches,
        collectedInline: batchPending.length - remaining.length,
        leftPending: remaining.map((r) => r.projectName),
      },
    })
  } catch (error) {
    console.error('Error in cron Cypress execution:', error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
