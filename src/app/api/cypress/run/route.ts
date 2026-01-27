import { NextRequest, NextResponse } from 'next/server'

import {
  acquireLock,
  releaseLock,
} from '@/features/monitoring/services/cypress-lock'
import { saveCypressResult } from '@/features/monitoring/services/cypress-results'
import { runCypressTests } from '@/features/monitoring/services/cypress-runner'
import { getProjectById } from '@/features/projects/services/projects'
import type { ApiResponse } from '@/shared/types'

export const maxDuration = 300

interface CypressRunRequest {
  projectId?: string
  timeout?: number
}

export async function POST(request: NextRequest) {
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
    const timeout = body.timeout || 10 * 60 * 1000

    const result = await runCypressTests(projectId, timeout)

    if (projectId) {
      try {
        const project = await getProjectById(projectId)
        if (project) {
          await saveCypressResult({
            projectId,
            projectName: project.name,
            result,
          })
        }
      } catch (error) {
        console.error('Error saving Cypress result:', error)
      }
    }

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
