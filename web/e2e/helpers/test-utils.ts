import { Page, expect } from '@playwright/test';

// Test user credentials
export const testUser = {
  email: `test-${Date.now()}@example.com`,
  password: 'TestPassword123!',
  name: 'Test User',
};

// Helper to register a new user
export async function registerUser(page: Page, user = testUser) {
  await page.goto('/register');
  await page.fill('input[name="name"]', user.name);
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);
  await page.fill('input[name="confirmPassword"]', user.password);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
}

// Helper to login
export async function loginUser(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
}

// Helper to logout
export async function logoutUser(page: Page) {
  await page.click('[data-testid="user-menu"]');
  await page.click('[data-testid="logout-button"]');
  await expect(page).toHaveURL('/');
}

// Helper to check if user is authenticated
export async function isAuthenticated(page: Page): Promise<boolean> {
  const token = await page.evaluate(() => localStorage.getItem('token'));
  return !!token;
}

// Helper to set auth token directly
export async function setAuthToken(page: Page, token: string) {
  await page.evaluate((t) => localStorage.setItem('token', t), token);
}

// Helper to clear auth
export async function clearAuth(page: Page) {
  await page.evaluate(() => localStorage.removeItem('token'));
}

// Helper to wait for API response
export async function waitForAPI(page: Page, urlPattern: string | RegExp) {
  return page.waitForResponse(
    (response) =>
      (typeof urlPattern === 'string'
        ? response.url().includes(urlPattern)
        : urlPattern.test(response.url())) && response.status() === 200
  );
}

// Helper to mock API response
export async function mockAPIResponse(
  page: Page,
  urlPattern: string | RegExp,
  response: object,
  status = 200
) {
  await page.route(urlPattern, (route) => {
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
}

// Helper to take screenshot with timestamp
export async function takeScreenshot(page: Page, name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({ path: `screenshots/${name}-${timestamp}.png` });
}
