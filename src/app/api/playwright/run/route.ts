import { NextRequest, NextResponse } from 'next/server'

import { requireFirebaseAuth } from '@/features/auth/lib/api-auth'
import {
  acquireLock,
  releaseLock,
} from '@/features/monitoring/services/playwright-lock'
import { callRemotePlaywrightRun } from '@/features/monitoring/services/playwright-remote'
import { savePlaywrightResult } from '@/features/monitoring/services/playwright-results'
import { getProjectById } from '@/features/projects/services/projects'
import type { ApiResponse } from '@/shared/types'

export const maxDuration = 300

interface PlaywrightRunRequest {
  projectId?: string
  timeout?: number
}

export async function POST(request: NextRequest) {
  const authResponse = requireFirebaseAuth(request)
  if (authResponse) return authResponse

  const lockId = `playwright-run-${Date.now()}`
  const lockAcquired = await acquireLock(lockId)

  if (!lockAcquired) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Playwright execution is already in progress',
      },
      { status: 409 },
    )
  }

  try {
    const body = (await request
      .json()
      .catch(() => ({}))) as PlaywrightRunRequest
    const projectId = body.projectId
    const timeout = body.timeout || 120000

    if (!projectId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'projectId is required' },
        { status: 400 },
      )
    }

    const project = await getProjectById(projectId)

    if (!project.playwrightRunUrl) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'No Playwright run URL configured for this project',
        },
        { status: 400 },
      )
    }

    const result = await callRemotePlaywrightRun(project.playwrightRunUrl, {
      timeout,
    })

    await savePlaywrightResult({
      projectId: project.id,
      projectName: project.name,
      result,
    })

    return NextResponse.json<ApiResponse>({
      success: result.success,
      data: {
        totalTests: result.totalTests,
        passed: result.passed,
        failed: result.failed,
        skipped: result.skipped,
        duration: result.duration,
        specFiles: result.specFiles,
        output: result.output,
        error: result.error,
      },
    })
  } catch (error) {
    console.error('Error running Playwright tests:', error)
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
