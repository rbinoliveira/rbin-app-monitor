'use client'

import { useCallback, useState } from 'react'

import { useApi } from '@/shared/hooks'
import type {
  MonitorSettings,
  UpdateMonitorSettingsInput,
} from '@/shared/types'

interface UseSettingsReturn {
  settings: MonitorSettings | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  updateSettings: (input: UpdateMonitorSettingsInput) => Promise<void>
  saving: boolean
  saveError: string | null
}

export function useSettings(): UseSettingsReturn {
  const {
    data,
    loading,
    error,
    fetch: refetch,
  } = useApi<MonitorSettings>('/api/settings', { autoFetch: true })

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const updateSettings = useCallback(
    async (input: UpdateMonitorSettingsInput) => {
      setSaving(true)
      setSaveError(null)
      try {
        const response = await fetch('/api/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        })
        const result = await response.json()
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Failed to update settings')
        }
        await refetch()
      } catch (err) {
        setSaveError(
          err instanceof Error ? err.message : 'An unexpected error occurred',
        )
        throw err
      } finally {
        setSaving(false)
      }
    },
    [refetch],
  )

  return {
    settings: data,
    loading,
    error,
    refresh: refetch,
    updateSettings,
    saving,
    saveError,
  }
}
