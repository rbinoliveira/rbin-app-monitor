'use client'

import { useRouter } from 'next/navigation'
import { type FormEvent, useState } from 'react'

import { useCreateProject } from '@/features/projects'
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

interface FormErrors {
  name?: string
  atLeastOne?: string
  frontHealthCheckUrl?: string
  backHealthCheckUrl?: string
  cypressRunUrl?: string
}

function isValidUrl(value: string): boolean {
  try {
    const trimmed = value.trim()
    if (!trimmed) return true
    new URL(trimmed)
    return true
  } catch {
    return false
  }
}

export default function NewProjectPage() {
  const router = useRouter()
  const { createProject, loading, error: hookError } = useCreateProject()
  const [formData, setFormData] = useState({
    name: '',
    frontHealthCheckUrl: '',
    backHealthCheckUrl: '',
    cypressRunUrl: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required'
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Project name must be at least 3 characters'
    }

    const front = formData.frontHealthCheckUrl.trim()
    const back = formData.backHealthCheckUrl.trim()
    const cypress = formData.cypressRunUrl.trim()

    if (!front && !back && !cypress) {
      newErrors.atLeastOne =
        'Provide at least one URL: front health check, back health check, or Cypress run API'
    }

    if (front && !isValidUrl(formData.frontHealthCheckUrl)) {
      newErrors.frontHealthCheckUrl = 'Enter a valid URL'
    }
    if (back && !isValidUrl(formData.backHealthCheckUrl)) {
      newErrors.backHealthCheckUrl = 'Enter a valid URL'
    }
    if (cypress && !isValidUrl(formData.cypressRunUrl)) {
      newErrors.cypressRunUrl = 'Enter a valid URL'
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
        frontHealthCheckUrl: formData.frontHealthCheckUrl.trim() || null,
        backHealthCheckUrl: formData.backHealthCheckUrl.trim() || null,
        cypressRunUrl: formData.cypressRunUrl.trim() || null,
      })
    } catch (err) {
      console.error('Error creating project:', err)
    }
  }

  const handleInputChange = (
    field: keyof typeof formData,
    value: string,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field] || errors.atLeastOne) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
        atLeastOne: undefined,
      }))
    }
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">New Project</h1>
          <p className="mt-1 text-sm text-gray-500">
            Add a project to monitor front health, back health, and Cypress
            tests. Provide at least one URL.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
              <CardDescription>
                Name the project and add one or more URLs. At least one URL is
                required.
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

              {errors.atLeastOne && (
                <p className="text-sm text-danger-600">{errors.atLeastOne}</p>
              )}

              <Input
                label="Front health check URL (optional)"
                type="url"
                placeholder="https://app.example.com"
                value={formData.frontHealthCheckUrl}
                onChange={(e) =>
                  handleInputChange('frontHealthCheckUrl', e.target.value)
                }
                error={errors.frontHealthCheckUrl}
                hint="URL of the front-end to check (GET request). Leave empty if not used."
              />

              <Input
                label="Back health check URL (optional)"
                type="url"
                placeholder="https://api.example.com/health"
                value={formData.backHealthCheckUrl}
                onChange={(e) =>
                  handleInputChange('backHealthCheckUrl', e.target.value)
                }
                error={errors.backHealthCheckUrl}
                hint="URL of the back-end / API to check (GET request). Leave empty if not used."
              />

              <Input
                label="Cypress run API URL (optional)"
                type="url"
                placeholder="https://app.example.com/api/cypress-run"
                value={formData.cypressRunUrl}
                onChange={(e) =>
                  handleInputChange('cypressRunUrl', e.target.value)
                }
                error={errors.cypressRunUrl}
                hint="URL that runs Cypress tests and returns JSON (success, passed, failed, totalTests, duration). Leave empty if not used."
              />

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
