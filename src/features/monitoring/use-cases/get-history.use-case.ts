import type { CypressResult } from '@/shared/types/cypress-result.type'

export type HistoryItem = CypressResult

export interface UseHistoryFilters {
  type?: 'health_check' | 'cypress' | ''
  projectId?: string
  startDate?: string
  endDate?: string
}

export interface GetHistoryParams {
  page?: number
  pageSize?: number
  type?: string
  projectId?: string
  startDate?: string
  endDate?: string
}

export interface GetHistoryResult {
  items: HistoryItem[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export async function getHistoryUseCase(
  params: GetHistoryParams = {},
): Promise<GetHistoryResult> {
  const searchParams = new URLSearchParams()

  if (params.page != null) searchParams.set('page', String(params.page))
  if (params.pageSize != null)
    searchParams.set('pageSize', String(params.pageSize))
  if (params.type) searchParams.set('type', params.type)
  if (params.projectId) searchParams.set('projectId', params.projectId)
  if (params.startDate) searchParams.set('startDate', params.startDate)
  if (params.endDate) searchParams.set('endDate', params.endDate)

  const response = await fetch(`/api/history?${searchParams.toString()}`, {
    credentials: 'include',
  })

  const result = await response.json()

  if (!response.ok || !result.success) {
    throw new Error(result.error ?? 'Falha ao carregar histórico')
  }

  const data = result.data ?? {}
  return {
    items: data.items ?? [],
    total: data.total ?? 0,
    page: data.page ?? 1,
    pageSize: data.pageSize ?? 20,
    hasMore: data.hasMore ?? false,
  }
}
