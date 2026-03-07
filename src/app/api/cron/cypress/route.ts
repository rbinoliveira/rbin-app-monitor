import { NextRequest, NextResponse } from 'next/server'

import { requireApiAuth, requireRateLimit } from '@/features/auth/lib/api-auth'
import { callRemoteCypressRun } from '@/features/monitoring/services/cypress-remote'
import { saveCypressResult } from '@/features/monitoring/services/cypress-results'
import { sendNotification } from '@/features/monitoring/services/email'
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
    const projects = await getActiveProjects()
    const projectsWithCypress = projects.filter(
      (project) => project.cypressRunUrl,
    )

    const results = []

    for (const project of projectsWithCypress) {
      try {
        if (!project.cypressRunUrl) continue

        console.log(`Calling Cypress run URL for project: ${project.name}`)
        const result = await callRemoteCypressRun(project.cypressRunUrl)

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
              `Error sending email notification for project ${project.name}:`,
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
          `Completed Cypress for project: ${project.name} - Success: ${result.success}`,
        )
      } catch (error) {
        console.error(
          `Error running Cypress for project ${project.name}:`,
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
