'use client'

import { useEffect, useState } from 'react'

import { useAuth } from '@/features/auth'
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
} from '@/shared/types'

type ExecutionHistoryItem = HealthCheckResult | CypressResult | PlaywrightResult

const STATUS: Record<
  ProjectStatus,
  { label: string; dot: string; text: string }
> = {
  healthy: {
    label: 'Healthy',
    dot: 'bg-emerald-500',
    text: 'text-emerald-400',
  },
  unhealthy: { label: 'Unhealthy', dot: 'bg-red-500', text: 'text-red-400' },
  unknown: { label: 'Unknown', dot: 'bg-gray-500', text: 'text-gray-400' },
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
  const healthy = projects.filter((p) => p.status === 'healthy').length
  const unhealthy = projects.filter((p) => p.status === 'unhealthy').length
  const lastCheck = projects
    .map((p) => p.lastCheckAt)
    .filter(Boolean)
    .sort((a, b) => (b! > a! ? 1 : -1))[0]

  const cards = [
    { label: 'Total Projects', value: total, color: 'text-cyan-400' },
    { label: 'Healthy', value: healthy, color: 'text-emerald-400' },
    { label: 'Unhealthy', value: unhealthy, color: 'text-red-400' },
    {
      label: 'Last Check',
      value: lastCheck ? new Date(lastCheck).toLocaleTimeString() : '—',
      color: 'text-violet-400',
      small: true,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm"
        >
          <p className="text-xs font-medium text-white/50">{card.label}</p>
          <p
            className={cn(
              'mt-2 font-semibold',
              card.small ? 'text-xl' : 'text-3xl',
              card.color,
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
    cypressRunUrl: '',
    playwrightRunUrl: '',
  })

  const setField =
    (field: keyof CreateProjectInput) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }))
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
          cypressRunUrl: form.cypressRunUrl || null,
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
        cypressRunUrl: '',
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
        <ModalTitle>Add Project</ModalTitle>
      </ModalHeader>
      <ModalContent>
        <form
          id="add-project-form"
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <Input
            label="Project name *"
            value={form.name}
            onChange={setField('name')}
            placeholder="My App"
            required
          />
          <Input
            label="Front Health Check URL"
            value={form.frontHealthCheckUrl ?? ''}
            onChange={setField('frontHealthCheckUrl')}
            placeholder="https://myapp.com"
            type="url"
          />
          <Input
            label="Back Health Check URL"
            value={form.backHealthCheckUrl ?? ''}
            onChange={setField('backHealthCheckUrl')}
            placeholder="https://api.myapp.com/health"
            type="url"
          />
          <Input
            label="Cypress Run URL (remote)"
            value={form.cypressRunUrl ?? ''}
            onChange={setField('cypressRunUrl')}
            placeholder="https://ci.myapp.com/api/cypress/run"
            type="url"
          />
          <Input
            label="Playwright Run URL (remote)"
            value={form.playwrightRunUrl ?? ''}
            onChange={setField('playwrightRunUrl')}
            placeholder="https://ci.myapp.com/api/playwright/run"
            type="url"
          />
        </form>
      </ModalContent>
      <ModalFooter>
        <Button variant="ghost" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" form="add-project-form" loading={loading}>
          Create Project
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
}

function ProjectRow({
  project,
  historyItems,
  historyLoading,
  onRefresh,
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

      if (data.success) {
        addToast(`${label} completed successfully`, 'success')
      } else {
        addToast(data.error || `${label} failed`, 'error')
      }

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
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span
            className={cn(
              'mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full',
              status.dot,
            )}
            title={status.label}
          />
          <div className="min-w-0">
            <p className="truncate font-medium text-white">{project.name}</p>
            <div className="mt-0.5 flex flex-wrap gap-2 text-xs text-white/40">
              {project.frontHealthCheckUrl && <span>Front</span>}
              {project.backHealthCheckUrl && <span>Back</span>}
              {project.cypressRunUrl && <span>Cypress</span>}
              {project.playwrightRunUrl && <span>Playwright</span>}
            </div>
          </div>
        </div>

        <div className="hidden text-right text-xs text-white/40 lg:block">
          {project.lastCheckAt
            ? new Date(project.lastCheckAt).toLocaleString()
            : 'Never checked'}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
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
          {project.cypressRunUrl && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                runAction('Cypress', '/api/cypress/run', {
                  projectId: project.id,
                })
              }
              loading={runningAction === 'Cypress'}
              disabled={isRunning || !project.isActive}
            >
              Cypress
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
            onClick={handleToggle}
            disabled={isRunning}
            className={cn(!project.isActive && 'opacity-50')}
          >
            {project.isActive ? 'Disable' : 'Enable'}
          </Button>
        </div>
      </div>

      <div className="mt-4 border-t border-white/10 pt-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.2em] text-white/35">
              Latest execution
            </p>
            <p className="mt-1 text-sm text-white/80">
              {latestExecution
                ? `${formatExecutionLabel(latestExecution)} • ${
                    latestExecution.success ? 'Success' : 'Failed'
                  }`
                : historyLoading
                  ? 'Loading execution history...'
                  : 'No execution history yet'}
            </p>
            {latestExecution && (
              <p className="mt-1 truncate text-xs text-white/45">
                {formatExecutionDetails(latestExecution)}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-white/40">
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
                className="rounded-lg border border-white/8 bg-black/20 px-3 py-2"
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-white">
                    {formatExecutionLabel(item)} •{' '}
                    {item.success ? 'Success' : 'Failed'}
                  </p>
                  <span className="text-xs text-white/35">
                    {new Date(item.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="mt-1 text-xs text-white/50">
                  {formatExecutionDetails(item)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user, signOut } = useAuth()
  const { projects, loading, error, refresh } = useProjects()
  const [addOpen, setAddOpen] = useState(false)
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
    <div className="min-h-screen bg-[#080c14] px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">RBIN App Monitor</h1>
          <p className="mt-0.5 text-sm text-white/40">
            {user?.email ?? 'Monitoring dashboard'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setAddOpen(true)} size="sm">
            + New Project
          </Button>
          <Button variant="ghost" size="sm" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </header>

      <SummaryCards projects={projects} />

      <section className="mt-8">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/40">
          Applications
        </h2>

        {loading && (
          <p className="text-sm text-white/40">Loading projects...</p>
        )}
        {error && <p className="text-sm text-red-400">{error}</p>}
        {historyError && (
          <p className="mb-3 text-sm text-red-400">{historyError}</p>
        )}

        {!loading && !error && projects.length === 0 && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-sm">
            <p className="text-white/50">No projects yet.</p>
            <p className="mt-1 text-sm text-white/30">
              Click &quot;+ New Project&quot; to start monitoring.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {projects.map((project) => (
            <ProjectRow
              key={project.id}
              project={project}
              historyItems={historyByProject[project.id] ?? []}
              historyLoading={historyLoading}
              onRefresh={refreshAll}
            />
          ))}
        </div>
      </section>

      <AddProjectModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSuccess={refreshAll}
      />
    </div>
  )
}
