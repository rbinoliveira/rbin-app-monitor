import { NextRequest } from 'next/server'

import { getSettings, updateSettings } from '@/features/settings/services/settings'
import { withErrorHandling } from '@/shared/lib/api-response'
import type { MonitorSettings, UpdateMonitorSettingsInput } from '@/shared/types'

export async function GET(_request: NextRequest) {
  return withErrorHandling<MonitorSettings>(async () => {
    return await getSettings()
  })
}

export async function PATCH(request: NextRequest) {
  return withErrorHandling<MonitorSettings>(
    async () => {
      const body: UpdateMonitorSettingsInput = await request.json()
      return await updateSettings(body)
    },
    { errorStatus: 400 },
  )
}
