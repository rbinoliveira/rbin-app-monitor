'use client'

import { ChevronDown, ChevronUp, Pencil, Play, Power } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { useCypressStatusService } from '@/features/monitoring/services/cypress-status.service'
import { useRunCypressService } from '@/features/monitoring/services/run-cypress.service'
import { useUpdateProjectService } from '@/features/projects/services/update-project.service'
import { Button } from '@/shared/components/button'
import { useToast } from '@/shared/components/toast'
import { Tooltip } from '@/shared/components/tooltip'
import { cn } from '@/shared/libs/tw-merge'
import type { CypressResult } from '@/shared/types/cypress-result.type'
import type { Project } from '@/shared/types/project.type'
import { formatCypressSchedule } from '@/shared/utils/format-cypress-schedule.util'

export type ExecutionHistoryItem = CypressResult

function formatExecutionDetails(item: CypressResult): string {
  const parts = [
    `${item.passed}/${item.totalTests} passed`,
    `${Math.round(item.duration / 1000)}s`,
  ]
  if (item.failed > 0) parts.push(`${item.failed} failed`)
  if ('error' in item && item.error) parts.push(item.error as string)
  return parts.join(' • ')
}

export interface ProjectRowProps {
  project: Project
  historyItems: ExecutionHistoryItem[]
  historyLoading: boolean
  onRefresh: () => Promise<void>
  onEdit: (project: Project) => void
}

