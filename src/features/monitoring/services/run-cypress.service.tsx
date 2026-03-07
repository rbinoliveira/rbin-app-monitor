'use client'

import { useMutation } from '@tanstack/react-query'

import type { RunCypressResult } from '@/features/monitoring/use-cases/run-cypress.use-case'
import { runCypressUseCase } from '@/features/monitoring/use-cases/run-cypress.use-case'

export function useRunCypressService(options?: {
  onSuccess?: (data: RunCypressResult) => void
  onError?: (error: Error) => void
}) {
  return useMutation({
    mutationFn: (projectId: string) => runCypressUseCase(projectId),
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  })
}
