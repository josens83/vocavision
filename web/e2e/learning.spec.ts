import { test, expect } from '@playwright/test';
import { mockAPIResponse } from './helpers/test-utils';

test.describe('Learning Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
      localStorage.setItem('token', 'mock-test-token');
    });

    // Mock user API
    await mockAPIResponse(page, '**/api/auth/profile', {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      streak: 5,
      totalWordsLearned: 100,
      dailyGoal: 10,
    });
  });

  test.describe('Learn Page', () => {
    test('should display learning options', async ({ page }) => {
      await mockAPIResponse(page, '**/api/progress/due', [
        {
          id: 'progress-1',
          word: {
            id: 'word-1',
            word: 'ephemeral',
            definition: 'lasting for a very short time',
            pronunciation: '/ɪˈfem(ə)rəl/',
          },
        },
      ]);

      await page.goto('/learn');

      await expect(page.locator('text=학습 시작')).toBeVisible();
      await expect(page.locator('text=복습하기')).toBeVisible();
    });

    test('should show due words count', async ({ page }) => {
      await mockAPIResponse(page, '**/api/progress/due', [
        { id: '1', word: { word: 'test1' } },
        { id: '2', word: { word: 'test2' } },
        { id: '3', word: { word: 'test3' } },
      ]);

      await page.goto('/learn');

      await expect(page.locator('text=3개의 단어')).toBeVisible();
    });
  });

  test.describe('Review Session', () => {
    test.beforeEach(async ({ page }) => {
      // Mock due words
      await mockAPIResponse(page, '**/api/progress/due', [
        {
          id: 'progress-1',
          word: {
            id: 'word-1',
            word: 'ephemeral',
            definition: 'lasting for a very short time',
            pronunciation: '/ɪˈfem(ə)rəl/',
            examples: ['The ephemeral beauty of cherry blossoms'],
          },
        },
        {
          id: 'progress-2',
          word: {
            id: 'word-2',
            word: 'ubiquitous',
            definition: 'present everywhere',
            pronunciation: '/juːˈbɪkwɪtəs/',
            examples: ['Smartphones have become ubiquitous'],
          },
        },
      ]);

      // Mock session start
      await mockAPIResponse(page, '**/api/progress/session/start', {
        id: 'session-1',
        startTime: new Date().toISOString(),
      });
    });

    test('should start a review session', async ({ page }) => {
      await page.goto('/learn');
      await page.click('text=복습하기');

      await expect(page.locator('[data-testid="flashcard"]')).toBeVisible({ timeout: 5000 });
    });

    test('should display word on flashcard', async ({ page }) => {
      await page.goto('/learn/review');

      await expect(page.locator('text=ephemeral')).toBeVisible({ timeout: 5000 });
    });

    test('should flip flashcard to show definition', async ({ page }) => {
      await page.goto('/learn/review');

      await page.click('[data-testid="flashcard"]');

      await expect(page.locator('text=lasting for a very short time')).toBeVisible();
    });

    test('should show correct/incorrect buttons after flip', async ({ page }) => {
      await page.goto('/learn/review');
      await page.click('[data-testid="flashcard"]');

      await expect(page.locator('[data-testid="correct-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="incorrect-button"]')).toBeVisible();
    });

    test('should navigate to next word after answer', async ({ page }) => {
      await mockAPIResponse(page, '**/api/progress/review', {
        masteryLevel: 3,
        nextReview: new Date().toISOString(),
      });

      await page.goto('/learn/review');
      await page.click('[data-testid="flashcard"]');
      await page.click('[data-testid="correct-button"]');

      await expect(page.locator('text=ubiquitous')).toBeVisible({ timeout: 5000 });
    });

    test('should show session summary after completion', async ({ page }) => {
      await mockAPIResponse(page, '**/api/progress/review', {
        masteryLevel: 3,
        nextReview: new Date().toISOString(),
      });

      await mockAPIResponse(page, '**/api/progress/session/end', {
        id: 'session-1',
        wordsReviewed: 2,
        correctAnswers: 2,
        duration: 120,
      });

      await page.goto('/learn/review');

      // Complete first word
      await page.click('[data-testid="flashcard"]');
      await page.click('[data-testid="correct-button"]');

      // Complete second word
      await page.click('[data-testid="flashcard"]');
      await page.click('[data-testid="correct-button"]');

      await expect(page.locator('text=세션 완료')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=2개 단어 복습')).toBeVisible();
    });
  });

  test.describe('New Words', () => {
    test('should display new words for learning', async ({ page }) => {
      await mockAPIResponse(page, '**/api/words/random', [
        {
          id: 'word-1',
          word: 'serendipity',
          definition: 'the occurrence of events by chance in a happy way',
          difficulty: 'ADVANCED',
        },
        {
          id: 'word-2',
          word: 'mellifluous',
          definition: 'sweet-sounding',
          difficulty: 'EXPERT',
        },
      ]);

      await page.goto('/learn');
      await page.click('text=새 단어 학습');

      await expect(page.locator('text=serendipity')).toBeVisible({ timeout: 5000 });
    });
  });
});
