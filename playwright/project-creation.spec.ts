import { expect, test } from '@playwright/test'

test.describe('Project Creation E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/projects/new')
  })

  test('should display project creation form', async ({ page }) => {
    await expect(page.getByText('Create Project')).toBeVisible()
    await expect(page.locator('input[name="name"]')).toBeVisible()
    await expect(page.locator('input[name="baseUrl"]')).toBeVisible()
  })

  test('should show validation errors for empty form', async ({ page }) => {
    await page.locator('button[type="submit"]').click()
    await expect(page.getByText('Project name is required')).toBeVisible()
    await expect(page.getByText('Base URL is required')).toBeVisible()
    await expect(
      page.getByText('At least one monitoring type must be selected'),
    ).toBeVisible()
  })

  test('should validate project name length', async ({ page }) => {
    await page.locator('input[name="name"]').fill('ab')
    await page.locator('input[name="baseUrl"]').fill('https://example.com')
    await page.locator('button[type="submit"]').click()
    await expect(
      page.getByText('Project name must be at least 3 characters'),
    ).toBeVisible()
  })

  test('should validate URL format', async ({ page }) => {
    await page.locator('input[name="name"]').fill('Test Project')
    await page.locator('input[name="baseUrl"]').fill('invalid-url')
    await page.locator('button[type="submit"]').click()
    await expect(page.getByText('Base URL must be a valid URL')).toBeVisible()
  })

  test('should allow selecting monitoring types', async ({ page }) => {
    await page.locator('input[name="name"]').fill('Test Project')
    await page.locator('input[name="baseUrl"]').fill('https://example.com')
    await page.locator('input[type="checkbox"][value="web"]').check()
    await page.locator('input[type="checkbox"][value="rest"]').check()
    await expect(
      page.locator('input[type="checkbox"][value="web"]'),
    ).toBeChecked()
    await expect(
      page.locator('input[type="checkbox"][value="rest"]'),
    ).toBeChecked()
  })

  test('should submit form with valid data', async ({ page }) => {
    await page.route('**/api/projects', (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'test-id',
              name: 'Test Project',
              baseUrl: 'https://example.com',
              monitoringTypes: ['web'],
              status: 'unknown',
              isActive: true,
            },
          }),
        })
      }
      return route.continue()
    })
    await page.locator('input[name="name"]').fill('Test Project')
    await page.locator('input[name="baseUrl"]').fill('https://example.com')
    await page.locator('input[type="checkbox"][value="web"]').check()
    await page.locator('button[type="submit"]').click()
    await expect(
      page.waitForResponse(
        (res) =>
          res.url().includes('/api/projects') &&
          res.request().method() === 'POST',
      ),
    ).resolves.toBeTruthy()
  })
})
