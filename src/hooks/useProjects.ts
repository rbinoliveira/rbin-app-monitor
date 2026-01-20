'use client'

import { useCallback, useEffect, useState } from 'react'

import type { Project } from '@/types'

interface UseProjectsState {
  projects: Project[]
  loading: boolean
  error: string | null
}

interface UseProjectsReturn {
  projects: Project[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useProjects(): UseProjectsReturn {
  const [state, setState] = useState<UseProjectsState>({
    projects: [],
    loading: true,
    error: null,
  })

  const fetchProjects = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))

      const response = await fetch('/api/projects')
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch projects')
      }

      setState({
        projects: result.data || [],
        loading: false,
        error: null,
      })
    } catch (err) {
      setState({
        projects: [],
        loading: false,
        error:
          err instanceof Error ? err.message : 'An unexpected error occurred',
      })
    }
  }, [])

  useEffect(() => {
    fetchProjects()

    const interval = setInterval(() => {
      fetchProjects()
    }, 30000)

    return () => clearInterval(interval)
  }, [fetchProjects])

  return {
    projects: state.projects,
    loading: state.loading,
    error: state.error,
    refresh: fetchProjects,
  }
}
