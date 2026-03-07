import { expect, test } from '@playwright/test'

test.describe('Execution History E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard')
  })

  test('should display history section', async ({ page }) => {
    await expect(page.getByText('Execution History')).toBeVisible()
  })

  test('should display history table', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible()
  })

  test('should display empty state when no history exists', async ({ page }) => {
    await page.route('/api/history**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [],
          pagination: { page: 1, pageSize: 20, total: 0, hasMore: false },
        }),
      })
    })

    await page.goto('/dashboard')
    await expect(page.getByText('No execution history')).toBeVisible()
  })

  test('should display health check results in history', async ({ page }) => {
    const mockHistory = [
      {
        id: '1',
        projectId: 'project-1',
        projectName: 'Test Project',
        type: 'web',
        url: 'https://example.com',
        success: true,
        statusCode: 200,
        responseTime: 150,
        timestamp: new Date().toISOString(),
      },
    ]

    await page.route('/api/history**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: mockHistory,
          pagination: { page: 1, pageSize: 20, total: 1, hasMore: false },
        }),
      })
    })

    await page.goto('/dashboard')
    await expect(page.getByText('Test Project')).toBeVisible()
    await expect(page.getByText('https://example.com')).toBeVisible()
  })

  test('should display Playwright test results in history', async ({ page }) => {
    const mockHistory = [
      {
        id: '2',
        projectId: 'project-1',
        projectName: 'Test Project',
        success: true,
        totalTests: 10,
        passed: 10,
        failed: 0,
        skipped: 0,
        duration: 5000,
        specFiles: ['test.spec.ts'],
        output: 'All tests passed',
        timestamp: new Date().toISOString(),
      },
    ]

    await page.route('/api/history**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: mockHistory,
          pagination: { page: 1, pageSize: 20, total: 1, hasMore: false },
        }),
      })
    })

    await page.goto('/dashboard')
    await expect(page.getByText('Test Project')).toBeVisible()
    await expect(page.getByText('10')).toBeVisible()
    await expect(page.getByText('passed')).toBeVisible()
  })

  test('should show success and failure status indicators', async ({ page }) => {
    const mockHistory = [
      {
        id: '1',
        projectId: 'project-1',
        projectName: 'Test Project',
        type: 'web',
        url: 'https://example.com',
        success: true,
        statusCode: 200,
        responseTime: 150,
        timestamp: new Date().toISOString(),
      },
      {
        id: '2',
        projectId: 'project-1',
        projectName: 'Test Project',
        type: 'web',
        url: 'https://example.com',
        success: false,
        statusCode: 500,
        responseTime: 200,
        timestamp: new Date().toISOString(),
      },
    ]

    await page.route('/api/history**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: mockHistory,
          pagination: { page: 1, pageSize: 20, total: 2, hasMore: false },
        }),
      })
    })

    await page.goto('/dashboard')
    await expect(page.getByText('Success')).toBeVisible()
    await expect(page.getByText('Failed')).toBeVisible()
  })
})
