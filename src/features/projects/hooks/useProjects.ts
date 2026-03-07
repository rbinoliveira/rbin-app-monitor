'use client'

import { useApi } from '@/shared/hooks'
import { REFRESH_INTERVAL } from '@/shared/lib/constants'
import type { Project } from '@/shared/types'

interface UseProjectsReturn {
  projects: Project[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useProjects(): UseProjectsReturn {
  const { data, loading, error, fetch } = useApi<Project[]>('/api/projects', {
    autoFetch: true,
    refreshInterval: REFRESH_INTERVAL.PROJECTS_LIST,
  })

  return {
    projects: data || [],
    loading,
    error,
    refresh: fetch,
  }
}
