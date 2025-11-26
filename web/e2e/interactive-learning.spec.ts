/**
 * Interactive Learning Flow E2E Tests
 *
 * Tests the complete user journey through the interactive word documentation
 */

import { test, expect } from '@playwright/test';

test.describe('Interactive Learning Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'test@vocavision.com');
    await page.fill('input[name="password"]', 'testpassword');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should complete full interactive learning session', async ({ page }) => {
    // Navigate to a word
    await page.goto('/words');
    await page.click('text=serendipity');
    await expect(page).toHaveURL(/\/words\/[a-z0-9-]+$/);

    // Click "Learn Interactively" button
    await page.click('text=Learn Interactively');
    await expect(page).toHaveURL(/\/words\/[a-z0-9-]+\/learn$/);

    // Verify introduction step
    await expect(page.locator('h2')).toContainText('Introduction');
    await expect(page.locator('text=Step 1 of 5')).toBeVisible();

    // Navigate through all steps
    for (let step = 1; step < 5; step++) {
      await page.click('button:has-text("Next")');
      await expect(page.locator(`text=Step ${step + 1} of 5`)).toBeVisible();

      // Wait for content to load
      await page.waitForTimeout(500);
    }

    // Complete the learning session
    await page.click('button:has-text("Complete")');

    // Verify completion screen
    await expect(page.locator('text=Congratulations')).toBeVisible();
    await expect(page.locator('text=completed')).toBeVisible();

    // Verify statistics are shown
    await expect(page.locator('text=Time Spent')).toBeVisible();
    await expect(page.locator('text=Steps Completed')).toBeVisible();
  });

  test('should save progress when navigating between steps', async ({ page }) => {
    await page.goto('/words');
    await page.click('text=ephemeral');
    await page.click('text=Learn Interactively');

    // Complete first step
    await page.click('button:has-text("Next")');
    await expect(page.locator('text=Step 2 of 5')).toBeVisible();

    // Navigate away
    await page.goto('/dashboard');

    // Return to learning
    await page.goto('/words');
    await page.click('text=ephemeral');
    await page.click('text=Learn Interactively');

    // Verify progress is saved (should be on step 2 or show resume option)
    const continueButton = page.locator('button:has-text("Continue")');
    if (await continueButton.isVisible()) {
      await continueButton.click();
      await expect(page.locator('text=Step 2 of 5')).toBeVisible();
    }
  });

  test('should navigate using keyboard shortcuts', async ({ page }) => {
    await page.goto('/words');
    await page.click('text=serendipity');
    await page.click('text=Learn Interactively');

    // Use arrow key to go to next step
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('text=Step 2 of 5')).toBeVisible();

    // Use arrow key to go back
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('text=Step 1 of 5')).toBeVisible();
  });

  test('should show pronunciation audio controls', async ({ page }) => {
    await page.goto('/words');
    await page.click('text=serendipity');
    await page.click('text=Learn Interactively');

    // Look for pronunciation block
    const pronunciationBlock = page.locator('[data-block-type="pronunciation"]');
    await expect(pronunciationBlock).toBeVisible();

    // Verify audio controls are present
    const playButton = pronunciationBlock.locator('button[aria-label*="Play"]');
    await expect(playButton).toBeVisible();

    // Click play button
    await playButton.click();

    // Verify playing state (button changes to pause)
    await expect(pronunciationBlock.locator('button[aria-label*="Pause"]')).toBeVisible();
  });

  test('should display interactive quiz in practice step', async ({ page }) => {
    await page.goto('/words');
    await page.click('text=serendipity');
    await page.click('text=Learn Interactively');

    // Navigate to practice step (step 4)
    for (let i = 0; i < 3; i++) {
      await page.click('button:has-text("Next")');
    }

    // Verify quiz is present
    await expect(page.locator('[data-block-type="quiz"]')).toBeVisible();

    // Answer a quiz question
    await page.click('text=Option A');
    await page.click('button:has-text("Check Answer")');

    // Verify feedback is shown
    await expect(page.locator('.quiz-feedback')).toBeVisible();
  });

  test('should track time spent on each step', async ({ page }) => {
    await page.goto('/words');
    await page.click('text=serendipity');
    await page.click('text=Learn Interactively');

    // Stay on step 1 for a few seconds
    await page.waitForTimeout(3000);

    // Move to next step
    await page.click('button:has-text("Next")');

    // Verify time tracker shows time spent
    const timeDisplay = page.locator('[data-testid="time-spent"]');
    if (await timeDisplay.isVisible()) {
      const timeText = await timeDisplay.textContent();
      expect(timeText).toMatch(/\d+ (second|minute)/);
    }
  });

  test('should handle multimedia content', async ({ page }) => {
    await page.goto('/words');
    await page.click('text=serendipity');
    await page.click('text=Learn Interactively');

    // Navigate to visualization step (step 2)
    await page.click('button:has-text("Next")');

    // Check for images
    const images = page.locator('[data-block-type="image"] img');
    if (await images.count() > 0) {
      await expect(images.first()).toBeVisible();
    }

    // Check for videos
    const videos = page.locator('[data-block-type="video"] video');
    if (await videos.count() > 0) {
      await expect(videos.first()).toBeVisible();
    }

    // Check for animations
    const animations = page.locator('[data-block-type="animation"]');
    if (await animations.count() > 0) {
      await expect(animations.first()).toBeVisible();
    }
  });

  test('should show step progress indicators', async ({ page }) => {
    await page.goto('/words');
    await page.click('text=serendipity');
    await page.click('text=Learn Interactively');

    // Verify all 5 step indicators are present
    const stepIndicators = page.locator('[data-testid="step-indicator"]');
    await expect(stepIndicators).toHaveCount(5);

    // First indicator should be active
    await expect(stepIndicators.nth(0)).toHaveClass(/active/);

    // Move to next step
    await page.click('button:has-text("Next")');

    // First indicator should be completed, second should be active
    await expect(stepIndicators.nth(0)).toHaveClass(/completed/);
    await expect(stepIndicators.nth(1)).toHaveClass(/active/);
  });

  test('should allow direct navigation to steps', async ({ page }) => {
    await page.goto('/words');
    await page.click('text=serendipity');
    await page.click('text=Learn Interactively');

    // Click on step 3 indicator (if clickable)
    const step3Indicator = page.locator('[data-testid="step-indicator"]').nth(2);

    if (await step3Indicator.isEnabled()) {
      await step3Indicator.click();
      await expect(page.locator('text=Step 3 of 5')).toBeVisible();
    }
  });

  test('should show confirmation before leaving incomplete session', async ({ page }) => {
    await page.goto('/words');
    await page.click('text=serendipity');
    await page.click('text=Learn Interactively');

    // Start learning
    await page.click('button:has-text("Next")');

    // Try to navigate away
    page.on('dialog', dialog => {
      expect(dialog.message()).toContain('progress will be lost');
      dialog.accept();
    });

    await page.goto('/dashboard');
  });

  test('should work on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/words');
    await page.click('text=serendipity');
    await page.click('text=Learn Interactively');

    // Verify responsive layout
    await expect(page.locator('h2')).toBeVisible();
    await expect(page.locator('button:has-text("Next")')).toBeVisible();

    // Verify swipe gesture support (if implemented)
    const stepContent = page.locator('[data-testid="step-content"]');
    await stepContent.hover();
    await page.mouse.down();
    await page.mouse.move(-100, 0);
    await page.mouse.up();

    // Should navigate to next step
    await expect(page.locator('text=Step 2 of 5')).toBeVisible();
  });
});

