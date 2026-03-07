'use client'

import { useQuery } from '@tanstack/react-query'

import {
  type GetHistoryParams,
  getHistoryUseCase,
  type UseHistoryFilters,
} from '@/features/monitoring/use-cases/get-history.use-case'

export function getHistoryQueryKey(
  params: GetHistoryParams & { filters: UseHistoryFilters },
): unknown[] {
  return ['history', params.page, params.pageSize, params.filters]
}

export function useGetHistoryService(
  filters: UseHistoryFilters = {},
  options: { page?: number; pageSize?: number } = {},
) {
  const page = options.page ?? 1
  const pageSize = options.pageSize ?? 20

  const params: GetHistoryParams = {
    page,
    pageSize,
    type: filters.type || undefined,
    projectId: filters.projectId || undefined,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
  }

  return useQuery({
    queryKey: getHistoryQueryKey({ ...params, filters }),
    queryFn: () => getHistoryUseCase(params),
  })
}
