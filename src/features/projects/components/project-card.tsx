'use client'

import Link from 'next/link'

import { useRunPlaywrightService } from '@/features/monitoring/services/run-playwright.service'
import { Button } from '@/shared/components/button'
import { Card, CardContent } from '@/shared/components/card'
import { useToast } from '@/shared/components/toast'
import { cn } from '@/shared/lib/utils'
import type { Project, ProjectStatus } from '@/shared/types/project.type'

interface ProjectCardProps {
  project: Project
}

const statusConfig: Record<
  ProjectStatus,
  { label: string; color: string; bgColor: string }
> = {
  healthy: {
    label: 'Saudável',
    color: 'text-success-700',
    bgColor: 'bg-success-100',
  },
  unhealthy: {
    label: 'Com falha',
    color: 'text-danger-700',
    bgColor: 'bg-danger-100',
  },
  unknown: {
    label: 'Desconhecido',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
  },
}

export function ProjectCard({ project }: ProjectCardProps) {
  const status = statusConfig[project.status]
  const { addToast } = useToast()

  const { mutate: runPlaywright, isPending: isRunningTests } =
    useRunPlaywrightService({
      onSuccess: (data) => {
        const durationSeconds = Math.round(data.duration / 1000)
        if (data.failed > 0) {
          addToast(
            `Testes falharam: ${data.failed}/${data.totalTests} em ${durationSeconds}s`,
            'error',
          )
        } else {
          addToast(
            `Todos os testes passaram: ${data.passed}/${data.totalTests} em ${durationSeconds}s`,
            'success',
          )
        }
      },
      onError: (err) => addToast(err.message, 'error'),
    })

  const hasPlaywright = Boolean(project.playwrightRunUrl)

  const handleRunTests = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addToast('Executando testes Playwright...', 'info')
    runPlaywright(project.id)
  }

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="transition-all hover:shadow-md">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  {project.name}
                </h3>
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                    status.bgColor,
                    status.color,
                  )}
                >
                  {status.label}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                {project.frontHealthCheckUrl && (
                  <span title={project.frontHealthCheckUrl}>Front</span>
                )}
                {project.backHealthCheckUrl && (
                  <span title={project.backHealthCheckUrl}>Back</span>
                )}
                {project.playwrightRunUrl && (
                  <span title={project.playwrightRunUrl}>Playwright</span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {project.frontHealthCheckUrl && (
              <span className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                Front
              </span>
            )}
            {project.backHealthCheckUrl && (
              <span className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                Back
              </span>
            )}
            {project.playwrightRunUrl && (
              <span className="inline-flex items-center rounded-md bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700">
                Playwright
              </span>
            )}
          </div>

          {hasPlaywright && (
            <div className="mt-4">
              <Button
                size="sm"
                variant="secondary"
                loading={isRunningTests}
                onClick={handleRunTests}
                disabled={!project.isActive}
              >
                {isRunningTests ? 'Running Tests...' : 'Run Tests'}
              </Button>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
            <span>
              {project.lastCheckAt
                ? `Last check: ${new Date(project.lastCheckAt).toLocaleString()}`
                : 'No checks yet'}
            </span>
            <span
              className={cn(
                project.isActive ? 'text-success-600' : 'text-gray-400',
              )}
            >
              {project.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
