'use client'

import { useEffect, useMemo, useState } from 'react'

import { ProtectedRoute, useAuth } from '@/features/auth'
import { useProjects } from '@/features/projects/hooks/useProjects'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import {
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from '@/shared/components/ui/Modal'
import { useToast } from '@/shared/components/ui/Toast'
import { cn } from '@/shared/lib/utils'
import type {
  CreateProjectInput,
  CypressResult,
  HealthCheckResult,
  PlaywrightResult,
  Project,
  ProjectStatus,
  UpdateProjectInput,
} from '@/shared/types'

type ExecutionHistoryItem = HealthCheckResult | CypressResult | PlaywrightResult

const STATUS: Record<
  ProjectStatus,
  { label: string; dot: string; text: string }
> = {
  healthy: {
    label: 'Healthy',
    dot: 'bg-emerald-400',
    text: 'text-emerald-300',
  },
  unhealthy: {
    label: 'Unhealthy',
    dot: 'bg-rose-400',
    text: 'text-rose-300',
  },
  unknown: {
    label: 'Unknown',
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
    return `${item.type === 'front' ? 'Front' : 'Back'} health check`
  }

  return item.runner === 'playwright' ? 'Playwright run' : 'Cypress run'
}

function formatExecutionDetails(item: ExecutionHistoryItem): string {
  if (isHealthCheckResult(item)) {
    const parts = [`${item.responseTime}ms`]

    if (item.statusCode) {
      parts.unshift(`HTTP ${item.statusCode}`)
    }

    if (item.errorMessage) {
      parts.push(item.errorMessage)
    }

    return parts.join(' • ')
  }

  const parts = [
    `${item.passed}/${item.totalTests} passed`,
    `${Math.round(item.duration / 1000)}s`,
  ]

  if (item.failed > 0) {
    parts.push(`${item.failed} failed`)
  }

  if ('error' in item && item.error) {
    parts.push(item.error)
  }

  return parts.join(' • ')
}

function SummaryCards({ projects }: { projects: Project[] }) {
  const total = projects.length
  const healthy = projects.filter(
    (project) => project.status === 'healthy',
  ).length
  const unhealthy = projects.filter(
    (project) => project.status === 'unhealthy',
  ).length
  const lastCheck = projects
    .map((project) => project.lastCheckAt)
    .filter(Boolean)
    .sort((left, right) => (right! > left! ? 1 : -1))[0]

  const cards = [
    { label: 'Total Apps', value: total, accent: 'text-cyan-300' },
    { label: 'Healthy', value: healthy, accent: 'text-emerald-300' },
    { label: 'Failing', value: unhealthy, accent: 'text-rose-300' },
    {
      label: 'Last Check',
      value: lastCheck ? new Date(lastCheck).toLocaleTimeString() : '—',
      accent: 'text-violet-300',
      compact: true,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="glass-surface rounded-[1.75rem] p-5">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.22em] text-slate-400/80">
            {card.label}
          </p>
          <p
            className={cn(
              'mt-3 font-semibold',
              card.compact ? 'text-2xl md:text-3xl' : 'text-3xl md:text-4xl',
              card.accent,
            )}
          >
            {card.value}
          </p>
        </div>
      ))}
    </div>
  )
}

interface AddProjectModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => Promise<void>
}

