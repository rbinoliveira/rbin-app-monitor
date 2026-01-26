'use client'

import { useCallback, useEffect, useState } from 'react'

import type { CypressResult, HealthCheckResult } from '@/types'

export type HistoryItem = HealthCheckResult | CypressResult

export interface UseHistoryFilters {
  type?: 'health_check' | 'cypress' | ''
  projectId?: string
  startDate?: string
  endDate?: string
}

interface UseHistoryOptions {
  page?: number
  pageSize?: number
}

interface UseHistoryState {
  items: HistoryItem[]
  loading: boolean
  error: string | null
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

interface UseHistoryReturn {
  items: HistoryItem[]
  loading: boolean
  error: string | null
  total: number
  page: number
  pageSize: number
  hasMore: boolean
  filters: UseHistoryFilters
  setFilters: (filters: UseHistoryFilters) => void
  setPage: (page: number) => void
  refresh: () => Promise<void>
}

export function useHistory(
  initialFilters: UseHistoryFilters = {},
  options: UseHistoryOptions = {},
): UseHistoryReturn {
  const [filters, setFilters] = useState<UseHistoryFilters>(initialFilters)
  const [page, setPage] = useState(options.page || 1)
  const pageSize = options.pageSize || 20

  const [state, setState] = useState<UseHistoryState>({
    items: [],
    loading: true,
    error: null,
    total: 0,
    page: 1,
    pageSize,
    hasMore: false,
  })

  const fetchHistory = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))

      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      })

      if (filters.type) {
        params.append('type', filters.type)
      }
      if (filters.projectId) {
        params.append('projectId', filters.projectId)
      }
      if (filters.startDate) {
        params.append('startDate', filters.startDate)
      }
      if (filters.endDate) {
        params.append('endDate', filters.endDate)
      }

      const response = await fetch(`/api/history?${params.toString()}`)
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch history')
      }

      setState({
        items: result.data.items || [],
        loading: false,
        error: null,
        total: result.data.total || 0,
        page: result.data.page || 1,
        pageSize: result.data.pageSize || pageSize,
        hasMore: result.data.hasMore || false,
      })
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error:
          err instanceof Error ? err.message : 'An unexpected error occurred',
        items: [],
      }))
    }
  }, [filters, page, pageSize])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  return {
    items: state.items,
    loading: state.loading,
    error: state.error,
    total: state.total,
    page: state.page,
    pageSize: state.pageSize,
    hasMore: state.hasMore,
    filters,
    setFilters,
    setPage,
    refresh: fetchHistory,
  }
}
