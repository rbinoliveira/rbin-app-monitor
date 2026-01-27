import { VALID_HTTP_METHODS } from '@/shared/lib/constants'
import { executeHttpRequest, validateHttpUrl } from '@/shared/lib/http-utils'
import type { HealthCheckOptions, HealthCheckResponse } from '@/shared/types'

export const DEFAULT_HEALTH_CHECK_TIMEOUT = 30000
export const DEFAULT_EXPECTED_STATUS = 200

const DEFAULT_TIMEOUT = DEFAULT_HEALTH_CHECK_TIMEOUT

export async function checkWebPage(
  url: string,
  options?: {
    timeout?: number
    expectedStatus?: number
  },
): Promise<HealthCheckResponse> {
  const validation = validateHttpUrl(url)
  if (!validation.isValid) {
    return {
      success: false,
      responseTime: 0,
      errorMessage: validation.error,
    }
  }

  return executeHttpRequest(url, {
    method: 'GET',
    timeout: options?.timeout ?? DEFAULT_TIMEOUT,
    expectedStatus: options?.expectedStatus ?? DEFAULT_EXPECTED_STATUS,
  })
}

export async function checkRestEndpoint(
  options: HealthCheckOptions,
): Promise<HealthCheckResponse> {
  const method = options.method ?? 'GET'

  const validation = validateHttpUrl(options.url)
  if (!validation.isValid) {
    return {
      success: false,
      responseTime: 0,
      errorMessage: validation.error,
    }
  }

  const validMethods = VALID_HTTP_METHODS as readonly string[]
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

  const headers: Record<string, string> = {
    ...options.headers,
  }

  if (options.body && (method === 'POST' || method === 'PUT')) {
    if (!headers['Content-Type']) {
      headers['Content-Type'] = 'application/json'
    }
  }

  return executeHttpRequest(options.url, {
    method,
    headers,
    body: options.body,
    timeout: options.timeout ?? DEFAULT_TIMEOUT,
    expectedStatus: options.expectedStatus ?? DEFAULT_EXPECTED_STATUS,
  })
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

  const validation = validateHttpUrl(baseUrl)
  if (!validation.isValid || !validation.parsed) {
    const errorResult = {
      success: false,
      responseTime: 0,
      errorMessage: validation.error || 'Invalid URL',
    }
    return {
      ...errorResult,
      endpoints: {
        wpJson: errorResult,
        posts: errorResult,
        pages: errorResult,
      },
    }
  }

  const parsedUrl = validation.parsed
  const baseUrlString = `${parsedUrl.protocol}//${parsedUrl.host}${parsedUrl.pathname.replace(/\/$/, '')}`

  const endpointUrls = [
    { url: `${baseUrlString}/wp-json/`, options: { timeout } },
    { url: `${baseUrlString}/wp-json/wp/v2/posts`, options: { timeout } },
    { url: `${baseUrlString}/wp-json/wp/v2/pages`, options: { timeout } },
  ]

  const [wpJsonResult, postsResult, pagesResult] = await Promise.all(
    endpointUrls.map(({ url, options }) => executeHttpRequest(url, options)),
  )

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
