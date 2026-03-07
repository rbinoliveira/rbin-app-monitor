import { NextRequest, NextResponse } from 'next/server'

import {
  requireFirebaseAuth,
  requireRateLimit,
} from '@/features/auth/libs/api-auth'
import {
  checkRestEndpoint,
  checkWebPage,
} from '@/features/monitoring/services/health-check'
import { processHealthCheckResult } from '@/features/monitoring/services/health-check-notifications'
import { getProjectById } from '@/features/projects/services/projects'
import type { ApiResponse } from '@/shared/types/api-response.type'

interface HealthCheckRequest {
  projectId?: string
}

export async function GET(request: NextRequest) {
  const authResponse = requireFirebaseAuth(request)
  if (authResponse) return authResponse

  return NextResponse.json<ApiResponse>({
    success: true,
    data: { message: 'Health check endpoint ready' },
  })
}

export async function POST(request: NextRequest) {
  const authResponse = requireFirebaseAuth(request)
  if (authResponse) return authResponse

  const rateLimitResponse = requireRateLimit(request, {
    maxRequests: 30,
    windowMs: 60000,
  })
  if (rateLimitResponse) return rateLimitResponse

  try {
    const body = (await request.json().catch(() => ({}))) as HealthCheckRequest
    const projectId = body.projectId

    if (!projectId) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'projectId is required',
        },
        { status: 400 },
      )
    }

    const project = await getProjectById(projectId)
    const results: Array<{
      type: 'front' | 'back'
      success: boolean
      statusCode?: number
      responseTime: number
      errorMessage?: string
      url: string
    }> = []

    if (project.frontHealthCheckUrl) {
      const result = await checkWebPage(project.frontHealthCheckUrl)
      await processHealthCheckResult({
        projectId: project.id,
        type: 'front',
        url: project.frontHealthCheckUrl,
        result,
      })
      results.push({
        type: 'front',
        success: result.success,
        statusCode: result.statusCode,
        responseTime: result.responseTime,
        errorMessage: result.errorMessage,
        url: project.frontHealthCheckUrl,
      })
    }

    if (project.backHealthCheckUrl) {
      const result = await checkRestEndpoint({
        url: project.backHealthCheckUrl,
        method: 'GET',
      })
      await processHealthCheckResult({
        projectId: project.id,
        type: 'back',
        url: project.backHealthCheckUrl,
        result,
      })
      results.push({
        type: 'back',
        success: result.success,
        statusCode: result.statusCode,
        responseTime: result.responseTime,
        errorMessage: result.errorMessage,
        url: project.backHealthCheckUrl,
      })
    }

    if (results.length === 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'No health check URL configured for this project',
        },
        { status: 400 },
      )
    }

    return NextResponse.json<ApiResponse>({
      success: results.every((result) => result.success),
      data: {
        projectId: project.id,
        projectName: project.name,
        results,
      },
    })
  } catch (error) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
