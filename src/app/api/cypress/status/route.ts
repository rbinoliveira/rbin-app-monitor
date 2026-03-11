import { NextRequest, NextResponse } from 'next/server'

import { requireFirebaseAuth } from '@/features/auth/libs/api-auth'
import { isLockActive } from '@/features/monitoring/services/cypress-lock'
import type { ApiResponse } from '@/shared/types/api-response.type'

export async function GET(request: NextRequest) {
  const authResponse = requireFirebaseAuth(request)
  if (authResponse) return authResponse

  const projectId = request.nextUrl.searchParams.get('projectId')
  if (!projectId) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'projectId is required' },
      { status: 400 },
    )
  }

  const running = await isLockActive(`cypress-run-${projectId}`)
  return NextResponse.json<ApiResponse>({ success: true, data: { running } })
}
