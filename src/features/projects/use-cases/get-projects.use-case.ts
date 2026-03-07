import type { Project } from '@/shared/types/project.type'

export async function getProjectsUseCase(): Promise<Project[]> {
  const response = await fetch('/api/projects', { credentials: 'include' })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.error ?? 'Falha ao carregar projetos')
  }

  const data = await response.json()
  return data.data ?? []
}
