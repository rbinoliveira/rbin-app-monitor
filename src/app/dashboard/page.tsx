'use client'

import { useState } from 'react'

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
import type { CreateProjectInput, Project, ProjectStatus } from '@/shared/types'

// ============================================
// Status config
// ============================================

const STATUS: Record<ProjectStatus, { label: string; dot: string; text: string }> = {
  healthy: { label: 'Healthy', dot: 'bg-emerald-500', text: 'text-emerald-400' },
  unhealthy: { label: 'Unhealthy', dot: 'bg-red-500', text: 'text-red-400' },
  unknown: { label: 'Unknown', dot: 'bg-gray-500', text: 'text-gray-400' },
}

// ============================================
// Summary cards
// ============================================

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
          <p className={cn('mt-2 font-semibold', card.small ? 'text-xl' : 'text-3xl', card.color)}>
            {card.value}
          </p>
        </div>
      ))}
    </div>
  )
}

// ============================================
// Add Project Modal
// ============================================

interface AddProjectModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
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

  const set = (field: keyof CreateProjectInput) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/projects', {
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
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create project')
      addToast('Project created successfully', 'success')
      setForm({ name: '', frontHealthCheckUrl: '', backHealthCheckUrl: '', cypressRunUrl: '', playwrightRunUrl: '' })
      onClose()
      onSuccess()
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to create project', 'error')
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
        <form id="add-project-form" onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Project name *"
            value={form.name}
            onChange={set('name')}
            placeholder="My App"
            required
          />
          <Input
            label="Front Health Check URL"
            value={form.frontHealthCheckUrl ?? ''}
            onChange={set('frontHealthCheckUrl')}
            placeholder="https://myapp.com"
            type="url"
          />
          <Input
            label="Back Health Check URL"
            value={form.backHealthCheckUrl ?? ''}
            onChange={set('backHealthCheckUrl')}
            placeholder="https://api.myapp.com/health"
            type="url"
          />
          <Input
            label="Cypress Run URL (remote)"
            value={form.cypressRunUrl ?? ''}
            onChange={set('cypressRunUrl')}
            placeholder="https://ci.myapp.com/api/cypress/run"
            type="url"
          />
          <Input
            label="Playwright Run URL (remote)"
            value={form.playwrightRunUrl ?? ''}
            onChange={set('playwrightRunUrl')}
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

// ============================================
// Project Row
// ============================================

function ProjectRow({
  project,
  onRefresh,
}: {
  project: Project
  onRefresh: () => void
}) {
  const { addToast } = useToast()
  const [runningAction, setRunningAction] = useState<string | null>(null)
  const status = STATUS[project.status]

  const runAction = async (label: string, url: string, body: object) => {
    setRunningAction(label)
    addToast(`Running ${label}...`, 'info')
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.success) {
        addToast(`${label} completed successfully`, 'success')
      } else {
        addToast(data.error || `${label} failed`, 'error')
      }
      onRefresh()
    } catch (err) {
      addToast(err instanceof Error ? err.message : `${label} failed`, 'error')
    } finally {
      setRunningAction(null)
    }
  }

  const handleHealthCheck = () =>
    runAction('Health Check', '/api/health-check', { projectId: project.id })

  const handleCypress = () =>
    runAction('Cypress', '/api/cypress/run', { projectId: project.id })

  const handlePlaywright = () =>
    runAction('Playwright', '/api/playwright/run', { projectId: project.id })

  const handleToggle = async () => {
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !project.isActive }),
      })
      if (res.ok) {
        addToast(`Project ${project.isActive ? 'deactivated' : 'activated'}`, 'success')
        onRefresh()
      }
    } catch {
      addToast('Failed to toggle project', 'error')
    }
  }

  const isRunning = runningAction !== null
  const hasHealthCheck = Boolean(project.frontHealthCheckUrl || project.backHealthCheckUrl)

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm sm:flex-row sm:items-center sm:gap-4">
      {/* Status + Name */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span
          className={cn('mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full', status.dot)}
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

      {/* Last check */}
      <div className="hidden text-right text-xs text-white/40 lg:block">
        {project.lastCheckAt
          ? new Date(project.lastCheckAt).toLocaleString()
          : 'Never checked'}
      </div>

      {/* Actions */}
      <div className="flex shrink-0 flex-wrap gap-2">
        {hasHealthCheck && (
          <Button
            size="sm"
            variant="secondary"
            onClick={handleHealthCheck}
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
            onClick={handleCypress}
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
            onClick={handlePlaywright}
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
  )
}

// ============================================
// Dashboard Page
// ============================================

export default function DashboardPage() {
  const { user, signOut } = useAuth()
  const { projects, loading, error, refresh } = useProjects()
  const [addOpen, setAddOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#080c14] px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
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

      {/* Summary cards */}
      <SummaryCards projects={projects} />

      {/* Project listing */}
      <section className="mt-8">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/40">
          Applications
        </h2>

        {loading && (
          <p className="text-sm text-white/40">Loading projects...</p>
        )}

        {error && (
          <p className="text-sm text-red-400">{error}</p>
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
            <ProjectRow key={project.id} project={project} onRefresh={refresh} />
          ))}
        </div>
      </section>

      {/* Execution History placeholder — Task 2.5 */}
      <section className="mt-8">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/40">
          Execution History
        </h2>
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <p className="text-sm text-white/30">
            History will be displayed here. (Task 2.5)
          </p>
        </div>
      </section>

      {/* Add Project Modal */}
      <AddProjectModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSuccess={refresh}
      />
    </div>
  )
}
