import { NextRequest, NextResponse } from 'next/server'

import { requireApiAuth, requireRateLimit } from '@/lib/api-auth'
import {
  checkRestEndpoint,
  checkWebPage,
  checkWordPress,
} from '@/services/health-check'
import { processHealthCheckResult } from '@/services/health-check-notifications'
import { getActiveProjects } from '@/services/projects'
import type { ApiResponse } from '@/types'

export const maxDuration = 300

async function executeHealthCheckForProject(project: {
  id: string
  name: string
  baseUrl: string
  monitoringTypes: string[]
}) {
  const results = []

  for (const monitoringType of project.monitoringTypes) {
    if (monitoringType === 'cypress') {
      continue
    }

    try {
      let result

      if (monitoringType === 'web') {
        result = await checkWebPage(project.baseUrl)
        await processHealthCheckResult({
          projectId: project.id,
          type: 'web',
          url: project.baseUrl,
          result,
        })
      } else if (monitoringType === 'rest') {
        result = await checkRestEndpoint({
          url: project.baseUrl,
          method: 'GET',
        })
        await processHealthCheckResult({
          projectId: project.id,
          type: 'rest',
          url: project.baseUrl,
          result,
        })
      } else if (monitoringType === 'wordpress') {
        const wpResult = await checkWordPress(project.baseUrl)
        result = {
          success: wpResult.success,
          statusCode: wpResult.statusCode,
          responseTime: wpResult.responseTime,
          errorMessage: wpResult.errorMessage,
        }
        await processHealthCheckResult({
          projectId: project.id,
          type: 'wordpress',
          url: project.baseUrl,
          result,
        })
      } else {
        continue
      }

      results.push({
        type: monitoringType,
        success: result.success,
        responseTime: result.responseTime,
      })

      console.log(
        `Health check completed for project ${project.name} (${monitoringType}): ${result.success ? 'Success' : 'Failed'}`,
      )
    } catch (error) {
      console.error(
        `Error executing health check for project ${project.name} (${monitoringType}):`,
        error,
      )
      results.push({
        type: monitoringType,
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
    const allResults = []

    for (const project of projects) {
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
        totalProjects: projects.length,
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
