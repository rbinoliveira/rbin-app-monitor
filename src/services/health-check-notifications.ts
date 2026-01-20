import type {
  HealthCheckResponse,
  MonitoringType,
  ProjectStatus,
} from '@/types'

import { saveHealthCheckResult } from './health-check-results'
import { getProjectById, updateProjectStatus } from './projects'
import { sendNotification } from './telegram'

export interface ProcessHealthCheckResultInput {
  projectId: string
  type: MonitoringType
  url: string
  result: HealthCheckResponse
}

export async function processHealthCheckResult(
  input: ProcessHealthCheckResultInput,
): Promise<void> {
  const project = await getProjectById(input.projectId)

  if (!project) {
    throw new Error('Project not found')
  }

  const previousStatus = project.status
  const newStatus: ProjectStatus = input.result.success
    ? 'healthy'
    : 'unhealthy'
  const statusChanged = previousStatus !== newStatus

  await saveHealthCheckResult({
    projectId: input.projectId,
    projectName: project.name,
    type: input.type,
    url: input.url,
    result: input.result,
  })

  await updateProjectStatus(input.projectId, newStatus, new Date())

  if (statusChanged) {
    if (newStatus === 'unhealthy') {
      await sendNotification({
        type: 'health_check_failed',
        projectId: input.projectId,
        projectName: project.name,
        details:
          input.result.errorMessage || `Health check failed for ${input.type}`,
        timestamp: new Date(),
      })
    } else if (newStatus === 'healthy' && previousStatus === 'unhealthy') {
      await sendNotification({
        type: 'health_check_restored',
        projectId: input.projectId,
        projectName: project.name,
        details: `Service restored - ${input.type} check passed`,
        timestamp: new Date(),
      })
    }
  }
}
