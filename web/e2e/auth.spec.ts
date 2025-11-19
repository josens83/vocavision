import { test, expect } from '@playwright/test';
import { testUser, loginUser, clearAuth } from './helpers/test-utils';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuth(page);
  });

  test.describe('Registration', () => {
    test('should display registration form', async ({ page }) => {
      await page.goto('/register');

      await expect(page.locator('input[name="name"]')).toBeVisible();
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should show validation errors for empty fields', async ({ page }) => {
      await page.goto('/register');
      await page.click('button[type="submit"]');

      await expect(page.locator('text=이름을 입력해주세요')).toBeVisible();
      await expect(page.locator('text=이메일을 입력해주세요')).toBeVisible();
    });

    test('should show error for mismatched passwords', async ({ page }) => {
      await page.goto('/register');

      await page.fill('input[name="name"]', 'Test User');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'Password123!');
      await page.fill('input[name="confirmPassword"]', 'DifferentPassword123!');
      await page.click('button[type="submit"]');

      await expect(page.locator('text=비밀번호가 일치하지 않습니다')).toBeVisible();
    });

    test('should register new user successfully', async ({ page }) => {
      const uniqueEmail = `test-${Date.now()}@example.com`;

      await page.goto('/register');
      await page.fill('input[name="name"]', testUser.name);
      await page.fill('input[name="email"]', uniqueEmail);
      await page.fill('input[name="password"]', testUser.password);
      await page.fill('input[name="confirmPassword"]', testUser.password);

      await page.click('button[type="submit"]');

      await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
    });

    test('should navigate to login page', async ({ page }) => {
      await page.goto('/register');
      await page.click('text=로그인');

      await expect(page).toHaveURL('/login');
    });
  });

  test.describe('Login', () => {
    test('should display login form', async ({ page }) => {
      await page.goto('/login');

      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login');

      await page.fill('input[name="email"]', 'invalid@example.com');
      await page.fill('input[name="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');

      await expect(page.locator('text=이메일 또는 비밀번호가 올바르지 않습니다')).toBeVisible({ timeout: 5000 });
    });

    test('should navigate to registration page', async ({ page }) => {
      await page.goto('/login');
      await page.click('text=회원가입');

      await expect(page).toHaveURL('/register');
    });

    test('should navigate to forgot password page', async ({ page }) => {
      await page.goto('/login');
      await page.click('text=비밀번호 찾기');

      await expect(page).toHaveURL('/forgot-password');
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect to login when accessing dashboard without auth', async ({ page }) => {
      await page.goto('/dashboard');

      await expect(page).toHaveURL(/login/);
    });

    test('should redirect to login when accessing learn without auth', async ({ page }) => {
      await page.goto('/learn');

      await expect(page).toHaveURL(/login/);
    });

    test('should redirect to login when accessing profile without auth', async ({ page }) => {
      await page.goto('/profile');

      await expect(page).toHaveURL(/login/);
    });
  });
});
