import { NextRequest, NextResponse } from 'next/server'
import type { ApiResponse } from '@/types'

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json<ApiResponse>({
      success: true,
      data: { message: 'Health check endpoint ready' },
    })
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

export async function POST(request: NextRequest) {
  try {
    return NextResponse.json<ApiResponse>({
      success: true,
      data: { message: 'Health check endpoint ready' },
    })
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

