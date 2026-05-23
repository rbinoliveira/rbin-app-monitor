'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  deleteGithubIntegrationUseCase,
  getGithubIntegrationUseCase,
  setGithubIntegrationUseCase,
} from '@/features/settings/use-cases/github-integration.use-case'

export const githubIntegrationQueryKey = ['settings', 'github']

export function useGetGithubIntegrationService(enabled = true) {
  return useQuery({
    queryKey: githubIntegrationQueryKey,
    queryFn: getGithubIntegrationUseCase,
    enabled,
  })
}

export function useSetGithubIntegrationService(options?: {
  onSuccess?: () => void
  onError?: (error: Error) => void
}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: setGithubIntegrationUseCase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: githubIntegrationQueryKey })
      options?.onSuccess?.()
    },
    onError: options?.onError,
  })
}

export function useDeleteGithubIntegrationService(options?: {
  onSuccess?: () => void
  onError?: (error: Error) => void
}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteGithubIntegrationUseCase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: githubIntegrationQueryKey })
      options?.onSuccess?.()
    },
    onError: options?.onError,
  })
}
