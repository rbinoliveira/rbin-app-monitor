import { NextRequest, NextResponse } from 'next/server'

import { requireApiAuth, requireRateLimit } from '@/features/auth/lib/api-auth'
import {
  acquireLock,
  releaseLock,
} from '@/features/monitoring/services/cypress-lock'
import { saveCypressResult } from '@/features/monitoring/services/cypress-results'
import { runCypressTests } from '@/features/monitoring/services/cypress-runner'
import { sendNotification } from '@/features/monitoring/services/telegram'
import { getActiveProjects } from '@/features/projects/services/projects'
import type { ApiResponse } from '@/shared/types'

export const maxDuration = 300

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
    const lockAcquired = await acquireLock('cypress-execution')
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
      const projects = await getActiveProjects()
      const projectsWithCypress = projects.filter((project) =>
        project.monitoringTypes.includes('cypress'),
      )

      const results = []

      for (const project of projectsWithCypress) {
        try {
          console.log(`Running Cypress tests for project: ${project.name}`)
          const result = await runCypressTests(project.id)

          await saveCypressResult({
            projectId: project.id,
            projectName: project.name,
            result,
          })

          if (!result.success) {
            try {
              const baseUrl =
                process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
              const dashboardUrl = `${baseUrl}/projects`

              const failedTestsDetails =
                result.failed > 0
                  ? `\n<b>Failed Tests:</b> ${result.failed} out of ${result.totalTests}`
                  : ''

              const details = `Cypress tests failed for project "${project.name}"${failedTestsDetails}\n\n<b>View Details:</b> <a href="${dashboardUrl}">${dashboardUrl}</a>`

              await sendNotification({
                type: 'cypress_failed',
                projectId: project.id,
                projectName: project.name,
                details,
                timestamp: new Date(),
              })
            } catch (notificationError) {
              console.error(
                `Error sending Telegram notification for project ${project.name}:`,
                notificationError,
              )
            }
          }

          results.push({
            projectId: project.id,
            projectName: project.name,
            success: result.success,
            totalTests: result.totalTests,
            passed: result.passed,
            failed: result.failed,
          })

          console.log(
            `Completed Cypress tests for project: ${project.name} - Success: ${result.success}`,
          )
        } catch (error) {
          console.error(
            `Error running Cypress tests for project ${project.name}:`,
            error,
          )
          results.push({
            projectId: project.id,
            projectName: project.name,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }

      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          totalProjects: projectsWithCypress.length,
          results,
        },
      })
    } finally {
      await releaseLock('cypress-execution')
    }
  } catch (error) {
    await releaseLock('cypress-execution').catch(() => {})
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
