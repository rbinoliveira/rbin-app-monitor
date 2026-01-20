import type { HealthCheckOptions, HealthCheckResponse } from '@/types'

const DEFAULT_TIMEOUT = 30000
const DEFAULT_EXPECTED_STATUS = 200

export async function checkWebPage(
  url: string,
  options?: {
    timeout?: number
    expectedStatus?: number
  },
): Promise<HealthCheckResponse> {
  const startTime = Date.now()
  const timeout = options?.timeout ?? DEFAULT_TIMEOUT
  const expectedStatus = options?.expectedStatus ?? DEFAULT_EXPECTED_STATUS

  if (!url || typeof url !== 'string') {
    return {
      success: false,
      responseTime: 0,
      errorMessage: 'URL is required and must be a string',
    }
  }

  let parsedUrl: URL
  try {
    parsedUrl = new URL(url)
  } catch {
    return {
      success: false,
      responseTime: 0,
      errorMessage: 'Invalid URL format',
    }
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    return {
      success: false,
      responseTime: 0,
      errorMessage: 'URL must use HTTP or HTTPS protocol',
    }
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'RBIN-App-Monitor/1.0',
      },
    })

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

export async function checkRestEndpoint(
  options: HealthCheckOptions,
): Promise<HealthCheckResponse> {
  const startTime = Date.now()
  const timeout = options.timeout ?? DEFAULT_TIMEOUT
  const expectedStatus = options.expectedStatus ?? DEFAULT_EXPECTED_STATUS
  const method = options.method ?? 'GET'

  if (!options.url || typeof options.url !== 'string') {
    return {
      success: false,
      responseTime: 0,
      errorMessage: 'URL is required and must be a string',
    }
  }

  let parsedUrl: URL
  try {
    parsedUrl = new URL(options.url)
  } catch {
    return {
      success: false,
      responseTime: 0,
      errorMessage: 'Invalid URL format',
    }
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    return {
      success: false,
      responseTime: 0,
      errorMessage: 'URL must use HTTP or HTTPS protocol',
    }
  }

  const validMethods = ['GET', 'POST', 'PUT', 'DELETE']
  if (!validMethods.includes(method)) {
    return {
      success: false,
      responseTime: 0,
      errorMessage: `Method must be one of: ${validMethods.join(', ')}`,
    }
  }

  if (options.body && (method === 'GET' || method === 'DELETE')) {
    return {
      success: false,
      responseTime: 0,
      errorMessage: `Body is not allowed for ${method} method`,
    }
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  const headers: Record<string, string> = {
    'User-Agent': 'RBIN-App-Monitor/1.0',
    ...options.headers,
  }

  if (options.body && (method === 'POST' || method === 'PUT')) {
    if (!headers['Content-Type']) {
      headers['Content-Type'] = 'application/json'
    }
  }

  const fetchOptions: RequestInit = {
    method,
    signal: controller.signal,
    headers,
  }

  if (options.body && (method === 'POST' || method === 'PUT')) {
    fetchOptions.body = options.body
  }

  try {
    const response = await fetch(options.url, fetchOptions)

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

export interface WordPressHealthCheckResult extends HealthCheckResponse {
  endpoints: {
    wpJson: HealthCheckResponse
    posts: HealthCheckResponse
    pages: HealthCheckResponse
  }
}

export async function checkWordPress(
  baseUrl: string,
  options?: {
    timeout?: number
  },
): Promise<WordPressHealthCheckResult> {
  const startTime = Date.now()
  const timeout = options?.timeout ?? DEFAULT_TIMEOUT

  if (!baseUrl || typeof baseUrl !== 'string') {
    return {
      success: false,
      responseTime: 0,
      errorMessage: 'Base URL is required and must be a string',
      endpoints: {
        wpJson: {
          success: false,
          responseTime: 0,
          errorMessage: 'Base URL is required',
        },
        posts: {
          success: false,
          responseTime: 0,
          errorMessage: 'Base URL is required',
        },
        pages: {
          success: false,
          responseTime: 0,
          errorMessage: 'Base URL is required',
        },
      },
    }
  }

  let parsedUrl: URL
  try {
    parsedUrl = new URL(baseUrl)
  } catch {
    return {
      success: false,
      responseTime: 0,
      errorMessage: 'Invalid URL format',
      endpoints: {
        wpJson: {
          success: false,
          responseTime: 0,
          errorMessage: 'Invalid URL format',
        },
        posts: {
          success: false,
          responseTime: 0,
          errorMessage: 'Invalid URL format',
        },
        pages: {
          success: false,
          responseTime: 0,
          errorMessage: 'Invalid URL format',
        },
      },
    }
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    return {
      success: false,
      responseTime: 0,
      errorMessage: 'URL must use HTTP or HTTPS protocol',
      endpoints: {
        wpJson: {
          success: false,
          responseTime: 0,
          errorMessage: 'URL must use HTTP or HTTPS protocol',
        },
        posts: {
          success: false,
          responseTime: 0,
          errorMessage: 'URL must use HTTP or HTTPS protocol',
        },
        pages: {
          success: false,
          responseTime: 0,
          errorMessage: 'URL must use HTTP or HTTPS protocol',
        },
      },
    }
  }

  const baseUrlString = `${parsedUrl.protocol}//${parsedUrl.host}${parsedUrl.pathname.replace(/\/$/, '')}`
  const endpoints = {
    wpJson: `${baseUrlString}/wp-json/`,
    posts: `${baseUrlString}/wp-json/wp/v2/posts`,
    pages: `${baseUrlString}/wp-json/wp/v2/pages`,
  }

  const checkEndpoint = async (url: string): Promise<HealthCheckResponse> => {
    const endpointStartTime = Date.now()
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'RBIN-App-Monitor/1.0',
        },
      })

      const responseTime = Date.now() - endpointStartTime
      clearTimeout(timeoutId)

      const statusCode = response.status
      const success = statusCode === 200

      return {
        success,
        statusCode,
        responseTime,
        errorMessage: success ? undefined : `HTTP ${statusCode} - Expected 200`,
      }
    } catch (error) {
      clearTimeout(timeoutId)
      const responseTime = Date.now() - endpointStartTime

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

  const [wpJsonResult, postsResult, pagesResult] = await Promise.all([
    checkEndpoint(endpoints.wpJson),
    checkEndpoint(endpoints.posts),
    checkEndpoint(endpoints.pages),
  ])

  const totalResponseTime = Date.now() - startTime
  const allSuccessful =
    wpJsonResult.success && postsResult.success && pagesResult.success

  return {
    success: allSuccessful,
    responseTime: totalResponseTime,
    statusCode: allSuccessful ? 200 : undefined,
    errorMessage: allSuccessful
      ? undefined
      : `Some endpoints failed: ${[
          !wpJsonResult.success && 'wp-json',
          !postsResult.success && 'posts',
          !pagesResult.success && 'pages',
        ]
          .filter(Boolean)
          .join(', ')}`,
    endpoints: {
      wpJson: wpJsonResult,
      posts: postsResult,
      pages: pagesResult,
    },
  }
}
