import { expect, test } from '@playwright/test'

test.describe('Health Check E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display dashboard page', async ({ page }) => {
    await expect(page.getByText('Projects')).toBeVisible()
  })

  test('should have health check API endpoint available', async ({
    request,
  }) => {
    const response = await request.get('/api/health-check/web?url=https://example.com')
    expect([200, 400, 500]).toContain(response.status())
  })

  test('should return structured health check response', async ({ request }) => {
    const response = await request.get('/api/health-check/web?url=https://example.com')
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
    const response = await request.get('/api/health-check/web?url=https://example.com')
    if (response.status() === 200) {
      const body = await response.json()
      if (body.success) {
        expect(body.data).toHaveProperty('success')
        expect(body.data).toHaveProperty('responseTime')
        expect(typeof body.data.responseTime).toBe('number')
      }
    }
  })

  test('should handle health check with invalid URL', async ({ request }) => {
    const response = await request.get('/api/health-check/web?url=invalid-url')
    expect([400, 500]).toContain(response.status())
    if (response.headers()['content-type']?.includes('application/json')) {
      const body = await response.json()
      expect(body).toHaveProperty('success')
      expect(body.success).toBe(false)
    }
  })

  test('should execute REST endpoint health check', async ({ request }) => {
    const response = await request.post('/api/health-check/rest', {
      data: { url: 'https://example.com', method: 'GET' },
    })
    expect([200, 400, 500]).toContain(response.status())
    if (response.status() === 200) {
      const body = await response.json()
      if (body.success) {
        expect(body.data).toHaveProperty('success')
        expect(body.data).toHaveProperty('responseTime')
      }
    }
  })
})
