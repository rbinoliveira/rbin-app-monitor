'use client'

import { useState } from 'react'

import { HistoryTable } from '@/features/monitoring/components'
import type { UseHistoryFilters } from '@/features/monitoring/hooks/useHistory'
import { useHistory } from '@/features/monitoring/hooks/useHistory'
import { useProjects } from '@/features/projects'
import { MainLayout } from '@/shared/components/layout/MainLayout'

export default function HistoryPage() {
  const { projects } = useProjects()
  const [filters, setFilters] = useState<UseHistoryFilters>({})
  const { items, loading, error, page, hasMore, setPage } = useHistory(
    filters,
    { pageSize: 20 },
  )

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Execution History
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            View health check results and Cypress test executions
          </p>
        </div>

        {error && (
          <div className="rounded-md border border-danger-200 bg-danger-50 p-4">
            <p className="text-danger-800 text-sm font-medium">
              Error loading history
            </p>
            <p className="mt-1 text-sm text-danger-600">{error}</p>
          </div>
        )}

        <HistoryTable
          items={items}
          loading={loading}
          filters={filters}
          onFiltersChange={setFilters}
          projects={projects}
          page={page}
          hasMore={hasMore}
          onPageChange={setPage}
        />
      </div>
    </MainLayout>
  )
}
