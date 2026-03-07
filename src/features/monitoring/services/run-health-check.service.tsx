'use client'

import { useMutation } from '@tanstack/react-query'

import type { RunHealthCheckResult } from '@/features/monitoring/use-cases/run-health-check.use-case'
import { runHealthCheckUseCase } from '@/features/monitoring/use-cases/run-health-check.use-case'

export function useRunHealthCheckService(options?: {
  onSuccess?: (data: RunHealthCheckResult) => void
  onError?: (error: Error) => void
}) {
  return useMutation({
    mutationFn: (projectId: string) => runHealthCheckUseCase(projectId),
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  })
}
