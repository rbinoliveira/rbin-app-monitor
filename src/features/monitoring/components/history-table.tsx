'use client'

import { useMemo } from 'react'

import type {
  HistoryItem,
  UseHistoryFilters,
} from '@/features/monitoring/hooks/use-history.hook'
import { HistoryTableFilters } from '@/features/monitoring/components/history-table-filters'
import {
  HistoryTableHealthCheckRow,
  HistoryTableTestRow,
  isHealthCheckResult,
  isTestResultItem,
} from '@/features/monitoring/components/history-table-row'
import { Button } from '@/shared/components/button'
import { Card } from '@/shared/components/card'
import type { CypressResult } from '@/shared/types/cypress-result.type'
import type { HealthCheckResult } from '@/shared/types/health-check.type'
import type { PlaywrightResult } from '@/shared/types/playwright-result.type'
import type { Project } from '@/shared/types/project.type'

interface HistoryTableProps {
  items: HistoryItem[]
  loading: boolean
  filters: UseHistoryFilters
  onFiltersChange: (filters: UseHistoryFilters) => void
  projects: Project[]
  page: number
  hasMore: boolean
  onPageChange: (page: number) => void
}

export function HistoryTable({
  items,
  loading,
  filters,
  onFiltersChange,
  projects,
  page,
  hasMore,
  onPageChange,
}: HistoryTableProps) {
  const formattedItems = useMemo(() => {
    return items
      .map((item): (HealthCheckResult | CypressResult | PlaywrightResult) | null => {
        if (isHealthCheckResult(item) || isTestResultItem(item)) return item
        return null
      })
      .filter(Boolean)
  }, [items])

  return (
    <div className="space-y-4">
      <HistoryTableFilters
        filters={filters}
        onFiltersChange={onFiltersChange}
        projects={projects}
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Projeto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Detalhes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Data/hora
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <svg
                        className="h-8 w-8 animate-spin text-primary-600"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <p className="mt-4 text-sm text-gray-500">
                        Carregando histórico...
                      </p>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && formattedItems.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-sm text-gray-500"
                  >
                    Nenhum registro encontrado
                  </td>
                </tr>
              )}

              {!loading &&
                formattedItems.map((item) => {
                  if (!item) return null
                  if (isHealthCheckResult(item)) {
                    return (
                      <HistoryTableHealthCheckRow key={item.id} item={item} />
                    )
                  }
                  if (isTestResultItem(item)) {
                    return (
                      <HistoryTableTestRow key={item.id} item={item} />
                    )
                  }
                  return null
                })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-3">
          <div className="text-sm text-gray-700">Page {page}</div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={page <= 1 || loading}
              onClick={() => onPageChange(page - 1)}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={!hasMore || loading}
              onClick={() => onPageChange(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