export function ProjectRow({
  project,
  historyItems,
  historyLoading,
  onRefresh,
  onEdit,
}: ProjectRowProps) {
  const { addToast } = useToast()
  const [expanded, setExpanded] = useState(false)
  const [historyPage, setHistoryPage] = useState(0)
  const PAGE_SIZE = 3
  const latestExecution = historyItems[0]
  const hasCypress = Boolean(project.cypressGithubRepo)
  const scheduleLabel = formatCypressSchedule()
  const cypressScheduled = project.isActive && hasCypress
  const scheduleStatus = cypressScheduled
    ? 'Agendado'
    : !hasCypress
      ? 'Não agendado • sem repositório Cypress'
      : 'Não agendado • projeto inativo'
  const scheduleDetails = cypressScheduled
    ? scheduleLabel
    : !hasCypress
      ? 'Configure um repositório Cypress para entrar no cron.'
      : `${scheduleLabel}. Ative o projeto para incluir no cron.`

  const { mutateAsync: updateProject } = useUpdateProjectService({
    onSuccess: () => onRefresh(),
    onError: (err) => addToast(err.message, 'error'),
  })

  const { mutateAsync: runCypress, isPending: cypressMutating } =
    useRunCypressService({
      onSuccess: (data) => {
        const durationSeconds = Math.round(data.duration / 1000)
        if (data.failed > 0) {
          addToast(
            `Testes falharam: ${data.failed}/${data.totalTests} em ${durationSeconds}s`,
            'error',
          )
        } else {
          addToast(
            `Cypress concluído: ${data.passed}/${data.totalTests} em ${durationSeconds}s`,
            'success',
          )
        }
        onRefresh()
      },
      onError: (err) => addToast(err.message, 'error'),
    })

  const { data: cypressRunning } = useCypressStatusService(
    project.id,
    hasCypress && !cypressMutating,
  )
  const cypressPending = cypressMutating || Boolean(cypressRunning)

  const prevRunning = useRef<boolean | undefined>(undefined)
  useEffect(() => {
    if (prevRunning.current === true && cypressRunning === false) {
      onRefresh()
    }
    prevRunning.current = cypressRunning
  }, [cypressRunning, onRefresh])

  const handleToggle = async () => {
    try {
      await updateProject({
        projectId: project.id,
        input: { isActive: !project.isActive },
      })
      addToast(
        project.isActive ? 'Projeto desativado' : 'Projeto ativado',
        'success',
      )
    } catch {
      // onError already shows toast
    }
  }

  return (
    <div className="glass-surface rounded-[1.75rem] p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <span
              className={cn(
                'mt-1 h-2.5 w-2.5 rounded-full',
                project.isActive ? 'bg-emerald-400' : 'bg-slate-500',
              )}
              title={project.isActive ? 'Ativo' : 'Inativo'}
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <p className="truncate text-lg font-semibold text-white">
                  {project.name}
                </p>
                <span
                  className={cn(
                    'rounded-full border border-white/10 px-2.5 py-1 text-xs',
                    project.isActive ? 'text-emerald-300' : 'text-slate-300',
                  )}
                >
                  {project.isActive ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-[1.25rem] border border-white/8 bg-slate-950/30 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <p className="font-mono text-[0.7rem] uppercase tracking-[0.22em] text-slate-400/80">
                  Última execução
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-100">
                  {latestExecution
                    ? `Cypress • ${latestExecution.success ? 'Sucesso' : 'Falha'}`
                    : historyLoading
                      ? 'Carregando histórico...'
                      : 'Nenhuma execução ainda'}
                  {latestExecution?.trigger && (
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide',
                        latestExecution.trigger === 'cron'
                          ? 'bg-violet-500/20 text-violet-300'
                          : 'bg-cyan-500/20 text-cyan-300',
                      )}
                    >
                      {latestExecution.trigger === 'cron' ? 'Cron' : 'Manual'}
                    </span>
                  )}
                </p>
                {latestExecution && (
                  <p className="mt-1 truncate text-sm text-slate-400/80">
                    {formatExecutionDetails(latestExecution)}
                  </p>
                )}
                <p className="mt-3 text-xs text-slate-400/80">
                  <span
                    className={cn(
                      'mr-2 inline-flex rounded-full px-2 py-0.5 font-medium',
                      cypressScheduled
                        ? 'bg-emerald-500/15 text-emerald-300'
                        : 'bg-slate-500/15 text-slate-300',
                    )}
                  >
                    {scheduleStatus}
                  </span>
                  {scheduleDetails}
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400/80">
                {latestExecution && (
                  <span>
                    {new Date(latestExecution.timestamp).toLocaleString()}
                  </span>
                )}
                <Tooltip
                  label={expanded ? 'Ocultar histórico' : 'Ver histórico'}
                >
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setExpanded((c) => !c)
                      setHistoryPage(0)
                    }}
                    disabled={historyItems.length === 0}
                    className="w-9 px-0"
                  >
                    {expanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </Tooltip>
              </div>
            </div>

            {expanded && historyItems.length > 0 && (
              <div className="mt-4 space-y-2">
                {historyItems
                  .slice(historyPage * PAGE_SIZE, (historyPage + 1) * PAGE_SIZE)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="rounded-[1rem] border border-white/8 bg-white/4 px-3 py-3"
                    >
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <p className="flex items-center gap-2 text-sm text-white">
                          Cypress • {item.success ? 'Sucesso' : 'Falha'}
                          {item.trigger && (
                            <span
                              className={cn(
                                'rounded-full px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide',
                                item.trigger === 'cron'
                                  ? 'bg-violet-500/20 text-violet-300'
                                  : 'bg-cyan-500/20 text-cyan-300',
                              )}
                            >
                              {item.trigger === 'cron' ? 'Cron' : 'Manual'}
                            </span>
                          )}
                        </p>
                        <span className="text-xs text-slate-400/75">
                          {new Date(item.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-400/80">
                        {formatExecutionDetails(item)}
                      </p>
                    </div>
                  ))}

                {historyItems.length > PAGE_SIZE && (
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-slate-400/60">
                      {historyPage * PAGE_SIZE + 1}–
                      {Math.min(
                        (historyPage + 1) * PAGE_SIZE,
                        historyItems.length,
                      )}{' '}
                      de {historyItems.length}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setHistoryPage((p) => p - 1)}
                        disabled={historyPage === 0}
                      >
                        ← Anterior
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setHistoryPage((p) => p + 1)}
                        disabled={
                          (historyPage + 1) * PAGE_SIZE >= historyItems.length
                        }
                      >
                        Próxima →
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 xl:max-w-[15rem] xl:justify-end">
          {project.cypressGithubRepo && (
            <Tooltip label="Executar testes Cypress">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => runCypress(project.id)}
                loading={cypressPending}
                disabled={cypressPending || !project.isActive}
                className="w-9 px-0"
              >
                {!cypressPending && <Play className="h-4 w-4" />}
              </Button>
            </Tooltip>
          )}
          <Tooltip label="Editar projeto">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEdit(project)}
              disabled={cypressPending}
              className="w-9 px-0"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </Tooltip>
          <Tooltip
            label={project.isActive ? 'Desativar projeto' : 'Ativar projeto'}
          >
            <Button
              size="sm"
              variant="ghost"
              onClick={handleToggle}
              disabled={cypressPending}
              className={cn(
                'w-9 px-0',
                project.isActive
                  ? 'text-rose-400 hover:text-rose-300'
                  : 'text-emerald-400 hover:text-emerald-300',
              )}
            >
              <Power className="h-4 w-4" />
            </Button>
          </Tooltip>
        </div>
      </div>
    </div>
  )
}
