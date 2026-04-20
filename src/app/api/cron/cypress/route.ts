import { NextRequest, NextResponse } from 'next/server'

import { requireApiAuth, requireRateLimit } from '@/features/auth/libs/api-auth'
import {
  callGitHubActionsCypressRun,
  parseGithubRepo,
} from '@/features/monitoring/services/cypress-github-actions'
import { sendCypressNotifications } from '@/features/monitoring/services/cypress-notify'
import { saveCypressResult } from '@/features/monitoring/services/cypress-results'
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

    const results = await Promise.all(
      projectsWithCypress.map(async (project) => {
        try {
          const parsed = parseGithubRepo(project.cypressGithubRepo!)
          if (!parsed) {
            return {
              projectId: project.id,
              projectName: project.name,
              success: false,
              error: `Invalid cypressGithubRepo format: ${project.cypressGithubRepo}`,
            }
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
            trigger: 'cron',
          })

          try {
            await sendCypressNotifications({
              result,
              projectId: project.id,
              projectName: project.name,
              trigger: 'cron',
            })
          } catch (notificationError) {
            console.error(
              `Error sending notification for project ${project.name}:`,
              notificationError,
            )
          }

          return {
            projectId: project.id,
            projectName: project.name,
            success: result.success,
            totalTests: result.totalTests,
            passed: result.passed,
            failed: result.failed,
          }
        } catch (error) {
          console.error(
            `Error running Cypress for project ${project.name}:`,
            error,
          )
          return {
            projectId: project.id,
            projectName: project.name,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          }
        }
      }),
    )

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
