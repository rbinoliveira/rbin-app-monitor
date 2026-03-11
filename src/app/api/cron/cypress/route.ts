import { NextRequest, NextResponse } from 'next/server'

import { requireApiAuth, requireRateLimit } from '@/features/auth/libs/api-auth'
import {
  callGitHubActionsCypressRun,
  parseGithubRepo,
} from '@/features/monitoring/services/cypress-github-actions'
import { saveCypressResult } from '@/features/monitoring/services/cypress-results'
import { sendNotification } from '@/features/monitoring/services/email'
import { sendTelegramNotification } from '@/features/monitoring/services/telegram'
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
    const projectsWithCypress = projects.filter((p) => p.cypressGithubRepo)

    const results = []

    for (const project of projectsWithCypress) {
      try {
        const parsed = parseGithubRepo(project.cypressGithubRepo!)
        if (!parsed) {
          results.push({
            projectId: project.id,
            projectName: project.name,
            success: false,
            error: `Invalid cypressGithubRepo format: ${project.cypressGithubRepo}`,
          })
          continue
        }

        console.log(
          `Dispatching GitHub Actions Cypress for project: ${project.name}`,
        )
        const result = await callGitHubActionsCypressRun(
          parsed.owner,
          parsed.repo,
        )

        await saveCypressResult({
          projectId: project.id,
          projectName: project.name,
          result,
        })

        try {
          const baseUrl =
            process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
          const dashboardUrl = `${baseUrl}/dashboard`

          if (result.success) {
            await sendTelegramNotification({
              type: 'cypress_passed',
              projectId: project.id,
              projectName: project.name,
              details: `All Cypress tests passed.`,
              timestamp: new Date(),
            })
          } else {
            const failedTestsDetails =
              result.failed > 0
                ? `\n<b>Failed Tests:</b> ${result.failed} out of ${result.totalTests}`
                : ''
            const details = `Cypress tests failed for project "${project.name}"${failedTestsDetails}\n\n<b>View Details:</b> <a href="${dashboardUrl}">${dashboardUrl}</a>`

            await Promise.all([
              sendNotification({
                type: 'cypress_failed',
                projectId: project.id,
                projectName: project.name,
                details,
                timestamp: new Date(),
              }),
              sendTelegramNotification({
                type: 'cypress_failed',
                projectId: project.id,
                projectName: project.name,
                details,
                timestamp: new Date(),
              }),
            ])
          }
        } catch (notificationError) {
          console.error(
            `Error sending notification for project ${project.name}:`,
            notificationError,
          )
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
      data: { totalProjects: projectsWithCypress.length, results },
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
