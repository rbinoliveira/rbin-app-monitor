import { NextRequest, NextResponse } from 'next/server'

import { checkWordPress } from '@/features/monitoring/services/health-check'
import type { ApiResponse } from '@/shared/types'

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
        { status: 400 },
      )
    }

    const timeoutParam = searchParams.get('timeout')

    const options: {
      timeout?: number
    } = {}

    if (timeoutParam) {
      const timeout = parseInt(timeoutParam, 10)
      if (isNaN(timeout) || timeout <= 0) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: 'Timeout must be a positive number',
          },
          { status: 400 },
        )
      }
      options.timeout = timeout
    }

    const result = await checkWordPress(url, options)

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: result,
      },
      { status: 200 },
    )
  } catch (error) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
