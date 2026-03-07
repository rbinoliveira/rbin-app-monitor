import { NextRequest, NextResponse } from 'next/server'

import { requireApiAuth, requireRateLimit } from '@/features/auth/lib/api-auth'
import { sendNotification } from '@/features/monitoring/services/email'
import { callRemotePlaywrightRun } from '@/features/monitoring/services/playwright-remote'
import { savePlaywrightResult } from '@/features/monitoring/services/playwright-results'
import { getActiveProjects } from '@/features/projects/services/projects'
import type { ApiResponse } from '@/shared/types/api-response.type'

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
    const projectsWithPlaywright = projects.filter((p) => p.playwrightRunUrl)

    const results = []

    for (const project of projectsWithPlaywright) {
      try {
        if (!project.playwrightRunUrl) continue

        console.log(`Calling Playwright run URL for project: ${project.name}`)
        const result = await callRemotePlaywrightRun(project.playwrightRunUrl)

        await savePlaywrightResult({
          projectId: project.id,
          projectName: project.name,
          result,
        })

        if (!result.success) {
          try {
            const baseUrl =
              process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
            const dashboardUrl = `${baseUrl}/dashboard`
            const failedTestsDetails =
              result.failed > 0
                ? `\n<b>Failed Tests:</b> ${result.failed} out of ${result.totalTests}`
                : ''
            const details = `Playwright tests failed for project "${project.name}"${failedTestsDetails}\n\n<b>View Details:</b> <a href="${dashboardUrl}">${dashboardUrl}</a>`

            await sendNotification({
              type: 'playwright_failed',
              projectId: project.id,
              projectName: project.name,
              details,
              timestamp: new Date(),
            })
          } catch (notificationError) {
            console.error(
              `Error sending notification for project ${project.name}:`,
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
      } catch (error) {
        console.error(
          `Error running Playwright for project ${project.name}:`,
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
      data: { totalProjects: projectsWithPlaywright.length, results },
    })
  } catch (error) {
    console.error('Error in cron Playwright execution:', error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
