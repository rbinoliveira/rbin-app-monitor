'use client'

import Link from 'next/link'

import { MainLayout } from '@/components/layout/MainLayout'
import { ProjectCard } from '@/components/projects'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useProjects } from '@/hooks'

export default function ProjectsPage() {
  const { projects, loading, error, refresh } = useProjects()

  const healthyCount = projects.filter((p) => p.status === 'healthy').length
  const unhealthyCount = projects.filter((p) => p.status === 'unhealthy').length
  const unknownCount = projects.filter((p) => p.status === 'unknown').length

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
            <p className="mt-1 text-sm text-gray-500">
              Monitor your applications health and test results
            </p>
          </div>
          <Link href="/projects/new">
            <Button>New Project</Button>
          </Link>
        </div>

        {loading && projects.length === 0 && (
          <Card className="p-12 text-center">
            <div className="flex flex-col items-center justify-center">
              <svg
                className="h-8 w-8 animate-spin text-primary-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <p className="mt-4 text-sm text-gray-500">Loading projects...</p>
            </div>
          </Card>
        )}

        {error && (
          <Card className="border-danger-200 bg-danger-50 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-danger-800 text-sm font-medium">
                  Error loading projects
                </p>
                <p className="mt-1 text-sm text-danger-600">{error}</p>
              </div>
              <Button variant="secondary" size="sm" onClick={refresh}>
                Retry
              </Button>
            </div>
          </Card>
        )}

        {!loading && !error && projects.length === 0 && (
          <Card className="p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">
              No projects yet
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Get started by creating your first project to monitor
            </p>
            <div className="mt-6">
              <Link href="/projects/new">
                <Button>Create Project</Button>
              </Link>
            </div>
          </Card>
        )}

        {!loading && !error && projects.length > 0 && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="p-4">
                <div className="text-sm font-medium text-gray-500">
                  Total Projects
                </div>
                <div className="mt-1 text-2xl font-semibold text-gray-900">
                  {projects.length}
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-sm font-medium text-gray-500">Healthy</div>
                <div className="mt-1 text-2xl font-semibold text-success-600">
                  {healthyCount}
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-sm font-medium text-gray-500">
                  Unhealthy
                </div>
                <div className="mt-1 text-2xl font-semibold text-danger-600">
                  {unhealthyCount}
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-sm font-medium text-gray-500">Unknown</div>
                <div className="mt-1 text-2xl font-semibold text-gray-400">
                  {unknownCount}
                </div>
              </Card>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </>
        )}
      </div>
    </MainLayout>
  )
}
