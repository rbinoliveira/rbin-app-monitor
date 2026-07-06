import { NextRequest, NextResponse } from 'next/server'

import {
  getAuthenticatedUser,
  requireFirebaseAuth,
} from '@/features/auth/libs/api-auth'
import {
  dispatchCypressRun,
  parseGithubRepo,
} from '@/features/monitoring/services/cypress-github-actions'
import {
  acquireLock,
  releaseLock,
} from '@/features/monitoring/services/cypress-lock'
import { reconcilePendingCypressResult } from '@/features/monitoring/services/cypress-reconcile'
import {
  getCypressResultById,
  savePendingCypressResult,
} from '@/features/monitoring/services/cypress-results'
import { getProjectByIdForUser } from '@/features/projects/services/projects'
import { getUserGithubToken } from '@/features/settings/services/user-github-credential'
import type { ApiResponse } from '@/shared/types/api-response.type'

export const maxDuration = 300

const WAIT_BUDGET_MS = 220_000
const WAIT_POLL_INTERVAL_MS = 15_000

interface CypressRunRequest {
  projectId?: string
  timeout?: number
}

export async function POST(request: NextRequest) {
  const authResponse = requireFirebaseAuth(request)
  if (authResponse) return authResponse

  const user = getAuthenticatedUser(request)!
  const body = (await request.json().catch(() => ({}))) as CypressRunRequest
  const projectId = body.projectId

  if (!projectId) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'projectId is required' },
      { status: 400 },
    )
  }

  const lockId = `cypress-run-${projectId}`
  const lockAcquired = await acquireLock(lockId)

  if (!lockAcquired) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Cypress execution is already in progress',
      },
      { status: 409 },
    )
  }

  const waitDeadline = Date.now() + WAIT_BUDGET_MS

  try {
    const project = await getProjectByIdForUser(projectId, user.id)

    if (!project.cypressGithubRepo) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'No Cypress configuration for this project',
        },
        { status: 400 },
      )
    }

    const parsed = parseGithubRepo(project.cypressGithubRepo)
    if (!parsed) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: `Invalid cypressGithubRepo format: ${project.cypressGithubRepo}`,
        },
        { status: 400 },
      )
    }

    const credential = await getUserGithubToken(user.id)
    if (!credential) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error:
            'GitHub integration not configured. Add your token in user settings.',
        },
        { status: 400 },
      )
    }

    const dispatched = await dispatchCypressRun(
      parsed.owner,
      parsed.repo,
      credential.token,
    )

    const pending = await savePendingCypressResult({
      projectId: project.id,
      projectName: project.name,
      trigger: 'manual',
      githubRepo: `${parsed.owner}/${parsed.repo}`,
      githubRunId: dispatched.runId,
      output: dispatched.htmlUrl,
    })

    while (Date.now() < waitDeadline) {
      const waitMs = Math.min(WAIT_POLL_INTERVAL_MS, waitDeadline - Date.now())
      if (waitMs <= 0) break
      await new Promise((resolve) => setTimeout(resolve, waitMs))

      const outcome = await reconcilePendingCypressResult(pending)
      if (outcome !== 'still-running') break
    }

    const finalResult = await getCypressResultById(pending.id)

    if (!finalResult || finalResult.status === 'pending') {
      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          status: 'pending',
          totalTests: 0,
          passed: 0,
          failed: 0,
          skipped: 0,
          duration: 0,
          output: dispatched.htmlUrl,
        },
      })
    }

    return NextResponse.json<ApiResponse>({
      success: finalResult.success,
      data: {
        status: 'completed',
        totalTests: finalResult.totalTests,
        passed: finalResult.passed,
        failed: finalResult.failed,
        skipped: finalResult.skipped,
        duration: finalResult.duration,
        specFiles: finalResult.specFiles,
        output: finalResult.output,
        error: finalResult.error,
      },
    })
  } catch (error) {
    console.error('Error running Cypress tests:', error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  } finally {
    await releaseLock(lockId)
  }
}
