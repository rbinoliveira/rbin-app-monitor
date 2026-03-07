import type {
  MonitorSettings,
  UpdateMonitorSettingsInput,
} from '@/shared/types/monitor-settings.type'

export async function updateSettingsUseCase(
  input: UpdateMonitorSettingsInput,
): Promise<MonitorSettings> {
  const response = await fetch('/api/settings', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  })

  const result = await response.json()

  if (!response.ok || !result.success) {
    throw new Error(result.error ?? 'Falha ao atualizar configurações')
  }

  const data = result.data
  return {
    ...data,
    updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
  }
}
