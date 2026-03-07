import type { FirestoreTimestamp } from '@/shared/types/firestore.type'

export type HealthCheckType = 'front' | 'back'

export interface HealthCheckResult {
  id: string
  projectId: string
  projectName: string
  type: HealthCheckType
  url: string
  success: boolean
  statusCode?: number
  responseTime: number
  errorMessage?: string
  timestamp: Date
}

export interface HealthCheckResultDoc {
  projectId: string
  projectName: string
  type: HealthCheckType
  url: string
  success: boolean
  statusCode?: number
  responseTime: number
  errorMessage?: string
  timestamp: FirestoreTimestamp
}

export interface HealthCheckOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  headers?: Record<string, string>
  body?: string
  expectedStatus?: number
  timeout?: number
}

export interface HealthCheckResponse {
  success: boolean
  statusCode?: number
  responseTime: number
  errorMessage?: string
}
