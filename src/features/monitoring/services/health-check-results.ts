import { Timestamp } from 'firebase-admin/firestore'

import {
  COLLECTION_NAMES,
  VALID_MONITORING_TYPES,
} from '@/shared/lib/constants'
import { getAdminDb } from '@/shared/lib/firebase-admin'
import type {
  HealthCheckResponse,
  HealthCheckResult,
  HealthCheckResultDoc,
  MonitoringType,
} from '@/shared/types'

const HEALTH_CHECK_RESULTS_COLLECTION = COLLECTION_NAMES.HEALTH_CHECK_RESULTS

function healthCheckResultToFirestore(
  result: HealthCheckResult,
): HealthCheckResultDoc {
  return {
    projectId: result.projectId,
    projectName: result.projectName,
    type: result.type,
    url: result.url,
    success: result.success,
    statusCode: result.statusCode,
    responseTime: result.responseTime,
    errorMessage: result.errorMessage,
    timestamp: Timestamp.fromDate(result.timestamp),
  }
}

export interface SaveHealthCheckResultInput {
  projectId: string
  projectName: string
  type: MonitoringType
  url: string
  result: HealthCheckResponse
}

export async function saveHealthCheckResult(
  input: SaveHealthCheckResultInput,
): Promise<HealthCheckResult> {
  if (!input.projectId || typeof input.projectId !== 'string') {
    throw new Error('Project ID is required')
  }

  if (!input.projectName || typeof input.projectName !== 'string') {
    throw new Error('Project name is required')
  }

  if (!input.type || typeof input.type !== 'string') {
    throw new Error('Monitoring type is required')
  }

  const validTypes = VALID_MONITORING_TYPES as readonly string[]
  if (!validTypes.includes(input.type)) {
    throw new Error(
      `Invalid monitoring type. Must be one of: ${validTypes.join(', ')}`,
    )
  }

  if (!input.url || typeof input.url !== 'string') {
    throw new Error('URL is required')
  }

  if (!input.result || typeof input.result !== 'object') {
    throw new Error('Health check result is required')
  }

  const now = new Date()
  const healthCheckResult: HealthCheckResult = {
    id: '',
    projectId: input.projectId,
    projectName: input.projectName,
    type: input.type,
    url: input.url,
    success: input.result.success,
    statusCode: input.result.statusCode,
    responseTime: input.result.responseTime,
    errorMessage: input.result.errorMessage,
    timestamp: now,
  }

  const docRef = getAdminDb().collection(HEALTH_CHECK_RESULTS_COLLECTION).doc()
  await docRef.set(
    healthCheckResultToFirestore({ ...healthCheckResult, id: docRef.id }),
  )

  return {
    ...healthCheckResult,
    id: docRef.id,
  }
}
