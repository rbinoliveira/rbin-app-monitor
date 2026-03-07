import { NextRequest } from 'next/server'

import { requireFirebaseAuth } from '@/features/auth/lib/api-auth'
import {
  getSettings,
  updateSettings,
} from '@/features/settings/services/settings'
import { withErrorHandling } from '@/shared/lib/api-response'
import type {
  MonitorSettings,
  UpdateMonitorSettingsInput,
} from '@/shared/types/monitor-settings.type'

export async function GET(request: NextRequest) {
  const authResponse = requireFirebaseAuth(request)
  if (authResponse) return authResponse

  return withErrorHandling<MonitorSettings>(async () => {
    return await getSettings()
  })
}

export async function PATCH(request: NextRequest) {
  const authResponse = requireFirebaseAuth(request)
  if (authResponse) return authResponse

  return withErrorHandling<MonitorSettings>(
    async () => {
      const body: UpdateMonitorSettingsInput = await request.json()
      return await updateSettings(body)
    },
    { errorStatus: 400 },
  )
}
