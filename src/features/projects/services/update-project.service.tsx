'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'

import { getProjectsQueryKey } from '@/features/projects/services/get-projects.service'
import { updateProjectUseCase } from '@/features/projects/use-cases/update-project.use-case'
import type { Project, UpdateProjectInput } from '@/shared/types'

export function useUpdateProjectService(options?: {
  onSuccess?: (data: Project) => void
  onError?: (error: Error) => void
}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      projectId,
      input,
    }: {
      projectId: string
      input: UpdateProjectInput
    }) => updateProjectUseCase(projectId, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: getProjectsQueryKey })
      options?.onSuccess?.(data)
    },
    onError: options?.onError,
  })
}