function AddProjectModal({ open, onClose, onSuccess }: AddProjectModalProps) {
  const { addToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<CreateProjectInput>({
    name: '',
    frontHealthCheckUrl: '',
    backHealthCheckUrl: '',
    playwrightRunUrl: '',
  })

  const setField =
    (field: keyof CreateProjectInput) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm((previous) => ({ ...previous, [field]: event.target.value }))
    }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          frontHealthCheckUrl: form.frontHealthCheckUrl || null,
          backHealthCheckUrl: form.backHealthCheckUrl || null,
          playwrightRunUrl: form.playwrightRunUrl || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create project')
      }

      addToast('Project created successfully', 'success')
      setForm({
        name: '',
        frontHealthCheckUrl: '',
        backHealthCheckUrl: '',
        playwrightRunUrl: '',
      })
      onClose()
      await onSuccess()
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : 'Failed to create project',
        'error',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <ModalHeader>
        <ModalTitle>Add monitored application</ModalTitle>
        <p className="mt-1 text-sm text-slate-300/80">
          Register a frontend, backend, and optional remote test endpoints for
          one project.
        </p>
      </ModalHeader>
      <ModalContent>
        <form
          id="add-project-form"
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <Input
            label="Project name"
            value={form.name}
            onChange={setField('name')}
            placeholder="Payments API"
            required
          />
          <Input
            label="Frontend URL"
            value={form.frontHealthCheckUrl ?? ''}
            onChange={setField('frontHealthCheckUrl')}
            placeholder="https://app.example.com"
            type="url"
          />
          <Input
            label="Backend health URL"
            value={form.backHealthCheckUrl ?? ''}
            onChange={setField('backHealthCheckUrl')}
            placeholder="https://api.example.com/health"
            type="url"
          />
          <Input
            label="Playwright trigger"
            value={form.playwrightRunUrl ?? ''}
            onChange={setField('playwrightRunUrl')}
            placeholder="https://ci.example.com/api/playwright/run"
            type="url"
          />
        </form>
      </ModalContent>
      <ModalFooter>
        <Button variant="ghost" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" form="add-project-form" loading={loading}>
          Create project
        </Button>
      </ModalFooter>
    </Modal>
  )
}

interface EditProjectModalProps {
  project: Project
  open: boolean
  onClose: () => void
  onSuccess: () => Promise<void>
}

function EditProjectModal({
  project,
  open,
  onClose,
  onSuccess,
}: EditProjectModalProps) {
  const { addToast } = useToast()
  const [loading, setLoading] = useState(false)
  const initialForm = useMemo<UpdateProjectInput>(
    () => ({
      name: project.name,
      frontHealthCheckUrl: project.frontHealthCheckUrl ?? '',
      backHealthCheckUrl: project.backHealthCheckUrl ?? '',
      playwrightRunUrl: project.playwrightRunUrl ?? '',
    }),
    [project.id],
  )
  const [form, setForm] = useState<UpdateProjectInput>(initialForm)

  useEffect(() => {
    if (open) setForm(initialForm)
  }, [open, initialForm])

  const setField =
    (field: keyof UpdateProjectInput) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }))
    }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name || undefined,
          frontHealthCheckUrl: form.frontHealthCheckUrl || null,
          backHealthCheckUrl: form.backHealthCheckUrl || null,
          playwrightRunUrl: form.playwrightRunUrl || null,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update project')
      }
      addToast('Project updated successfully', 'success')
      onClose()
      await onSuccess()
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : 'Failed to update project',
        'error',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <ModalHeader>
        <ModalTitle>Edit application</ModalTitle>
        <p className="mt-1 text-sm text-slate-300/80">
          Update name and URLs for this monitored application.
        </p>
      </ModalHeader>
      <ModalContent>
        <form
          id="edit-project-form"
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <Input
            label="Project name"
            value={form.name ?? ''}
            onChange={setField('name')}
            placeholder="Payments API"
            required
          />
          <Input
            label="Frontend URL"
            value={form.frontHealthCheckUrl ?? ''}
            onChange={setField('frontHealthCheckUrl')}
            placeholder="https://app.example.com"
            type="url"
          />
          <Input
            label="Backend health URL"
            value={form.backHealthCheckUrl ?? ''}
            onChange={setField('backHealthCheckUrl')}
            placeholder="https://api.example.com/health"
            type="url"
          />
          <Input
            label="Playwright trigger"
            value={form.playwrightRunUrl ?? ''}
            onChange={setField('playwrightRunUrl')}
            placeholder="https://ci.example.com/api/playwright/run"
            type="url"
          />
        </form>
      </ModalContent>
      <ModalFooter>
        <Button variant="ghost" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" form="edit-project-form" loading={loading}>
          Save changes
        </Button>
      </ModalFooter>
    </Modal>
  )
}

interface ProjectRowProps {
  project: Project
  historyItems: ExecutionHistoryItem[]
  historyLoading: boolean
  onRefresh: () => Promise<void>
  onEdit: (project: Project) => void
}

