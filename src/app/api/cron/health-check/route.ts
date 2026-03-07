import { NextRequest, NextResponse } from 'next/server'

import { requireApiAuth, requireRateLimit } from '@/features/auth/lib/api-auth'
import {
  checkRestEndpoint,
  checkWebPage,
} from '@/features/monitoring/services/health-check'
import { processHealthCheckResult } from '@/features/monitoring/services/health-check-notifications'
import { getActiveProjects } from '@/features/projects/services/projects'
import type { ApiResponse } from '@/shared/types'

export const maxDuration = 300

async function executeHealthCheckForProject(project: {
  id: string
  name: string
  frontHealthCheckUrl: string | null
  backHealthCheckUrl: string | null
}) {
  const results: Array<{
    type: 'front' | 'back'
    success: boolean
    responseTime?: number
    error?: string
  }> = []

  if (project.frontHealthCheckUrl) {
    try {
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
        responseTime: result.responseTime,
      })
    } catch (error) {
      console.error(
        `Error executing front health check for project ${project.name}:`,
        error,
      )
      results.push({
        type: 'front',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  if (project.backHealthCheckUrl) {
    try {
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
        responseTime: result.responseTime,
      })
    } catch (error) {
      console.error(
        `Error executing back health check for project ${project.name}:`,
        error,
      )
      results.push({
        type: 'back',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return results
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

  try {
    const projects = await getActiveProjects()
    const projectsWithHealth = projects.filter(
      (p) => p.frontHealthCheckUrl || p.backHealthCheckUrl,
    )
    const allResults = []

    for (const project of projectsWithHealth) {
      try {
        console.log(`Running health checks for project: ${project.name}`)
        const projectResults = await executeHealthCheckForProject(project)
        allResults.push({
          projectId: project.id,
          projectName: project.name,
          results: projectResults,
        })
      } catch (error) {
        console.error(
          `Error processing health checks for project ${project.name}:`,
          error,
        )
        allResults.push({
          projectId: project.id,
          projectName: project.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        totalProjects: projectsWithHealth.length,
        results: allResults,
      },
    })
  } catch (error) {
    console.error('Error in cron health check execution:', error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
