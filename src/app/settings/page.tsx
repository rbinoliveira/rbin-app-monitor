'use client'

import { type FormEvent, useEffect, useState } from 'react'

import { useSettings } from '@/features/settings'
import { MainLayout } from '@/shared/components/layout/MainLayout'
import { Button } from '@/shared/components/ui/Button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/Card'
import { Input } from '@/shared/components/ui/Input'
import { INTERVAL_HOURS } from '@/shared/lib/constants'

export default function SettingsPage() {
  const {
    settings,
    loading,
    error,
    refresh,
    updateSettings,
    saving,
    saveError,
  } = useSettings()

  const [healthCheckHours, setHealthCheckHours] = useState<string>('')
  const [cypressHours, setCypressHours] = useState<string>('')
  const [localError, setLocalError] = useState<{ healthCheck?: string; cypress?: string }>({})

  useEffect(() => {
    if (settings) {
      setHealthCheckHours(String(settings.healthCheckIntervalHours))
      setCypressHours(String(settings.cypressIntervalHours))
    }
  }, [settings])

  const validate = (): boolean => {
    const err: { healthCheck?: string; cypress?: string } = {}
    const h = Number(healthCheckHours)
    const c = Number(cypressHours)
    if (
      !Number.isInteger(h) ||
      h < INTERVAL_HOURS.MIN ||
      h > INTERVAL_HOURS.MAX
    ) {
      err.healthCheck = `Between ${INTERVAL_HOURS.MIN} and ${INTERVAL_HOURS.MAX} hours`
    }
    if (
      !Number.isInteger(c) ||
      c < INTERVAL_HOURS.MIN ||
      c > INTERVAL_HOURS.MAX
    ) {
      err.cypress = `Between ${INTERVAL_HOURS.MIN} and ${INTERVAL_HOURS.MAX} hours`
    }
    setLocalError(err)
    return Object.keys(err).length === 0
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!validate()) return
    try {
      await updateSettings({
        healthCheckIntervalHours: Number(healthCheckHours),
        cypressIntervalHours: Number(cypressHours),
      })
    } catch {
      // saveError is set by hook
    }
  }

  if (loading && !settings) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center p-12">
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
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Configure how often health checks and Cypress tests run
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-danger-200 bg-danger-50 p-4">
            <p className="text-sm font-medium text-danger-800">
              Error loading settings
            </p>
            <p className="mt-1 text-sm text-danger-600">{error}</p>
            <Button variant="secondary" size="sm" className="mt-3" onClick={refresh}>
              Retry
            </Button>
          </div>
        )}

        {settings && (
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Monitor intervals</CardTitle>
                <CardDescription>
                  Set the interval in hours for health checks and Cypress test
                  runs. Configure your cron to call the API at these intervals.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <Input
                  label="Health check interval (hours)"
                  type="number"
                  min={INTERVAL_HOURS.MIN}
                  max={INTERVAL_HOURS.MAX}
                  placeholder="12"
                  value={healthCheckHours}
                  onChange={(e) => setHealthCheckHours(e.target.value)}
                  error={localError.healthCheck}
                  hint={`How often to run health checks (${INTERVAL_HOURS.MIN}–${INTERVAL_HOURS.MAX} hours). Example: 12 = twice per day.`}
                />

                <Input
                  label="Cypress tests interval (hours)"
                  type="number"
                  min={INTERVAL_HOURS.MIN}
                  max={INTERVAL_HOURS.MAX}
                  placeholder="12"
                  value={cypressHours}
                  onChange={(e) => setCypressHours(e.target.value)}
                  error={localError.cypress}
                  hint={`How often to run Cypress E2E tests (${INTERVAL_HOURS.MIN}–${INTERVAL_HOURS.MAX} hours). Can differ from health check.`}
                />

                {saveError && (
                  <div className="rounded-lg border border-danger-200 bg-danger-50 p-4">
                    <p className="text-sm font-medium text-danger-800">
                      {saveError}
                    </p>
                  </div>
                )}
              </CardContent>

              <CardFooter>
                <Button
                  type="submit"
                  loading={saving}
                  disabled={saving || loading}
                >
                  Save
                </Button>
              </CardFooter>
            </Card>
          </form>
        )}
      </div>
    </MainLayout>
  )
}
