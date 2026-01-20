import { NextRequest, NextResponse } from 'next/server'
import { checkWebPage } from '@/services'
import type { ApiResponse, HealthCheckResponse } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const url = searchParams.get('url')

    if (!url) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'URL parameter is required',
        },
        { status: 400 }
      )
    }

    const timeoutParam = searchParams.get('timeout')
    const expectedStatusParam = searchParams.get('expectedStatus')

    const options: {
      timeout?: number
      expectedStatus?: number
    } = {}

    if (timeoutParam) {
      const timeout = parseInt(timeoutParam, 10)
      if (isNaN(timeout) || timeout <= 0) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: 'Timeout must be a positive number',
          },
          { status: 400 }
        )
      }
      options.timeout = timeout
    }

    if (expectedStatusParam) {
      const expectedStatus = parseInt(expectedStatusParam, 10)
      if (isNaN(expectedStatus) || expectedStatus < 100 || expectedStatus >= 600) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: 'Expected status must be a valid HTTP status code (100-599)',
          },
          { status: 400 }
        )
      }
      options.expectedStatus = expectedStatus
    }

    const result: HealthCheckResponse = await checkWebPage(url, options)

    return NextResponse.json<ApiResponse<HealthCheckResponse>>(
      {
        success: true,
        data: result,
      },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

