import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display home page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Basha Vara/);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Login');
    await expect(page).toHaveURL(/.*\/login/);
    await expect(page.locator('h1')).toContainText('Login');
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Register');
    await expect(page).toHaveURL(/.*\/register/);
    await expect(page.locator('h1')).toContainText('Register');
  });

  test('should show validation errors on empty form submission', async ({ page }) => {
    await page.goto('/register');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Email is required')).toBeVisible();
  });
});
