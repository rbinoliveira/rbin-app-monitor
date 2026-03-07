import { expect, test } from '@playwright/test'

test.describe('Project Listing E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard')
  })

  test('should display dashboard page', async ({ page }) => {
    await expect(page.getByText('Projects')).toBeVisible()
  })

  test('should show "New Project" button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /new project/i })).toBeVisible()
  })

  test('should display project statistics cards', async ({ page }) => {
    await expect(page.getByText('Total Projects')).toBeVisible()
    await expect(page.getByText('Healthy')).toBeVisible()
    await expect(page.getByText('Unhealthy')).toBeVisible()
  })

  test('should display empty state when no projects exist', async ({ page }) => {
    await page.route('/api/projects', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      })
    })

    await page.goto('/dashboard')
    await expect(page.getByText('No projects yet')).toBeVisible()
  })

  test('should display projects with status indicators', async ({ page }) => {
    await page.route('/api/projects', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: '1',
              name: 'Healthy Project',
              frontHealthCheckUrl: 'https://example.com',
              status: 'healthy',
              isActive: true,
              lastCheckAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: '2',
              name: 'Unhealthy Project',
              backHealthCheckUrl: 'https://example2.com',
              status: 'unhealthy',
              isActive: true,
              lastCheckAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        }),
      })
    })

    await page.goto('/dashboard')
    await expect(page.getByText('Healthy Project')).toBeVisible()
    await expect(page.getByText('Unhealthy Project')).toBeVisible()
  })

  test('should show loading state while fetching projects', async ({ page }) => {
    await page.route('/api/projects', async (route) => {
      await new Promise((r) => setTimeout(r, 1000))
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      })
    })

    await page.goto('/dashboard')
    await expect(page.getByText(/loading/i)).toBeVisible()
  })
})
