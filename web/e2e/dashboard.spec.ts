import { test, expect } from '@playwright/test';
import { mockAPIResponse } from './helpers/test-utils';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
      localStorage.setItem('token', 'mock-test-token');
    });

    // Mock user profile
    await mockAPIResponse(page, '**/api/auth/profile', {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      streak: 7,
      totalWordsLearned: 150,
      dailyGoal: 10,
      subscriptionTier: 'PREMIUM',
    });

    // Mock progress stats
    await mockAPIResponse(page, '**/api/progress', {
      totalWords: 150,
      masteredWords: 50,
      learningWords: 80,
      newWords: 20,
      averageAccuracy: 85,
    });

    // Mock due words
    await mockAPIResponse(page, '**/api/progress/due', [
      { id: '1', word: { word: 'test1' } },
      { id: '2', word: { word: 'test2' } },
      { id: '3', word: { word: 'test3' } },
      { id: '4', word: { word: 'test4' } },
      { id: '5', word: { word: 'test5' } },
    ]);

    // Mock achievements
    await mockAPIResponse(page, '**/api/achievements', [
      {
        id: 'achievement-1',
        name: '첫 단어',
        description: '첫 번째 단어를 학습했습니다',
        icon: '🎯',
        unlockedAt: new Date().toISOString(),
      },
      {
        id: 'achievement-2',
        name: '7일 연속',
        description: '7일 연속으로 학습했습니다',
        icon: '🔥',
        unlockedAt: new Date().toISOString(),
      },
    ]);

    // Mock notifications
    await mockAPIResponse(page, '**/api/notifications', []);
  });

  test.describe('Stats Display', () => {
    test('should display user greeting', async ({ page }) => {
      await page.goto('/dashboard');

      await expect(page.locator('text=Test User')).toBeVisible();
    });

    test('should display streak count', async ({ page }) => {
      await page.goto('/dashboard');

      await expect(page.locator('text=7일 연속')).toBeVisible();
    });

    test('should display total words learned', async ({ page }) => {
      await page.goto('/dashboard');

      await expect(page.locator('text=150')).toBeVisible();
    });

    test('should display due words count', async ({ page }) => {
      await page.goto('/dashboard');

      await expect(page.locator('text=5개의 단어')).toBeVisible();
    });

    test('should display accuracy rate', async ({ page }) => {
      await page.goto('/dashboard');

      await expect(page.locator('text=85%')).toBeVisible();
    });
  });

  test.describe('Navigation', () => {
    test('should navigate to learn page', async ({ page }) => {
      await page.goto('/dashboard');
      await page.click('text=학습 시작');

      await expect(page).toHaveURL(/learn/);
    });

    test('should navigate to bookmarks page', async ({ page }) => {
      await page.goto('/dashboard');
      await page.click('text=북마크');

      await expect(page).toHaveURL(/bookmarks/);
    });

    test('should navigate to achievements page', async ({ page }) => {
      await page.goto('/dashboard');
      await page.click('text=업적');

      await expect(page).toHaveURL(/achievements/);
    });

    test('should navigate to collections page', async ({ page }) => {
      await page.goto('/dashboard');
      await page.click('text=컬렉션');

      await expect(page).toHaveURL(/collections/);
    });

    test('should navigate to profile page', async ({ page }) => {
      await page.goto('/dashboard');
      await page.click('[data-testid="user-menu"]');
      await page.click('text=프로필');

      await expect(page).toHaveURL(/profile/);
    });
  });

  test.describe('Quick Actions', () => {
    test('should start review from dashboard', async ({ page }) => {
      await page.goto('/dashboard');
      await page.click('[data-testid="quick-review-button"]');

      await expect(page).toHaveURL(/learn\/review/);
    });

    test('should start new word learning from dashboard', async ({ page }) => {
      await page.goto('/dashboard');
      await page.click('[data-testid="quick-learn-button"]');

      await expect(page).toHaveURL(/learn\/new/);
    });
  });

  test.describe('Progress Charts', () => {
    test('should display weekly progress chart', async ({ page }) => {
      await mockAPIResponse(page, '**/api/progress/history*', {
        sessions: [
          { date: '2024-01-01', wordsReviewed: 15, correctAnswers: 12 },
          { date: '2024-01-02', wordsReviewed: 20, correctAnswers: 18 },
          { date: '2024-01-03', wordsReviewed: 10, correctAnswers: 9 },
        ],
      });

      await page.goto('/dashboard');

      await expect(page.locator('[data-testid="progress-chart"]')).toBeVisible();
    });
  });

  test.describe('Achievements Display', () => {
    test('should display recent achievements', async ({ page }) => {
      await page.goto('/dashboard');

      await expect(page.locator('text=첫 단어')).toBeVisible();
      await expect(page.locator('text=7일 연속')).toBeVisible();
    });
  });

  test.describe('Daily Goal', () => {
    test('should display daily goal progress', async ({ page }) => {
      await mockAPIResponse(page, '**/api/goals/daily', {
        targetWords: 10,
        completedWords: 7,
        targetMinutes: 30,
        completedMinutes: 20,
      });

      await page.goto('/dashboard');

      await expect(page.locator('text=7/10')).toBeVisible();
    });

    test('should show celebration when goal is completed', async ({ page }) => {
      await mockAPIResponse(page, '**/api/goals/daily', {
        targetWords: 10,
        completedWords: 10,
        targetMinutes: 30,
        completedMinutes: 35,
        goalAchieved: true,
      });

      await page.goto('/dashboard');

      await expect(page.locator('text=목표 달성')).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should display mobile menu on small screens', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/dashboard');

      await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
    });

    test('should hide sidebar on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/dashboard');

      await expect(page.locator('[data-testid="sidebar"]')).not.toBeVisible();
    });
  });
});
