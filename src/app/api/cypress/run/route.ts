import { NextRequest, NextResponse } from 'next/server'

import { requireFirebaseAuth } from '@/features/auth/lib/api-auth'
import {
  acquireLock,
  releaseLock,
} from '@/features/monitoring/services/cypress-lock'
import { callRemoteCypressRun } from '@/features/monitoring/services/cypress-remote'
import { saveCypressResult } from '@/features/monitoring/services/cypress-results'
import { getProjectById } from '@/features/projects/services/projects'
import type { ApiResponse } from '@/shared/types'

export const maxDuration = 300

interface CypressRunRequest {
  projectId?: string
  timeout?: number
}

export async function POST(request: NextRequest) {
  const authResponse = requireFirebaseAuth(request)
  if (authResponse) return authResponse

  const lockId = `cypress-run-${Date.now()}`
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

  try {
    const body = (await request.json().catch(() => ({}))) as CypressRunRequest
    const projectId = body.projectId
    const timeout = body.timeout || 120000

    if (!projectId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'projectId is required' },
        { status: 400 },
      )
    }

    const project = await getProjectById(projectId)

    if (!project.cypressRunUrl) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'No Cypress run URL configured for this project',
        },
        { status: 400 },
      )
    }

    const result = await callRemoteCypressRun(project.cypressRunUrl, {
      timeout,
    })

    await saveCypressResult({
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
