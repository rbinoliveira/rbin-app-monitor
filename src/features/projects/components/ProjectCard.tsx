'use client'

import Link from 'next/link'
import { useState } from 'react'

import { Button } from '@/shared/components/ui/Button'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { useToast } from '@/shared/components/ui/Toast'
import { cn } from '@/shared/lib/utils'
import type { Project, ProjectStatus } from '@/shared/types'
import { MONITORING_TYPE_LABELS } from '@/shared/types'

interface ProjectCardProps {
  project: Project
}

const statusConfig: Record<
  ProjectStatus,
  { label: string; color: string; bgColor: string }
> = {
  healthy: {
    label: 'Healthy',
    color: 'text-success-700',
    bgColor: 'bg-success-100',
  },
  unhealthy: {
    label: 'Unhealthy',
    color: 'text-danger-700',
    bgColor: 'bg-danger-100',
  },
  unknown: {
    label: 'Unknown',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
  },
}

export function ProjectCard({ project }: ProjectCardProps) {
  const status = statusConfig[project.status]
  const { addToast } = useToast()
  const [isRunningTests, setIsRunningTests] = useState(false)

  const hasCypressMonitoring = project.monitoringTypes.includes('cypress')

  const handleRunTests = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setIsRunningTests(true)
    addToast('Running Cypress tests...', 'info')

    try {
      const response = await fetch('/api/cypress/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: project.id,
        }),
      })

      const result = await response.json()

      if (result.success && result.data) {
        const { passed, failed, totalTests, duration } = result.data
        const durationSeconds = Math.round(duration / 1000)

        if (failed > 0) {
          addToast(
            `Tests failed: ${failed}/${totalTests} failed in ${durationSeconds}s`,
            'error',
          )
        } else {
          addToast(
            `All tests passed: ${passed}/${totalTests} in ${durationSeconds}s`,
            'success',
          )
        }
      } else {
        addToast(result.error || 'Failed to run tests', 'error')
      }
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : 'Failed to run tests',
        'error',
      )
    } finally {
      setIsRunningTests(false)
    }
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
              <p className="mt-1 text-sm text-gray-500">{project.baseUrl}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {project.monitoringTypes.map((type) => (
              <span
                key={type}
                className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700"
              >
                {MONITORING_TYPE_LABELS[type]}
              </span>
            ))}
          </div>

          {hasCypressMonitoring && (
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
