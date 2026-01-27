import { NextRequest, NextResponse } from 'next/server'

import type { ApiResponse } from '@/shared/types'

export async function POST(_request: NextRequest) {
  try {
    return NextResponse.json<ApiResponse>({
      success: true,
      data: { message: 'Cypress endpoint ready' },
    })
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
