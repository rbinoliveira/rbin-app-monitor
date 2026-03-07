import type { Project, UpdateProjectInput } from '@/shared/types'

export async function updateProjectUseCase(
  projectId: string,
  input: UpdateProjectInput,
): Promise<Project> {
  const response = await fetch(`/api/projects/${projectId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error ?? 'Falha ao atualizar projeto')
  }

  return data.data
}
