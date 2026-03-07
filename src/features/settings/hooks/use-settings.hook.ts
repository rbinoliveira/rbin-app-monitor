'use client'

import { useGetSettingsService } from '@/features/settings/services/get-settings.service'
import { useUpdateSettingsService } from '@/features/settings/services/update-settings.service'
import type {
  MonitorSettings,
  UpdateMonitorSettingsInput,
} from '@/shared/types/monitor-settings.type'

export interface UseSettingsReturn {
  settings: MonitorSettings | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  updateSettings: (input: UpdateMonitorSettingsInput) => Promise<void>
  saving: boolean
  saveError: string | null
}

export function useSettings(): UseSettingsReturn {
  const query = useGetSettingsService()
  const {
    mutateAsync: updateSettingsMutate,
    isPending: saving,
    error: saveErrorMutation,
  } = useUpdateSettingsService()

  const saveError =
    saveErrorMutation != null && 'message' in saveErrorMutation
      ? String((saveErrorMutation as Error).message)
      : null

  const updateSettings = async (input: UpdateMonitorSettingsInput) => {
    await updateSettingsMutate(input)
  }

  return {
    settings: query.data ?? null,
    loading: query.isLoading,
    error: query.error?.message ?? null,
    refresh: async () => {
      await query.refetch()
    },
    updateSettings,
    saving,
    saveError,
  }
}
