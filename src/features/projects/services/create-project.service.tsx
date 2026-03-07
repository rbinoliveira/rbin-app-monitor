'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'

import { getProjectsQueryKey } from '@/features/projects/services/get-projects.service'
import { createProjectUseCase } from '@/features/projects/use-cases/create-project.use-case'
import type { Project } from '@/shared/types/project.type'

export function useCreateProjectService(options?: {
  onSuccess?: (data: Project) => void
  onError?: (error: Error) => void
}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createProjectUseCase,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: getProjectsQueryKey })
      options?.onSuccess?.(data)
    },
    onError: options?.onError,
  })
}
