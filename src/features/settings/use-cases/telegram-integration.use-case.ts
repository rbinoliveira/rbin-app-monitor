import type { UserTelegramCredentialStatus } from '@/shared/types/user-credentials.type'

export async function getTelegramIntegrationUseCase(): Promise<UserTelegramCredentialStatus> {
  const response = await fetch('/api/settings/telegram', {
    credentials: 'include',
  })
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error ?? 'Falha ao carregar integração Telegram')
  }

  return data.data
}

export interface SetTelegramIntegrationInput {
  botToken: string
  chatId: string
}

export async function setTelegramIntegrationUseCase(
  input: SetTelegramIntegrationInput,
): Promise<UserTelegramCredentialStatus> {
  const response = await fetch('/api/settings/telegram', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  })
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error ?? 'Falha ao salvar integração Telegram')
  }

  return data.data
}

export async function deleteTelegramIntegrationUseCase(): Promise<void> {
  const response = await fetch('/api/settings/telegram', {
    method: 'DELETE',
    credentials: 'include',
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.error ?? 'Falha ao remover integração Telegram')
  }
}
