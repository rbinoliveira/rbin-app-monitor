import { NextRequest, NextResponse } from 'next/server'

import { requireFirebaseAuth } from '@/features/auth/libs/api-auth'
import type { ApiResponse } from '@/shared/types/api-response.type'

export async function POST(request: NextRequest) {
  const authResponse = requireFirebaseAuth(request)
  if (authResponse) return authResponse

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
