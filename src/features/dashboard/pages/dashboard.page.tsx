'use client'

import { useMemo, useState } from 'react'

import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute'
import { useAuth } from '@/features/auth/contexts/AuthContext'
import { AddProjectModal } from '@/features/dashboard/components/add-project-modal'
import { EditProjectModal } from '@/features/dashboard/components/edit-project-modal'
import type { ExecutionHistoryItem } from '@/features/dashboard/components/project-row'
import { ProjectRow } from '@/features/dashboard/components/project-row'
import { SummaryCards } from '@/features/dashboard/components/summary-cards'
import { useGetHistoryService } from '@/features/monitoring/services/get-history.service'
import { useProjects } from '@/features/projects/hooks/use-projects.hook'
import { DataHandler } from '@/shared/components/data-handler'
import { Button } from '@/shared/components/button'
import type { Project } from '@/shared/types/project.type'

function DashboardScreen() {
  const { user } = useAuth()
  const { projects, loading, error, refresh } = useProjects()
  const [addOpen, setAddOpen] = useState(false)
  const [editProject, setEditProject] = useState<Project | null>(null)

  const {
    data: historyData,
    isLoading: historyLoading,
    isError: historyIsError,
    error: historyError,
    refetch: refetchHistory,
  } = useGetHistoryService({}, { page: 1, pageSize: 100 })

  const historyByProject = useMemo(() => {
    const items = (historyData?.items ?? []) as ExecutionHistoryItem[]
    return items.reduce<Record<string, ExecutionHistoryItem[]>>(
      (accumulator, item) => {
        const current = accumulator[item.projectId] ?? []
        current.push(item)
        accumulator[item.projectId] = current.sort(
          (left, right) =>
            new Date(right.timestamp).getTime() -
            new Date(left.timestamp).getTime(),
        )
        return accumulator
      },
      {},
    )
  }, [historyData?.items])

  const historyErrorMessage =
    historyIsError && historyError
      ? historyError.message
      : null

  const refreshAll = async () => {
    await Promise.all([refresh(), refetchHistory()])
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-14 pt-8 sm:px-6 lg:px-8">
      <section className="glass-surface-strong rounded-[2rem] px-6 py-7 sm:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="font-mono text-[0.72rem] uppercase tracking-[0.26em] text-cyan-300/80">
              Painel de monitoramento
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Monitoramento unificado: health checks e execuções remotas de
              testes.
            </h1>
            <p className="mt-3 max-w-xl text-sm text-slate-300/80 sm:text-base">
              Um único painel para disparos manuais, última execução e status
              das aplicações ativas.
            </p>
          </div>

          <div className="glass-surface rounded-[1.5rem] px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400/75">
              Conectado como
            </p>
            <p className="mt-1 text-sm font-medium text-white">
              {user?.displayName || user?.email || 'Operador'}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-6">
        <SummaryCards projects={projects} />
      </section>

      <section className="mt-8">
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Aplicações</h2>
            <p className="mt-1 text-sm text-slate-400/80">
              Dispare checagens manualmente, veja a última execução e mantenha
              só as aplicações ativas em rotação.
            </p>
          </div>

          <Button onClick={() => setAddOpen(true)} size="lg">
            Adicionar aplicação
          </Button>
        </div>

        <DataHandler
          isLoading={loading}
          isError={Boolean(error)}
          error={error}
          onRetry={refresh}
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
                Adicione a primeira aplicação para começar a registrar health
                checks e execuções de testes.
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
                  onRefresh={refreshAll}
                  onEdit={setEditProject}
                />
              ))}
            </div>
          )}
        </DataHandler>
      </section>

      <AddProjectModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSuccess={refreshAll}
      />

      {editProject && (
        <EditProjectModal
          project={editProject}
          open={true}
          onClose={() => setEditProject(null)}
          onSuccess={refreshAll}
        />
      )}
    </div>
  )
}

export function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardScreen />
    </ProtectedRoute>
  )
}
