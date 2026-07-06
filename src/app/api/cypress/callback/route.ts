import { NextRequest, NextResponse } from 'next/server'

import { requireRateLimit } from '@/features/auth/libs/api-auth'
import { reconcilePendingCypressResult } from '@/features/monitoring/services/cypress-reconcile'
import { findPendingCypressResultByRun } from '@/features/monitoring/services/cypress-results'
import type { ApiResponse } from '@/shared/types/api-response.type'

export const maxDuration = 300

const WAIT_BUDGET_MS = 150_000
const WAIT_POLL_INTERVAL_MS = 10_000

interface CallbackRequest {
  repo?: string
  runId?: number
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = requireRateLimit(request, {
    maxRequests: 30,
    windowMs: 60000,
  })
  if (rateLimitResponse) return rateLimitResponse

  const body = (await request.json().catch(() => ({}))) as CallbackRequest
  const repo = typeof body.repo === 'string' ? body.repo.trim() : ''
  const runId = Number(body.runId)

  if (!repo || !Number.isInteger(runId) || runId <= 0) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'repo and runId are required' },
      { status: 400 },
    )
  }

  const pending = await findPendingCypressResultByRun(repo, runId)
  if (!pending) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'No pending result for this run' },
      { status: 404 },
    )
  }

  try {
    const deadline = Date.now() + WAIT_BUDGET_MS

    while (Date.now() < deadline) {
      const outcome = await reconcilePendingCypressResult(pending)

      if (outcome !== 'still-running') {
        return NextResponse.json<ApiResponse>({
          success: true,
          data: { outcome },
        })
      }

      const waitMs = Math.min(WAIT_POLL_INTERVAL_MS, deadline - Date.now())
      if (waitMs <= 0) break
      await new Promise((resolve) => setTimeout(resolve, waitMs))
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { outcome: 'still-running' },
    })
  } catch (error) {
    console.error(
      `Error processing Cypress callback for ${repo}#${runId}:`,
      error,
    )
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
