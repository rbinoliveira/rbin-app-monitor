import { expect, test } from '@playwright/test'

test.describe('Project Creation E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard')
  })

  test('should display project creation modal', async ({ page }) => {
    await page.getByRole('button', { name: /new project/i }).click()
    await expect(page.getByText('Create Project')).toBeVisible()
    await expect(page.locator('input[name="name"]')).toBeVisible()
  })

  test('should show validation errors for empty form', async ({ page }) => {
    await page.getByRole('button', { name: /new project/i }).click()
    await page.getByRole('button', { name: /submit|create/i }).click()
    await expect(page.getByText('Project name is required')).toBeVisible()
  })

  test('should validate project name length', async ({ page }) => {
    await page.getByRole('button', { name: /new project/i }).click()
    await page.locator('input[name="name"]').fill('ab')
    await page.getByRole('button', { name: /submit|create/i }).click()
    await expect(
      page.getByText('Project name must be at least 3 characters'),
    ).toBeVisible()
  })

  test('should validate URL format', async ({ page }) => {
    await page.getByRole('button', { name: /new project/i }).click()
    await page.locator('input[name="name"]').fill('Test Project')
    await page.locator('input[name="frontHealthCheckUrl"]').fill('invalid-url')
    await page.getByRole('button', { name: /submit|create/i }).click()
    await expect(page.getByText(/must be a valid URL/i)).toBeVisible()
  })

  test('should submit form with valid data', async ({ page }) => {
    await page.route('/api/projects', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'test-id',
            name: 'Test Project',
            status: 'unknown',
            isActive: true,
          },
        }),
      })
    })

    await page.getByRole('button', { name: /new project/i }).click()
    await page.locator('input[name="name"]').fill('Test Project')
    await page.locator('input[name="frontHealthCheckUrl"]').fill('https://example.com')
    await page.getByRole('button', { name: /submit|create/i }).click()
  })
})
