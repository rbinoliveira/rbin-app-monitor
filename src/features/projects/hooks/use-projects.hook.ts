'use client'

import { useGetProjectsService } from '@/features/projects/services/get-projects.service'
import type { Project } from '@/shared/types/project.type'

interface UseProjectsReturn {
  projects: Project[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useProjects(): UseProjectsReturn {
  const { data, isLoading, error, refetch } = useGetProjectsService()

  return {
    projects: data ?? [],
    loading: isLoading,
    error: error?.message ?? null,
    refresh: async () => {
      await refetch()
    },
  }
}