function ProjectRow({
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
    addToast(`Running ${label}...`, 'info')

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || `${label} failed`)
      }

      addToast(`${label} completed successfully`, 'success')
      await onRefresh()
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : `${label} failed`,
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
        throw new Error(data.error || 'Failed to toggle project')
      }

      addToast(
        `Project ${project.isActive ? 'deactivated' : 'activated'}`,
        'success',
      )
      await onRefresh()
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : 'Failed to toggle project',
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
                {project.frontHealthCheckUrl && <span>Front</span>}
                {project.backHealthCheckUrl && <span>Back</span>}
                {project.playwrightRunUrl && <span>Playwright</span>}
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-[1.25rem] border border-white/8 bg-slate-950/30 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <p className="font-mono text-[0.7rem] uppercase tracking-[0.22em] text-slate-400/80">
                  Latest execution
                </p>
                <p className="mt-1 text-sm text-slate-100">
                  {latestExecution
                    ? `${formatExecutionLabel(latestExecution)} • ${
                        latestExecution.success ? 'Success' : 'Failed'
                      }`
                    : historyLoading
                      ? 'Loading execution history...'
                      : 'No execution history yet'}
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
                  onClick={() => setExpanded((current) => !current)}
                  disabled={historyItems.length === 0}
                >
                  {expanded ? 'Hide history' : 'Show history'}
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
                        {item.success ? 'Success' : 'Failed'}
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
            Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleToggle}
            disabled={isRunning}
          >
            {project.isActive ? 'Disable' : 'Enable'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function DashboardScreen() {
  const { user } = useAuth()
  const { projects, loading, error, refresh } = useProjects()
  const [addOpen, setAddOpen] = useState(false)
  const [editProject, setEditProject] = useState<Project | null>(null)
  const [historyByProject, setHistoryByProject] = useState<
    Record<string, ExecutionHistoryItem[]>
  >({})
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyError, setHistoryError] = useState<string | null>(null)

  const fetchHistory = async () => {
    setHistoryLoading(true)
    setHistoryError(null)

    try {
      const response = await fetch('/api/history?page=1&pageSize=100')
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to load execution history')
      }

      const items = (result.data?.items ?? []) as ExecutionHistoryItem[]
      const grouped = items.reduce<Record<string, ExecutionHistoryItem[]>>(
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

      setHistoryByProject(grouped)
    } catch (error) {
      setHistoryError(
        error instanceof Error
          ? error.message
          : 'Failed to load execution history',
      )
      setHistoryByProject({})
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory().catch(() => undefined)
  }, [])

  const refreshAll = async () => {
    await Promise.all([refresh(), fetchHistory()])
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-14 pt-8 sm:px-6 lg:px-8">
      <section className="glass-surface-strong rounded-[2rem] px-6 py-7 sm:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="font-mono text-[0.72rem] uppercase tracking-[0.26em] text-cyan-300/80">
              Monitoring cockpit
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Unified monitoring for health checks and remote test runs.
            </h1>
            <p className="mt-3 max-w-xl text-sm text-slate-300/80 sm:text-base">
              One surface for manual triggers, latest execution context, and
              active app status.
            </p>
          </div>

          <div className="glass-surface rounded-[1.5rem] px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400/75">
              Signed in as
            </p>
            <p className="mt-1 text-sm font-medium text-white">
              {user?.displayName || user?.email || 'Operator'}
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
            <h2 className="text-xl font-semibold text-white">Applications</h2>
            <p className="mt-1 text-sm text-slate-400/80">
              Trigger checks manually, inspect the latest execution, and keep
              only active apps in rotation.
            </p>
          </div>

          <Button onClick={() => setAddOpen(true)} size="lg">
            Add application
          </Button>
        </div>

        {loading && (
          <div className="glass-surface rounded-[1.75rem] p-8 text-center text-slate-300/80">
            Loading monitored applications...
          </div>
        )}

        {error && (
          <div className="glass-surface rounded-[1.75rem] border-rose-400/25 p-5 text-rose-200">
            {error}
          </div>
        )}

        {historyError && (
          <div className="mb-4 glass-surface rounded-[1.75rem] border-rose-400/25 p-5 text-rose-200">
            {historyError}
          </div>
        )}

        {!loading && !error && projects.length === 0 && (
          <div className="glass-surface rounded-[1.75rem] p-10 text-center">
            <p className="text-lg font-medium text-white">
              No applications registered yet.
            </p>
            <p className="mt-2 text-sm text-slate-400/80">
              Add your first monitored app to start recording health and test
              execution data.
            </p>
          </div>
        )}

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

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardScreen />
    </ProtectedRoute>
  )
}
