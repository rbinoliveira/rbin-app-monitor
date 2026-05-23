'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  deleteTelegramIntegrationUseCase,
  getTelegramIntegrationUseCase,
  setTelegramIntegrationUseCase,
} from '@/features/settings/use-cases/telegram-integration.use-case'

export const telegramIntegrationQueryKey = ['settings', 'telegram']

export function useGetTelegramIntegrationService(enabled = true) {
  return useQuery({
    queryKey: telegramIntegrationQueryKey,
    queryFn: getTelegramIntegrationUseCase,
    enabled,
  })
}

export function useSetTelegramIntegrationService(options?: {
  onSuccess?: () => void
  onError?: (error: Error) => void
}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: setTelegramIntegrationUseCase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: telegramIntegrationQueryKey })
      options?.onSuccess?.()
    },
    onError: options?.onError,
  })
}

export function useDeleteTelegramIntegrationService(options?: {
  onSuccess?: () => void
  onError?: (error: Error) => void
}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteTelegramIntegrationUseCase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: telegramIntegrationQueryKey })
      options?.onSuccess?.()
    },
    onError: options?.onError,
  })
}
