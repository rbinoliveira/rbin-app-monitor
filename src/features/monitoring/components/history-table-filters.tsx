'use client'

import type { UseHistoryFilters } from '@/features/monitoring/use-cases/get-history.use-case'
import { Card } from '@/shared/components/card'
import { Input } from '@/shared/components/input'
import type { Project } from '@/shared/types/project.type'

export interface HistoryTableFiltersProps {
  filters: UseHistoryFilters
  onFiltersChange: (filters: UseHistoryFilters) => void
  projects: Project[]
}

export function HistoryTableFilters({
  filters,
  onFiltersChange,
  projects,
}: HistoryTableFiltersProps) {
  const handleChange = (key: keyof UseHistoryFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined,
    })
  }

  return (
    <Card className="p-4">
      <div className="grid gap-4 md:grid-cols-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Tipo
          </label>
          <select
            value={filters.type || ''}
            onChange={(e) => handleChange('type', e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Todos</option>
            <option value="health_check">Health checks</option>
            <option value="cypress">Testes Cypress</option>
            <option value="playwright">Testes Playwright</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Projeto
          </label>
          <select
            value={filters.projectId || ''}
            onChange={(e) => handleChange('projectId', e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Todos os projetos</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Data inicial
          </label>
          <Input
            type="date"
            value={filters.startDate || ''}
            onChange={(e) => handleChange('startDate', e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Data final
          </label>
          <Input
            type="date"
            value={filters.endDate || ''}
            onChange={(e) => handleChange('endDate', e.target.value)}
          />
        </div>
      </div>
    </Card>
  )
}
