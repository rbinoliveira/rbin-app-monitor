import { NextResponse } from 'next/server'

import type { ApiResponse } from '@/shared/types'

/**
 * Custom API Error class for better error handling
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Create a successful API response
 */
export function createSuccessResponse<T = unknown>(
  data: T,
  statusCode: number = 200,
): NextResponse<ApiResponse<T>> {
  return NextResponse.json<ApiResponse<T>>(
    {
      success: true,
      data,
    },
    { status: statusCode },
  )
}

/**
 * Create an error API response
 */
export function createErrorResponse(
  error: unknown,
  defaultStatusCode: number = 500,
): NextResponse<ApiResponse> {
  if (error instanceof ApiError) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: error.message,
        code: error.code,
      },
      { status: error.statusCode },
    )
  }

  const message = error instanceof Error ? error.message : 'Unknown error'

  return NextResponse.json<ApiResponse>(
    {
      success: false,
      error: message,
    },
    { status: defaultStatusCode },
  )
}

/**
 * Wrapper for API route handlers with automatic error handling
 */
export function withErrorHandling<T = unknown>(
  handler: () => Promise<T>,
  options: {
    successStatus?: number
    errorStatus?: number
  } = {},
): Promise<NextResponse<ApiResponse<T | unknown>>> {
  const { successStatus = 200, errorStatus = 500 } = options

  return handler()
    .then((data) => createSuccessResponse(data, successStatus))
    .catch((error) => createErrorResponse(error, errorStatus)) as Promise<
    NextResponse<ApiResponse<T>>
  >
}

/**
 * Async wrapper that catches errors and converts them to ApiError
 */
export async function tryCatch<T>(
  fn: () => Promise<T>,
  errorMessage?: string,
  statusCode?: number,
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    const message =
      errorMessage ||
      (error instanceof Error ? error.message : 'An error occurred')
    throw new ApiError(message, statusCode || 500)
  }
}
