import type { MonitorSettings } from '@/shared/types/monitor-settings.type'

export async function getSettingsUseCase(): Promise<MonitorSettings> {
  const response = await fetch('/api/settings', {
    credentials: 'include',
  })

  const result = await response.json()

  if (!response.ok || !result.success) {
    throw new Error(result.error ?? 'Falha ao carregar configurações')
  }

  const data = result.data
  return {
    ...data,
    updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
  }
}
