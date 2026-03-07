import { expect, test } from '@playwright/test'

test.describe('Project Listing E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/projects')
  })

  test('should display projects page', async ({ page }) => {
    await expect(page.getByText('Projects')).toBeVisible()
    await expect(
      page.getByText('Monitor your applications health and test results'),
    ).toBeVisible()
  })

  test('should show "New Project" button', async ({ page }) => {
    await expect(page.getByText('New Project')).toBeVisible()
    await expect(page.locator('a[href="/projects/new"]')).toBeVisible()
  })

  test('should display project statistics cards', async ({ page }) => {
    await expect(page.getByText('Total Projects')).toBeVisible()
    await expect(page.getByText('Healthy')).toBeVisible()
    await expect(page.getByText('Unhealthy')).toBeVisible()
    await expect(page.getByText('Unknown')).toBeVisible()
  })

  test('should display empty state when no projects exist', async ({
    page,
  }) => {
    await page.route('**/api/projects', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [],
        }),
      }),
    )
    await page.goto('/projects')
    await expect(page.getByText('No projects yet')).toBeVisible()
    await expect(
      page.getByText('Get started by creating your first project to monitor'),
    ).toBeVisible()
  })

  test('should display projects with status indicators', async ({ page }) => {
    await page.route('**/api/projects', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: '1',
              name: 'Healthy Project',
              baseUrl: 'https://example.com',
              monitoringTypes: ['web'],
              status: 'healthy',
              isActive: true,
              lastCheckAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: '2',
              name: 'Unhealthy Project',
              baseUrl: 'https://example2.com',
              monitoringTypes: ['rest'],
              status: 'unhealthy',
              isActive: true,
              lastCheckAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        }),
      }),
    )
    await page.goto('/projects')
    await expect(page.getByText('Healthy Project')).toBeVisible()
    await expect(page.getByText('Unhealthy Project')).toBeVisible()
    await expect(page.getByText('Healthy')).toBeVisible()
    await expect(page.getByText('Unhealthy')).toBeVisible()
  })

  test('should navigate to project detail when clicking project card', async ({
    page,
  }) => {
    await page.route('**/api/projects', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: '1',
              name: 'Test Project',
              baseUrl: 'https://example.com',
              monitoringTypes: ['web'],
              status: 'healthy',
              isActive: true,
              lastCheckAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        }),
      }),
    )
    await page.goto('/projects')
    await page.getByText('Test Project').click()
  })

  test('should show loading state while fetching projects', async ({
    page,
  }) => {
    await page.route('**/api/projects', async (route) => {
      await new Promise((r) => setTimeout(r, 1000))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [],
        }),
      })
    })
    await page.goto('/projects')
    await expect(page.getByText('Loading projects')).toBeVisible()
  })
})
