'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import type { ApiResponse } from '@/shared/types'

interface UseApiOptions {
  autoFetch?: boolean
  refreshInterval?: number
  onSuccess?: (data: unknown) => void
  onError?: (error: Error) => void
}

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

interface UseApiReturn<T> {
  data: T | null
  loading: boolean
  error: string | null
  fetch: () => Promise<void>
  reset: () => void
}

/**
 * Generic hook for API calls with automatic error handling and optional polling
 */
export function useApi<T = unknown>(
  url: string,
  options: UseApiOptions = {},
): UseApiReturn<T> {
  const { autoFetch = true, refreshInterval, onSuccess, onError } = options

  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: autoFetch,
    error: null,
  })

  const isMountedRef = useRef(true)
  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined)

  const fetchData = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))

      const response = await fetch(url)
      const result: ApiResponse<T> = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Request failed')
      }

      if (isMountedRef.current) {
        setState({
          data: (result.data as T) || null,
          loading: false,
          error: null,
        })

        if (onSuccess && result.data) {
          onSuccess(result.data as T)
        }
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')

      if (isMountedRef.current) {
        setState({
          data: null,
          loading: false,
          error: error.message,
        })

        if (onError) {
          onError(error)
        }
      }
    }
  }, [url, onSuccess, onError])

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    })
  }, [])

  useEffect(() => {
    isMountedRef.current = true

    if (autoFetch) {
      fetchData()
    }

    if (refreshInterval && refreshInterval > 0) {
      intervalRef.current = setInterval(fetchData, refreshInterval)
    }

    return () => {
      isMountedRef.current = false
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [autoFetch, fetchData, refreshInterval])

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    fetch: fetchData,
    reset,
  }
}
