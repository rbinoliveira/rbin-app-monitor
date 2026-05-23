import type { UserGithubCredentialStatus } from '@/shared/types/user-credentials.type'

export async function getGithubIntegrationUseCase(): Promise<UserGithubCredentialStatus> {
  const response = await fetch('/api/settings/github', {
    credentials: 'include',
  })
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error ?? 'Falha ao carregar integração GitHub')
  }

  return data.data
}

export async function setGithubIntegrationUseCase(
  token: string,
): Promise<UserGithubCredentialStatus> {
  const response = await fetch('/api/settings/github', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ token }),
  })
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error ?? 'Falha ao salvar token GitHub')
  }

  return data.data
}

export async function deleteGithubIntegrationUseCase(): Promise<void> {
  const response = await fetch('/api/settings/github', {
    method: 'DELETE',
    credentials: 'include',
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.error ?? 'Falha ao remover integração GitHub')
  }
}
