'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useCreateProject } from '@/hooks'
import type { MonitoringType } from '@/types'
import { MONITORING_TYPE_LABELS } from '@/types'

interface FormErrors {
  name?: string
  baseUrl?: string
  monitoringTypes?: string
}

export default function NewProjectPage() {
  const router = useRouter()
  const { createProject, loading, error: hookError } = useCreateProject()
  const [formData, setFormData] = useState({
    name: '',
    baseUrl: '',
    monitoringTypes: [] as MonitoringType[],
  })
  const [errors, setErrors] = useState<FormErrors>({})

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required'
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Project name must be at least 3 characters'
    }

    if (!formData.baseUrl.trim()) {
      newErrors.baseUrl = 'Base URL is required'
    } else {
      try {
        const url = new URL(formData.baseUrl.trim())
        if (!['http:', 'https:'].includes(url.protocol)) {
          newErrors.baseUrl = 'URL must use HTTP or HTTPS protocol'
        }
      } catch {
        newErrors.baseUrl = 'Please enter a valid URL (e.g., https://example.com)'
      }
    }

    if (formData.monitoringTypes.length === 0) {
      newErrors.monitoringTypes = 'Select at least one monitoring type'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      await createProject({
        name: formData.name.trim(),
        baseUrl: formData.baseUrl.trim(),
        monitoringTypes: formData.monitoringTypes,
      })
    } catch (err) {
      console.error('Error creating project:', err)
    }
  }

  const toggleMonitoringType = (type: MonitoringType) => {
    setFormData((prev) => ({
      ...prev,
      monitoringTypes: prev.monitoringTypes.includes(type)
        ? prev.monitoringTypes.filter((t) => t !== type)
        : [...prev.monitoringTypes, type],
    }))
    if (errors.monitoringTypes) {
      setErrors((prev) => ({ ...prev, monitoringTypes: undefined }))
    }
  }

  const handleInputChange = (field: 'name' | 'baseUrl', value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const monitoringTypes: MonitoringType[] = ['web', 'rest', 'wordpress', 'cypress']

  return (
    <MainLayout>
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">New Project</h1>
          <p className="mt-1 text-sm text-gray-500">
            Add a new project to monitor its health and run tests
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
              <CardDescription>
                Enter the basic information about the project you want to monitor
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <Input
                label="Project Name"
                type="text"
                placeholder="My Awesome Project"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                error={errors.name}
                hint="A descriptive name for your project"
                required
              />

              <Input
                label="Base URL"
                type="url"
                placeholder="https://example.com"
                value={formData.baseUrl}
                onChange={(e) => handleInputChange('baseUrl', e.target.value)}
                error={errors.baseUrl}
                hint="The base URL of your application (must include http:// or https://)"
                required
              />

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Monitoring Types <span className="text-danger-600">*</span>
                </label>
                <div className="space-y-3">
                  {monitoringTypes.map((type) => (
                    <label
                      key={type}
                      className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={formData.monitoringTypes.includes(type)}
                        onChange={() => toggleMonitoringType(type)}
                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {MONITORING_TYPE_LABELS[type]}
                        </div>
                        <div className="mt-0.5 text-xs text-gray-500">
                          {type === 'web' && 'Monitor web page availability'}
                          {type === 'rest' && 'Monitor REST API endpoints'}
                          {type === 'wordpress' && 'Monitor WordPress REST API'}
                          {type === 'cypress' && 'Run Cypress E2E tests'}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                {errors.monitoringTypes && (
                  <p className="mt-1.5 text-sm text-danger-600">{errors.monitoringTypes}</p>
                )}
              </div>

              {hookError && (
                <div className="rounded-lg border border-danger-200 bg-danger-50 p-4">
                  <p className="text-sm font-medium text-danger-800">Error</p>
                  <p className="mt-1 text-sm text-danger-600">{hookError}</p>
                </div>
              )}
            </CardContent>

            <CardFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" loading={loading} disabled={loading}>
                Create Project
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </MainLayout>
  )
}

