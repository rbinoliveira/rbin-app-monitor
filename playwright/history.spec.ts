import { expect, test } from '@playwright/test'

test.describe('Execution History E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/history')
  })

  test('should display history page', async ({ page }) => {
    await expect(page.getByText('Execution History')).toBeVisible()
    await expect(
      page.getByText('View health check results and Cypress test executions'),
    ).toBeVisible()
  })

  test('should display history table', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible()
  })

  test('should show loading state while fetching history', async ({ page }) => {
    await page.route('**/api/history*', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [],
          pagination: {
            page: 1,
            pageSize: 20,
            total: 0,
            hasMore: false,
          },
        }),
      })
    })
    await page.goto('/history')
    await expect(page.getByText('Loading')).toBeVisible()
  })

  test('should display empty state when no history exists', async ({
    page,
  }) => {
    await page.route('**/api/history*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [],
          pagination: {
            page: 1,
            pageSize: 20,
            total: 0,
            hasMore: false,
          },
        }),
      }),
    )
    await page.goto('/history')
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
    await page.route('**/api/history*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: mockHistory,
          pagination: {
            page: 1,
            pageSize: 20,
            total: 1,
            hasMore: false,
          },
        }),
      }),
    )
    await page.goto('/history')
    await expect(page.getByText('Test Project')).toBeVisible()
    await expect(page.getByText('web')).toBeVisible()
    await expect(page.getByText('https://example.com')).toBeVisible()
  })

  test('should display Cypress test results in history', async ({ page }) => {
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
        specFiles: ['test.cy.ts'],
        output: 'All tests passed',
        timestamp: new Date().toISOString(),
      },
    ]
    await page.route('**/api/history*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: mockHistory,
          pagination: {
            page: 1,
            pageSize: 20,
            total: 1,
            hasMore: false,
          },
        }),
      }),
    )
    await page.goto('/history')
    await expect(page.getByText('Test Project')).toBeVisible()
    await expect(page.getByText('10')).toBeVisible()
    await expect(page.getByText('passed')).toBeVisible()
  })

  test('should filter history by project', async ({ page }) => {
    await page.route('**/api/history*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [],
          pagination: {
            page: 1,
            pageSize: 20,
            total: 0,
            hasMore: false,
          },
        }),
      }),
    )
    await page.goto('/history')
    await expect(page.locator('select[name="projectId"]')).toBeVisible()
    await page.locator('select[name="projectId"]').selectOption('project-1')
  })

  test('should filter history by type', async ({ page }) => {
    await page.route('**/api/history*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [],
          pagination: {
            page: 1,
            pageSize: 20,
            total: 0,
            hasMore: false,
          },
        }),
      }),
    )
    await page.goto('/history')
    await expect(page.locator('select[name="type"]')).toBeVisible()
    await page.locator('select[name="type"]').selectOption('web')
  })

  test('should filter history by status', async ({ page }) => {
    await page.route('**/api/history*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [],
          pagination: {
            page: 1,
            pageSize: 20,
            total: 0,
            hasMore: false,
          },
        }),
      }),
    )
    await page.goto('/history')
    await expect(page.locator('select[name="status"]')).toBeVisible()
    await page.locator('select[name="status"]').selectOption('success')
  })

  test('should paginate through history results', async ({ page }) => {
    const mockHistoryPage1 = Array.from({ length: 20 }, (_, i) => ({
      id: `item-${i}`,
      projectId: 'project-1',
      projectName: 'Test Project',
      type: 'web',
      url: 'https://example.com',
      success: true,
      statusCode: 200,
      responseTime: 150,
      timestamp: new Date().toISOString(),
    }))
    await page.route('**/api/history*page=1*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: mockHistoryPage1,
          pagination: {
            page: 1,
            pageSize: 20,
            total: 25,
            hasMore: true,
          },
        }),
      }),
    )
    await page.route('**/api/history*page=2*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [],
          pagination: {
            page: 2,
            pageSize: 20,
            total: 25,
            hasMore: false,
          },
        }),
      }),
    )
    await page.goto('/history')
    await expect(page.getByText('Next')).toBeVisible()
    await page.getByText('Next').click()
  })

  test('should display error message on API failure', async ({ page }) => {
    await page.route('**/api/history*', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Internal server error',
        }),
      }),
    )
    await page.goto('/history')
    await expect(page.getByText('Error loading history')).toBeVisible()
    await expect(page.getByText('Internal server error')).toBeVisible()
  })

  test('should show success and failure status indicators', async ({
    page,
  }) => {
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
    await page.route('**/api/history*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: mockHistory,
          pagination: {
            page: 1,
            pageSize: 20,
            total: 2,
            hasMore: false,
          },
        }),
      }),
    )
    await page.goto('/history')
    await expect(page.getByText('Success')).toBeVisible()
    await expect(page.getByText('Failed')).toBeVisible()
  })
})
