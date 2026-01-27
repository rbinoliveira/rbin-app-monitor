'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import type { CreateProjectInput } from '@/shared/types'

interface UseCreateProjectState {
  loading: boolean
  error: string | null
}

interface UseCreateProjectReturn {
  loading: boolean
  error: string | null
  createProject: (data: CreateProjectInput) => Promise<void>
}

export function useCreateProject(): UseCreateProjectReturn {
  const router = useRouter()
  const [state, setState] = useState<UseCreateProjectState>({
    loading: false,
    error: null,
  })

  const createProject = async (data: CreateProjectInput) => {
    setState({ loading: true, error: null })

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to create project')
      }

      router.push('/projects')
      router.refresh()
    } catch (err) {
      setState({
        loading: false,
        error:
          err instanceof Error ? err.message : 'An unexpected error occurred',
      })
      throw err
    } finally {
      setState((prev) => ({ ...prev, loading: false }))
    }
  }

  return {
    loading: state.loading,
    error: state.error,
    createProject,
  }
}
