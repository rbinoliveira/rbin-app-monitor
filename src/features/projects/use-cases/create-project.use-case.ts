import type { CreateProjectInput, Project } from '@/shared/types'

export async function createProjectUseCase(
  input: CreateProjectInput,
): Promise<Project> {
  const response = await fetch('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error ?? 'Falha ao criar projeto')
  }

  return data.data
}
