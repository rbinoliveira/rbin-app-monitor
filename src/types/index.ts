import type { Timestamp } from 'firebase/firestore'

// ============================================
// Enums and Constants
// ============================================

export type ProjectStatus = 'healthy' | 'unhealthy' | 'unknown'

export type MonitoringType = 'web' | 'rest' | 'wordpress' | 'cypress'

export const MONITORING_TYPE_LABELS: Record<MonitoringType, string> = {
  web: 'Web Page',
  rest: 'REST API',
  wordpress: 'WordPress',
  cypress: 'Cypress Tests',
}

// ============================================
// Firestore Collections
// ============================================

export const COLLECTIONS = {
  PROJECTS: 'projects',
  HEALTH_CHECK_RESULTS: 'healthCheckResults',
  CYPRESS_RESULTS: 'cypressResults',
} as const

// ============================================
// Project Types
// ============================================

export interface Project {
  id: string
  name: string
  baseUrl: string
  monitoringTypes: MonitoringType[]
  status: ProjectStatus
  isActive: boolean
  lastCheckAt: Date | null
  createdAt: Date
  updatedAt: Date
}

// Firestore document type (uses Timestamp instead of Date)
export interface ProjectDoc {
  name: string
  baseUrl: string
  monitoringTypes: MonitoringType[]
  status: ProjectStatus
  isActive: boolean
  lastCheckAt: Timestamp | null
  createdAt: Timestamp
  updatedAt: Timestamp
}

// Create/Update DTOs
export interface CreateProjectInput {
  name: string
  baseUrl: string
  monitoringTypes: MonitoringType[]
}

export interface UpdateProjectInput {
  name?: string
  baseUrl?: string
  monitoringTypes?: MonitoringType[]
  isActive?: boolean
}

// ============================================
// Health Check Types
// ============================================

export interface HealthCheckResult {
  id: string
  projectId: string
  projectName: string
  type: MonitoringType
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
  type: MonitoringType
  url: string
  success: boolean
  statusCode?: number
  responseTime: number
  errorMessage?: string
  timestamp: Timestamp
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
  timestamp: Timestamp
}

// ============================================
// Notification Types
// ============================================

export interface TelegramMessage {
  chatId: string
  message: string
  parseMode?: 'HTML' | 'Markdown'
}

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
// API Response Types
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}
