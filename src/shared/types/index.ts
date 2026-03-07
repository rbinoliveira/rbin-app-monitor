// ============================================
// Enums and Constants
// ============================================

export type ProjectStatus = 'healthy' | 'unhealthy' | 'unknown'

export type HealthCheckType = 'front' | 'back'

// Firestore Timestamp type (compatible with both client and admin SDK)
export type FirestoreTimestamp = {
  toDate(): Date
  toMillis(): number
}

export const HEALTH_CHECK_TYPE_LABELS: Record<HealthCheckType, string> = {
  front: 'Front',
  back: 'Back',
}

// ============================================
// Project Types
// ============================================

export interface Project {
  id: string
  name: string
  frontHealthCheckUrl: string | null
  backHealthCheckUrl: string | null
  cypressRunUrl: string | null
  status: ProjectStatus
  isActive: boolean
  lastCheckAt: Date | null
  createdAt: Date
  updatedAt: Date
}

// Firestore document type (uses Timestamp instead of Date)
export interface ProjectDoc {
  name: string
  frontHealthCheckUrl: string | null
  backHealthCheckUrl: string | null
  cypressRunUrl: string | null
  status: ProjectStatus
  isActive: boolean
  lastCheckAt: FirestoreTimestamp | null
  createdAt: FirestoreTimestamp
  updatedAt: FirestoreTimestamp
}

// Create/Update DTOs
export interface CreateProjectInput {
  name: string
  frontHealthCheckUrl?: string | null
  backHealthCheckUrl?: string | null
  cypressRunUrl?: string | null
}

export interface UpdateProjectInput {
  name?: string
  frontHealthCheckUrl?: string | null
  backHealthCheckUrl?: string | null
  cypressRunUrl?: string | null
  isActive?: boolean
}

// ============================================
// Health Check Types
// ============================================

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

// Firestore document type
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

// Health check request options
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

// ============================================
// Cypress Test Types
// ============================================

export interface CypressResult {
  id: string
  projectId: string
  projectName: string
  success: boolean
  totalTests: number
  passed: number
  failed: number
  skipped: number
  duration: number
  specFiles: string[]
  output: string
  timestamp: Date
}

// Firestore document type
export interface CypressResultDoc {
  projectId: string
  projectName: string
  success: boolean
  totalTests: number
  passed: number
  failed: number
  skipped: number
  duration: number
  specFiles: string[]
  output: string
  timestamp: FirestoreTimestamp
}

// ============================================
// Notification Types
// ============================================

export type NotificationType =
  | 'health_check_failed'
  | 'health_check_restored'
  | 'cypress_failed'
  | 'cypress_passed'

export interface NotificationPayload {
  type: NotificationType
  projectId: string
  projectName: string
  details: string
  timestamp: Date
}

// ============================================
// Monitor Settings Types
// ============================================

export interface MonitorSettings {
  healthCheckIntervalHours: number
  cypressIntervalHours: number
  updatedAt: Date
}

export interface MonitorSettingsDoc {
  healthCheckIntervalHours: number
  cypressIntervalHours: number
  updatedAt: FirestoreTimestamp
}

export interface UpdateMonitorSettingsInput {
  healthCheckIntervalHours?: number
  cypressIntervalHours?: number
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  code?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}
