'use client'

import { useState } from 'react'

import { Button } from '@/shared/components/ui/Button'
import { useToast } from '@/shared/components/ui/Toast'
import { cn } from '@/shared/lib/utils'
import type {
  CypressResult,
  HealthCheckResult,
  PlaywrightResult,
  Project,
  ProjectStatus,
} from '@/shared/types'

export type ExecutionHistoryItem =
  | HealthCheckResult
  | CypressResult
  | PlaywrightResult

const STATUS: Record<
  ProjectStatus,
  { label: string; dot: string; text: string }
> = {
  healthy: {
    label: 'Saudável',
    dot: 'bg-emerald-400',
    text: 'text-emerald-300',
  },
  unhealthy: {
    label: 'Com falha',
    dot: 'bg-rose-400',
    text: 'text-rose-300',
  },
  unknown: {
    label: 'Desconhecido',
    dot: 'bg-slate-500',
    text: 'text-slate-300',
  },
}

function isHealthCheckResult(
  item: ExecutionHistoryItem,
): item is HealthCheckResult {
  return 'type' in item && 'url' in item
}

function formatExecutionLabel(item: ExecutionHistoryItem): string {
  if (isHealthCheckResult(item)) {
    return item.type === 'front' ? 'Health check frente' : 'Health check API'
  }
  return item.runner === 'playwright'
    ? 'Execução Playwright'
    : 'Execução Cypress'
}

function formatExecutionDetails(item: ExecutionHistoryItem): string {
  if (isHealthCheckResult(item)) {
    const parts = [`${item.responseTime}ms`]
    if (item.statusCode) parts.unshift(`HTTP ${item.statusCode}`)
    if (item.errorMessage) parts.push(item.errorMessage)
    return parts.join(' • ')
  }
  const parts = [
    `${item.passed}/${item.totalTests} passed`,
    `${Math.round(item.duration / 1000)}s`,
  ]
  if (item.failed > 0) parts.push(`${item.failed} failed`)
  if ('error' in item && item.error) parts.push(item.error)
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
  const [runningAction, setRunningAction] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const status = STATUS[project.status]
  const latestExecution = historyItems[0]

  const runAction = async (label: string, url: string, body: object) => {
    setRunningAction(label)
    addToast(`Executando ${label}...`, 'info')
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await response.json()
      if (!data.success) throw new Error(data.error || `${label} falhou`)
      addToast(`${label} concluído com sucesso`, 'success')
      await onRefresh()
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : `${label} falhou`,
        'error',
      )
    } finally {
      setRunningAction(null)
    }
  }

  const handleToggle = async () => {
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !project.isActive }),
      })
      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Falha ao ativar/desativar projeto')
      }
      addToast(
        project.isActive ? 'Projeto desativado' : 'Projeto ativado',
        'success',
      )
      await onRefresh()
    } catch (error) {
      addToast(
        error instanceof Error
          ? error.message
          : 'Falha ao ativar/desativar projeto',
        'error',
      )
    }
  }

  const isRunning = runningAction !== null
  const hasHealthCheck = Boolean(
    project.frontHealthCheckUrl || project.backHealthCheckUrl,
  )

  return (
    <div className="glass-surface rounded-[1.75rem] p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <span
              className={cn('mt-1 h-2.5 w-2.5 rounded-full', status.dot)}
              title={status.label}
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <p className="truncate text-lg font-semibold text-white">
                  {project.name}
                </p>
                <span
                  className={cn(
                    'rounded-full border border-white/10 px-2.5 py-1 text-xs',
                    status.text,
                  )}
                >
                  {status.label}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-slate-400/80">
                {project.frontHealthCheckUrl && <span>Frente</span>}
                {project.backHealthCheckUrl && <span>API</span>}
                {project.playwrightRunUrl && <span>Playwright</span>}
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-[1.25rem] border border-white/8 bg-slate-950/30 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <p className="font-mono text-[0.7rem] uppercase tracking-[0.22em] text-slate-400/80">
                  Última execução
                </p>
                <p className="mt-1 text-sm text-slate-100">
                  {latestExecution
                    ? `${formatExecutionLabel(latestExecution)} • ${
                        latestExecution.success ? 'Sucesso' : 'Falha'
                      }`
                    : historyLoading
                      ? 'Carregando histórico...'
                      : 'Nenhuma execução ainda'}
                </p>
                {latestExecution && (
                  <p className="mt-1 truncate text-sm text-slate-400/80">
                    {formatExecutionDetails(latestExecution)}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400/80">
                {latestExecution && (
                  <span>
                    {new Date(latestExecution.timestamp).toLocaleString()}
                  </span>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setExpanded((c) => !c)}
                  disabled={historyItems.length === 0}
                >
                  {expanded ? 'Ocultar histórico' : 'Ver histórico'}
                </Button>
              </div>
            </div>

            {expanded && historyItems.length > 0 && (
              <div className="mt-4 space-y-2">
                {historyItems.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[1rem] border border-white/8 bg-white/4 px-3 py-3"
                  >
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-white">
                        {formatExecutionLabel(item)} •{' '}
                        {item.success ? 'Sucesso' : 'Falha'}
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
              </div>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 xl:max-w-[15rem] xl:justify-end">
          {hasHealthCheck && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                runAction('Health Check', '/api/health-check', {
                  projectId: project.id,
                })
              }
              loading={runningAction === 'Health Check'}
              disabled={isRunning || !project.isActive}
            >
              Health Check
            </Button>
          )}
          {project.playwrightRunUrl && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                runAction('Playwright', '/api/playwright/run', {
                  projectId: project.id,
                })
              }
              loading={runningAction === 'Playwright'}
              disabled={isRunning || !project.isActive}
            >
              Playwright
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(project)}
            disabled={isRunning}
          >
            Editar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleToggle}
            disabled={isRunning}
          >
            {project.isActive ? 'Desativar' : 'Ativar'}
          </Button>
        </div>
      </div>
    </div>
  )
}
