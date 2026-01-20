import { NextRequest, NextResponse } from 'next/server'
import { checkRestEndpoint } from '@/services'
import type { ApiResponse, HealthCheckOptions, HealthCheckResponse } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.url || typeof body.url !== 'string') {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'URL is required and must be a string',
        },
        { status: 400 }
      )
    }

    const options: HealthCheckOptions = {
      url: body.url,
    }

    if (body.method) {
      const validMethods = ['GET', 'POST', 'PUT', 'DELETE']
      if (!validMethods.includes(body.method)) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: `Method must be one of: ${validMethods.join(', ')}`,
          },
          { status: 400 }
        )
      }
      options.method = body.method
    }

    if (body.headers) {
      if (typeof body.headers !== 'object' || Array.isArray(body.headers)) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: 'Headers must be an object',
          },
          { status: 400 }
        )
      }
      options.headers = body.headers
    }

    if (body.body !== undefined) {
      if (typeof body.body !== 'string') {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: 'Body must be a string',
          },
          { status: 400 }
        )
      }
      options.body = body.body
    }

    if (body.expectedStatus !== undefined) {
      const expectedStatus = parseInt(String(body.expectedStatus), 10)
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

    if (body.timeout !== undefined) {
      const timeout = parseInt(String(body.timeout), 10)
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

    const result: HealthCheckResponse = await checkRestEndpoint(options)

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

