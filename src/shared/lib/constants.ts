/**
 * Application-wide constants
 */

// ============================================
// Timeout Constants
// ============================================

export const TIMEOUT = {
  HEALTH_CHECK: 30000, // 30 seconds
  CYPRESS_RUN: 600000, // 10 minutes
  API_REQUEST: 60000, // 1 minute
} as const

// ============================================
// Refresh Intervals
// ============================================

export const REFRESH_INTERVAL = {
  PROJECTS_LIST: 30000, // 30 seconds
  DASHBOARD: 60000, // 1 minute
} as const

// ============================================
// Pagination Defaults
// ============================================

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const

// ============================================
// Rate Limiting
// ============================================

export const RATE_LIMIT = {
  DEFAULT_MAX_REQUESTS: 100,
  DEFAULT_WINDOW_MS: 60000, // 1 minute
} as const

// ============================================
// Notification Constants
// ============================================

export const NOTIFICATION = {
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
  RETRY_BACKOFF_MULTIPLIER: 2,
} as const

// ============================================
// HTTP Status Codes
// ============================================

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const

// ============================================
// Error Codes
// ============================================

export const ERROR_CODE = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
} as const

// ============================================
// Firestore Collection Names
// ============================================

export const COLLECTION_NAMES = {
  PROJECTS: 'projects',
  HEALTH_CHECK_RESULTS: 'healthCheckResults',
  CYPRESS_RESULTS: 'cypressResults',
  LOCKS: 'locks',
} as const

// ============================================
// Monitoring Types
// ============================================

export const VALID_MONITORING_TYPES = [
  'web',
  'rest',
  'wordpress',
  'cypress',
] as const

export const VALID_HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE'] as const