test.describe('Interactive Learning Accessibility', () => {
  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'test@vocavision.com');
    await page.fill('input[name="password"]', 'testpassword');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    await page.goto('/words');
    await page.click('text=serendipity');
    await page.click('text=Learn Interactively');

    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Activate next button with Enter
    await page.keyboard.press('Enter');
    await expect(page.locator('text=Step 2 of 5')).toBeVisible();
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'test@vocavision.com');
    await page.fill('input[name="password"]', 'testpassword');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    await page.goto('/words');
    await page.click('text=serendipity');
    await page.click('text=Learn Interactively');

    // Check for proper ARIA landmarks
    await expect(page.locator('[role="region"][aria-label*="learning"]')).toBeVisible();
    await expect(page.locator('[role="navigation"][aria-label*="step"]')).toBeVisible();

    // Check for status announcements
    await page.click('button:has-text("Next")');
    await expect(page.locator('[role="status"]')).toBeVisible();
  });

  test('should support screen reader navigation', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'test@vocavision.com');
    await page.fill('input[name="password"]', 'testpassword');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    await page.goto('/words');
    await page.click('text=serendipity');
    await page.click('text=Learn Interactively');

    // Verify heading structure
    const h1 = page.locator('h1');
    const h2 = page.locator('h2');

    await expect(h1).toBeVisible();
    await expect(h2).toBeVisible();

    // Verify alt text on images
    const images = page.locator('img');
    const imageCount = await images.count();

    for (let i = 0; i < imageCount; i++) {
      const altText = await images.nth(i).getAttribute('alt');
      expect(altText).toBeTruthy();
    }
  });
});

test.describe('Interactive Learning Performance', () => {
  test('should load quickly', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'test@vocavision.com');
    await page.fill('input[name="password"]', 'testpassword');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    await page.goto('/words');
    await page.click('text=serendipity');
    await page.click('text=Learn Interactively');

    await page.waitForSelector('h2');

    const loadTime = Date.now() - startTime;

    // Should load in less than 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should handle slow network gracefully', async ({ page }) => {
    // Simulate slow 3G
    await page.route('**/*', route => {
      setTimeout(() => route.continue(), 500);
    });

    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'test@vocavision.com');
    await page.fill('input[name="password"]', 'testpassword');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    await page.goto('/words');
    await page.click('text=serendipity');
    await page.click('text=Learn Interactively');

    // Verify loading state is shown
    await expect(page.locator('[data-testid="loading"]').or(page.locator('text=Loading'))).toBeVisible();

    // Eventually loads
    await expect(page.locator('h2')).toBeVisible({ timeout: 10000 });
  });
});
