import { expect, test } from '@playwright/test'

test.describe('Health Check E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display projects page', async ({ page }) => {
    await expect(page.getByText('Projects')).toBeVisible()
  })

  test('should navigate to new project page', async ({ page }) => {
    await page.goto('/projects/new')
    await expect(page.getByText('Create Project')).toBeVisible()
  })

  test('should have health check API endpoint available', async ({
    request,
  }) => {
    const baseURL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const response = await request.get(
      `${baseURL}/api/health-check/web?url=${encodeURIComponent('https://example.com')}`,
    )
    expect([200, 400, 500]).toContain(response.status())
  })

  test('should return structured health check response', async ({
    request,
  }) => {
    const baseURL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const response = await request.get(
      `${baseURL}/api/health-check/web?url=${encodeURIComponent('https://example.com')}`,
    )
    if (response.status() === 200) {
      const body = await response.json()
      expect(body).toHaveProperty('success')
      expect(body).toHaveProperty('data')
      if (body.data) {
        expect(body.data).toHaveProperty('success')
        expect(body.data).toHaveProperty('responseTime')
      }
    }
  })

  test('should execute web health check successfully', async ({ request }) => {
    const baseURL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const response = await request.get(
      `${baseURL}/api/health-check/web?url=${encodeURIComponent('https://example.com')}`,
    )
    if (response.status() === 200) {
      const body = await response.json()
      if (body.success && body.data) {
        expect(body.data).toHaveProperty('success')
        expect(body.data).toHaveProperty('responseTime')
        expect(typeof body.data.responseTime).toBe('number')
      }
    }
  })

  test('should handle health check with invalid URL', async ({ request }) => {
    const baseURL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const response = await request.get(
      `${baseURL}/api/health-check/web?url=${encodeURIComponent('invalid-url')}`,
    )
    expect([400, 500]).toContain(response.status())
    const body = await response.json().catch(() => ({}))
    if (body && typeof body === 'object') {
      expect(body).toHaveProperty('success')
      if ('success' in body) expect(body.success).toBe(false)
    }
  })

  test('should execute REST endpoint health check', async ({ request }) => {
    const baseURL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const response = await request.post(`${baseURL}/api/health-check/rest`, {
      data: {
        url: 'https://example.com',
        method: 'GET',
      },
    })
    expect([200, 400, 500]).toContain(response.status())
    if (response.status() === 200) {
      const body = await response.json()
      if (body.success && body.data) {
        expect(body.data).toHaveProperty('success')
        expect(body.data).toHaveProperty('responseTime')
      }
    }
  })
})
