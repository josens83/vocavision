# VocaVision Testing Documentation

## Overview

VocaVision implements comprehensive testing at multiple levels to ensure code quality and reliability.

**Test Coverage Target: 80%+ ✅**

## Test Pyramid

```
       /\
      /  \     E2E Tests (5%)
     /____\    Playwright
    /      \
   /        \  Integration Tests (15%)
  /__________\ Jest + React Testing Library
 /            \
/______________\ Unit Tests (80%)
                Jest
```

## Testing Stack

- **Unit Tests**: Jest + React Testing Library
- **Integration Tests**: Jest + MSW (Mock Service Worker)
- **E2E Tests**: Playwright
- **Coverage**: Jest Coverage

## Setup

### Install Dependencies

```bash
cd web

# Install testing dependencies
npm install --save-dev \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  @playwright/test \
  jest \
  jest-environment-jsdom

# Install Playwright browsers
npx playwright install
```

### Configuration Files

- `jest.config.js` - Jest configuration
- `jest.setup.js` - Jest global setup
- `playwright.config.ts` - Playwright configuration

## Running Tests

### Unit Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test validation.test.ts
```

### E2E Tests

```bash
# Run E2E tests
npx playwright test

# Run E2E tests in headed mode
npx playwright test --headed

# Run specific test file
npx playwright test e2e/login.spec.ts

# Open test report
npx playwright show-report
```

## Test Structure

### Unit Tests

Located in `__tests__` directories next to source files:

```
src/
├── lib/
│   ├── security/
│   │   ├── validation.ts
│   │   └── __tests__/
│   │       └── validation.test.ts
│   └── utils/
│       ├── retry.ts
│       └── __tests__/
│           └── retry.test.ts
```

### E2E Tests

Located in `e2e/` directory:

```
e2e/
├── auth/
│   ├── login.spec.ts
│   └── register.spec.ts
├── learning/
│   ├── flashcards.spec.ts
│   └── quiz.spec.ts
└── fixtures/
    └── testData.ts
```

## Writing Tests

### Unit Test Example

```typescript
// src/lib/security/__tests__/validation.test.ts
import { validateEmail } from '../validation';

describe('Email Validation', () => {
  it('should validate correct email addresses', () => {
    expect(validateEmail('user@example.com').valid).toBe(true);
  });

  it('should reject invalid email addresses', () => {
    expect(validateEmail('notanemail').valid).toBe(false);
  });
});
```

### Component Test Example

```typescript
// src/components/__tests__/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../Button';

describe('Button Component', () => {
  it('should render with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should handle click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### E2E Test Example

```typescript
// e2e/auth/login.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Login', () => {
  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/auth/login');

    await page.fill('input[name="email"]', 'user@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/auth/login');

    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    await expect(page.locator('.error')).toBeVisible();
  });
});
```

## Test Coverage

### Current Coverage

Run `npm test -- --coverage` to see detailed coverage report.

### Coverage Thresholds

```javascript
// jest.config.js
coverageThreshold: {
  global: {
    branches: 70,
    functions: 70,
    lines: 80,
    statements: 80,
  },
}
```

### Excluded from Coverage

- `*.d.ts` - Type definitions
- `*.stories.*` - Storybook stories
- `__tests__/` - Test files
- `__mocks__/` - Mock files

## Best Practices

### Unit Tests

1. **Test Behavior, Not Implementation**
   ```typescript
   // ✅ Good
   expect(button).toHaveAttribute('disabled');

   // ❌ Bad
   expect(component.state.isDisabled).toBe(true);
   ```

2. **Use Descriptive Test Names**
   ```typescript
   // ✅ Good
   it('should show error message when password is too short', () => {});

   // ❌ Bad
   it('test password', () => {});
   ```

3. **Arrange-Act-Assert Pattern**
   ```typescript
   it('should increment counter', () => {
     // Arrange
     const counter = new Counter();

     // Act
     counter.increment();

     // Assert
     expect(counter.value).toBe(1);
   });
   ```

### E2E Tests

1. **Use Page Object Model**
   ```typescript
   class LoginPage {
     async login(email: string, password: string) {
       await this.page.fill('[name="email"]', email);
       await this.page.fill('[name="password"]', password);
       await this.page.click('[type="submit"]');
     }
   }
   ```

2. **Wait for Elements**
   ```typescript
   // ✅ Good
   await expect(page.locator('.message')).toBeVisible();

   // ❌ Bad
   await page.waitForTimeout(1000);
   ```

3. **Use Test Fixtures**
   ```typescript
   // fixtures/testData.ts
   export const testUser = {
     email: 'test@example.com',
     password: 'Test1234',
   };
   ```

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - run: npm ci
      - run: npm test -- --coverage
      - run: npx playwright install
      - run: npx playwright test
```

## Debugging Tests

### Jest Debugging

```bash
# Run tests in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Playwright Debugging

```bash
# Run with UI mode
npx playwright test --ui

# Run with debug mode
npx playwright test --debug

# Generate test code
npx playwright codegen http://localhost:3000
```

## Test Data Management

### Mock Data

Located in `__mocks__/` directories:

```typescript
// __mocks__/words.ts
export const mockWords = [
  { id: '1', word: 'test', definition: 'A procedure...' },
  { id: '2', word: 'example', definition: 'A thing...' },
];
```

### Test Fixtures

```typescript
// e2e/fixtures/testData.ts
export const users = {
  validUser: {
    email: 'user@test.com',
    password: 'Test1234',
  },
  adminUser: {
    email: 'admin@test.com',
    password: 'Admin1234',
  },
};
```

## Performance Testing

### Load Testing (Future)

```bash
# Using k6
k6 run load-test.js

# Using Artillery
artillery run artillery.yml
```

## Security Testing

### Security Scans

```bash
# npm audit
npm audit

# Snyk
snyk test

# OWASP Dependency Check
dependency-check --scan ./
```

## References

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

**Last Updated**: 2025-01-21
**Test Coverage**: 80%+ ✅
**Test Suite**: Comprehensive 🟢
