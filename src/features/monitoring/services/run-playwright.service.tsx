'use client'

import { useMutation } from '@tanstack/react-query'

import type { RunPlaywrightResult } from '@/features/monitoring/use-cases/run-playwright.use-case'
import { runPlaywrightUseCase } from '@/features/monitoring/use-cases/run-playwright.use-case'

export function useRunPlaywrightService(options?: {
  onSuccess?: (data: RunPlaywrightResult) => void
  onError?: (error: Error) => void
}) {
  return useMutation({
    mutationFn: (projectId: string) => runPlaywrightUseCase(projectId),
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  })
}
