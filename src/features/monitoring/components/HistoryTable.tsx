'use client'

import { useMemo } from 'react'

import type {
  HistoryItem,
  UseHistoryFilters,
} from '@/features/monitoring/hooks/useHistory'
import { Button } from '@/shared/components/ui/Button'
import { Card } from '@/shared/components/ui/Card'
import { Input } from '@/shared/components/ui/Input'
import type { CypressResult, HealthCheckResult, Project } from '@/shared/types'
import { MONITORING_TYPE_LABELS } from '@/shared/types'

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

function isHealthCheckResult(item: HistoryItem): item is HealthCheckResult {
  return 'type' in item && 'url' in item
}

function isCypressResult(item: HistoryItem): item is CypressResult {
  return 'totalTests' in item && 'passed' in item
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
  const handleFilterChange = (key: keyof UseHistoryFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined,
    })
  }

  const formattedItems = useMemo(() => {
    return items
      .map((item) => {
        if (isHealthCheckResult(item)) {
          return {
            ...item,
            itemType: 'health_check' as const,
            displayName: `${MONITORING_TYPE_LABELS[item.type]} - ${item.projectName}`,
          }
        }
        if (isCypressResult(item)) {
          return {
            ...item,
            itemType: 'cypress' as const,
            displayName: `Cypress Tests - ${item.projectName}`,
          }
        }
        return null
      })
      .filter(Boolean)
  }, [items])

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Type
            </label>
            <select
              value={filters.type || ''}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">All</option>
              <option value="health_check">Health Checks</option>
              <option value="cypress">Cypress Tests</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Project
            </label>
            <select
              value={filters.projectId || ''}
              onChange={(e) => handleFilterChange('projectId', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">All Projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Start Date
            </label>
            <Input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              End Date
            </label>
            <Input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </div>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Timestamp
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
                        Loading history...
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
                    No history found
                  </td>
                </tr>
              )}

              {!loading &&
                formattedItems.map((item) => {
                  if (!item) return null

                  const timestamp = isHealthCheckResult(item)
                    ? item.timestamp
                    : (item as CypressResult).timestamp

                  if (isHealthCheckResult(item)) {
                    return (
                      <tr key={item.id}>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                          {MONITORING_TYPE_LABELS[item.type]}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {item.projectName}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                              item.success
                                ? 'bg-success-100 text-success-800'
                                : 'bg-danger-100 text-danger-800'
                            }`}
                          >
                            {item.success ? 'Success' : 'Failed'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {item.statusCode && (
                            <span>HTTP {item.statusCode}</span>
                          )}
                          {item.responseTime && (
                            <span className="ml-2">{item.responseTime}ms</span>
                          )}
                          {item.errorMessage && (
                            <div className="mt-1 text-xs text-danger-600">
                              {item.errorMessage}
                            </div>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {new Date(timestamp).toLocaleString()}
                        </td>
                      </tr>
                    )
                  }

                  if (isCypressResult(item)) {
                    const cypressItem = item as CypressResult
                    return (
                      <tr key={cypressItem.id}>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                          Cypress Tests
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {cypressItem.projectName}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                              cypressItem.success
                                ? 'bg-success-100 text-success-800'
                                : 'bg-danger-100 text-danger-800'
                            }`}
                          >
                            {cypressItem.success ? 'Passed' : 'Failed'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <div>
                            <span>
                              {cypressItem.passed}/{cypressItem.totalTests}{' '}
                              passed
                            </span>
                            {cypressItem.failed > 0 && (
                              <span className="ml-2 text-danger-600">
                                {cypressItem.failed} failed
                              </span>
                            )}
                          </div>
                          <div className="mt-1 text-xs">
                            Duration: {Math.round(cypressItem.duration / 1000)}s
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {new Date(timestamp).toLocaleString()}
                        </td>
                      </tr>
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
