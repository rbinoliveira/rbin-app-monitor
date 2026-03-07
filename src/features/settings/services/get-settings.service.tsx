'use client'

import { useQuery } from '@tanstack/react-query'

import { getSettingsUseCase } from '@/features/settings/use-cases/get-settings.use-case'
import type { MonitorSettings } from '@/shared/types/monitor-settings.type'

export const getSettingsQueryKey = ['settings']

export function useGetSettingsService() {
  return useQuery<MonitorSettings>({
    queryKey: getSettingsQueryKey,
    queryFn: getSettingsUseCase,
  })
}
