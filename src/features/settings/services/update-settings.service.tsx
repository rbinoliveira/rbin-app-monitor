'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'

import { getSettingsQueryKey } from '@/features/settings/services/get-settings.service'
import { updateSettingsUseCase } from '@/features/settings/use-cases/update-settings.use-case'
import type {
  MonitorSettings,
  UpdateMonitorSettingsInput,
} from '@/shared/types/monitor-settings.type'

export function useUpdateSettingsService(options?: {
  onSuccess?: (data: MonitorSettings) => void
  onError?: (error: Error) => void
}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateMonitorSettingsInput) =>
      updateSettingsUseCase(input),
    onSuccess: (data) => {
      queryClient.setQueryData(getSettingsQueryKey, data)
      options?.onSuccess?.(data)
    },
    onError: options?.onError,
  })
}
