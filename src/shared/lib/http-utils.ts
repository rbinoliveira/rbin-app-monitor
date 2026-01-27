/**
 * HTTP utilities for health checks and API requests
 */

import type { HealthCheckResponse } from '@/shared/types'

export interface ValidatedUrl {
  url: string
  parsed: URL
}

export interface HttpRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  headers?: Record<string, string>
  body?: string
  timeout?: number
  expectedStatus?: number
}

export interface UrlValidationResult {
  isValid: boolean
  error?: string
  parsed?: URL
}

/**
 * Validate URL format and protocol
 */
export function validateHttpUrl(url: unknown): UrlValidationResult {
  if (!url || typeof url !== 'string') {
    return {
      isValid: false,
      error: 'URL is required and must be a string',
    }
  }

  let parsedUrl: URL
  try {
    parsedUrl = new URL(url)
  } catch {
    return {
      isValid: false,
      error: 'Invalid URL format',
    }
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    return {
      isValid: false,
      error: 'URL must use HTTP or HTTPS protocol',
    }
  }

  return {
    isValid: true,
    parsed: parsedUrl,
  }
}

/**
 * Execute an HTTP request with timeout and error handling
 */
export async function executeHttpRequest(
  url: string,
  options: HttpRequestOptions = {},
): Promise<HealthCheckResponse> {
  const startTime = Date.now()
  const {
    method = 'GET',
    headers = {},
    body,
    timeout = 30000,
    expectedStatus = 200,
  } = options

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  const requestHeaders: Record<string, string> = {
    'User-Agent': 'RBIN-App-Monitor/1.0',
    ...headers,
  }

  const fetchOptions: RequestInit = {
    method,
    signal: controller.signal,
    headers: requestHeaders,
  }

  if (body) {
    fetchOptions.body = body
  }

  try {
    const response = await fetch(url, fetchOptions)

    const responseTime = Date.now() - startTime
    clearTimeout(timeoutId)

    const statusCode = response.status
    const success = statusCode === expectedStatus

    return {
      success,
      statusCode,
      responseTime,
      errorMessage: success
        ? undefined
        : `HTTP ${statusCode} - Expected ${expectedStatus}`,
    }
  } catch (error) {
    clearTimeout(timeoutId)
    const responseTime = Date.now() - startTime

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          responseTime,
          errorMessage: `Request timeout after ${timeout}ms`,
        }
      }

      if (error.message.includes('fetch failed')) {
        return {
          success: false,
          responseTime,
          errorMessage: `Network error: ${error.message}`,
        }
      }

      return {
        success: false,
        responseTime,
        errorMessage: error.message,
      }
    }

    return {
      success: false,
      responseTime,
      errorMessage: 'Unknown error occurred',
    }
  }
}

/**
 * Execute multiple HTTP requests in parallel
 */
export async function executeParallelRequests(
  requests: Array<{ url: string; options?: HttpRequestOptions }>,
): Promise<HealthCheckResponse[]> {
  return Promise.all(
    requests.map(({ url, options }) => executeHttpRequest(url, options)),
  )
}
