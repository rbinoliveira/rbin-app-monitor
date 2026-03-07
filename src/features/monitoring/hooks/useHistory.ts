'use client'

import { useState } from 'react'

import { useGetHistoryService } from '@/features/monitoring/services/get-history.service'
import type {
  HistoryItem,
  UseHistoryFilters,
} from '@/features/monitoring/use-cases/get-history.use-case'

export type { HistoryItem, UseHistoryFilters }

interface UseHistoryOptions {
  page?: number
  pageSize?: number
}

export interface UseHistoryReturn {
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
  const [page, setPage] = useState(options.page ?? 1)
  const pageSize = options.pageSize ?? 20

  const query = useGetHistoryService(filters, { page, pageSize })

  return {
    items: query.data?.items ?? [],
    loading: query.isLoading,
    error: query.error?.message ?? null,
    total: query.data?.total ?? 0,
    page: query.data?.page ?? page,
    pageSize: query.data?.pageSize ?? pageSize,
    hasMore: query.data?.hasMore ?? false,
    filters,
    setFilters,
    setPage,
    refresh: async () => {
      await query.refetch()
    },
  }
}
