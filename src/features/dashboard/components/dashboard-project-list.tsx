'use client'

import type { ExecutionHistoryItem } from '@/features/dashboard/components/project-row'
import { ProjectRow } from '@/features/dashboard/components/project-row'
import { DataHandler } from '@/shared/components/data-handler'
import type { Project } from '@/shared/types/project.type'

interface DashboardProjectListProps {
  projects: Project[]
  loading: boolean
  error: string | null
  historyByProject: Record<string, ExecutionHistoryItem[]>
  historyLoading: boolean
  historyErrorMessage: string | null
  onRefresh: () => Promise<void>
  onEdit: (project: Project) => void
}

export function DashboardProjectList({
  projects,
  loading,
  error,
  historyByProject,
  historyLoading,
  historyErrorMessage,
  onRefresh,
  onEdit,
}: DashboardProjectListProps) {
  return (
    <DataHandler
      isLoading={loading}
      isError={Boolean(error)}
      error={error}
      onRetry={onRefresh}
      skeleton={
        <div className="glass-surface rounded-[1.75rem] p-8 text-center text-slate-300/80">
          Carregando aplicações monitoradas...
        </div>
      }
    >
      {historyErrorMessage && (
        <div className="mb-4 glass-surface rounded-[1.75rem] border-rose-400/25 p-5 text-rose-200">
          {historyErrorMessage}
        </div>
      )}

      {projects.length === 0 ? (
        <div className="glass-surface rounded-[1.75rem] p-10 text-center">
          <p className="text-lg font-medium text-white">
            Nenhuma aplicação cadastrada ainda.
          </p>
          <p className="mt-2 text-sm text-slate-400/80">
            Adicione a primeira aplicação para começar a registrar execuções de
            testes Cypress.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => (
            <ProjectRow
              key={project.id}
              project={project}
              historyItems={historyByProject[project.id] ?? []}
              historyLoading={historyLoading}
              onRefresh={onRefresh}
              onEdit={onEdit}
            />
          ))}
        </div>
      )}
    </DataHandler>
  )
}
