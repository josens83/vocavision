# VocaVision Developer Guide

**Version:** 1.0.0
**Last Updated:** 2024-01-21

Welcome to the VocaVision Developer Guide! This comprehensive guide will help you get started with VocaVision development, understand the architecture, and contribute to the project.

---

## Table of Contents

- [Getting Started](#getting-started)
- [Architecture Overview](#architecture-overview)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Key Concepts](#key-concepts)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Code Style Guide](#code-style-guide)
- [Troubleshooting](#troubleshooting)
- [Resources](#resources)

---

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v18.x or higher
- **npm**: v9.x or higher
- **Git**: v2.x or higher
- **Docker**: v24.x or higher (optional, for containerized development)
- **PostgreSQL**: v15.x or higher (or use Docker)
- **Redis**: v7.x or higher (or use Docker)

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/josens83/vocavision.git
cd vocavision

# 2. Install dependencies
cd web
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# 4. Run database migrations (when backend is ready)
# npm run db:migrate

# 5. Start development server
npm run dev

# 6. Open browser
# Navigate to http://localhost:3000
```

### First Steps

1. **Explore the codebase**: Start with `web/src/app/page.tsx`
2. **Run tests**: `npm run test`
3. **Read the documentation**: Check out `ARCHITECTURE.md` and `API_REFERENCE.md`
4. **Join the community**: [Developer Forum](https://forum.vocavision.com)

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User Browser                          │
├─────────────────────────────────────────────────────────────┤
│  Next.js 14 (App Router) + React 18 + TypeScript           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   UI Layer   │  │ State Mgmt   │  │  API Client  │     │
│  │ (Components) │  │   (Hooks)    │  │   (Fetch)    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTPS
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    API Gateway (Vercel)                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │   Rate Limiting │ Authentication │ CORS │ Security   │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │
┌────────────────────────▼────────────────────────────────────┐
│                     Backend Services                         │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  │
│  │  API Server   │  │  Auth Service │  │ Learning AI   │  │
│  │  (Node.js)    │  │     (JWT)     │  │  (ML Model)   │  │
│  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘  │
│          │                  │                  │            │
└──────────┼──────────────────┼──────────────────┼───────────┘
           │                  │                  │
           ▼                  ▼                  ▼
┌──────────────────────────────────────────────────────────┐
│                     Data Layer                            │
│  ┌───────────────┐  ┌───────────────┐  ┌─────────────┐  │
│  │  PostgreSQL   │  │     Redis     │  │  S3/CDN     │  │
│  │  (Primary DB) │  │    (Cache)    │  │  (Assets)   │  │
│  └───────────────┘  └───────────────┘  └─────────────┘  │
└──────────────────────────────────────────────────────────┘
```

### Technology Stack

#### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 18
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS
- **State Management**: React Hooks + Context API
- **Data Fetching**: SWR (Stale-While-Revalidate)
- **Form Handling**: React Hook Form + Zod
- **Animation**: Framer Motion
- **Charts**: Recharts
- **Icons**: Lucide React

#### Backend (Planned)
- **Runtime**: Node.js 18
- **Framework**: Express.js / Fastify
- **Language**: TypeScript 5
- **Database ORM**: Prisma
- **Authentication**: JWT + Passport.js
- **API Documentation**: OpenAPI 3.0 / Swagger
- **Background Jobs**: Bull / BullMQ
- **Real-time**: Socket.io

#### Database & Storage
- **Primary Database**: PostgreSQL 15
- **Cache**: Redis 7
- **File Storage**: AWS S3 / Vercel Blob
- **CDN**: Vercel Edge Network

#### DevOps & Tools
- **CI/CD**: GitHub Actions
- **Containerization**: Docker
- **Hosting**: Vercel (Frontend), AWS/Railway (Backend)
- **Monitoring**: Sentry, Google Analytics 4
- **Testing**: Jest, Playwright
- **Linting**: ESLint, Prettier
- **Version Control**: Git, GitHub

### Design Patterns

#### 1. **Layered Architecture**
```
┌─────────────────────────────┐
│     Presentation Layer      │  React Components
├─────────────────────────────┤
│      Business Logic Layer   │  Hooks, Services
├─────────────────────────────┤
│      Data Access Layer      │  API Client, Cache
├─────────────────────────────┤
│      Infrastructure Layer   │  Database, External APIs
└─────────────────────────────┘
```

#### 2. **Component-Driven Development**
- Atomic Design: Atoms → Molecules → Organisms → Templates → Pages
- Reusable, composable components
- Storybook for component documentation (planned)

#### 3. **API Design**
- RESTful API with resource-based endpoints
- JSON:API specification
- Hypermedia controls (HATEOAS)
- Versioning: URL-based (`/api/v1`)

#### 4. **Error Handling**
- Error Boundaries at multiple levels
- Circuit Breaker pattern for external services
- Retry logic with exponential backoff
- Graceful degradation

#### 5. **Security**
- Defense in depth
- OWASP Top 10 mitigation
- Input validation and sanitization
- Rate limiting (Token Bucket + Sliding Window)
- CSRF protection
- Secure headers (CSP, HSTS, etc.)

---

## Development Setup

### Environment Variables

Create a `.env.local` file in the `web/` directory:

```bash
# App Configuration
NEXT_PUBLIC_APP_NAME=VocaVision
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1

# Authentication
NEXTAUTH_SECRET=your-super-secret-key-change-this-in-production
NEXTAUTH_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/vocavision

# Redis
REDIS_URL=redis://localhost:6379

# AWS S3 (Optional)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=vocavision-assets

# Sentry (Error Tracking)
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
SENTRY_AUTH_TOKEN=your-sentry-auth-token

# Google Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# External APIs
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_OFFLINE=true
```

### Database Setup

#### Using Docker

```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Check if services are running
docker-compose ps

# Connect to PostgreSQL
docker exec -it vocavision_postgres psql -U vocavision
```

#### Manual Setup

```bash
# Create database
createdb vocavision

# Run migrations (when backend is ready)
npm run db:migrate

# Seed database with sample data
npm run db:seed
```

### IDE Setup

#### VS Code

Recommended extensions:

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-playwright.playwright",
    "prisma.prisma",
    "ms-azuretools.vscode-docker"
  ]
}
```

Settings (`.vscode/settings.json`):

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "tailwindCSS.experimental.classRegex": [
    ["cn\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ]
}
```

#### WebStorm / IntelliJ IDEA

1. Enable ESLint: Settings → Languages & Frameworks → JavaScript → Code Quality Tools → ESLint
2. Enable Prettier: Settings → Languages & Frameworks → JavaScript → Prettier
3. Enable Tailwind CSS IntelliSense

---

## Project Structure

```
vocavision/
├── .github/                    # GitHub configuration
│   ├── workflows/              # GitHub Actions workflows
│   │   ├── ci.yml              # Continuous Integration
│   │   ├── cd.yml              # Continuous Deployment
│   │   └── security.yml        # Security scanning
│   └── dependabot.yml          # Dependency updates
├── web/                        # Frontend application
│   ├── public/                 # Static assets
│   │   ├── images/             # Image assets
│   │   ├── fonts/              # Font files
│   │   └── service-worker.js  # Service worker for offline support
│   ├── src/                    # Source code
│   │   ├── app/                # Next.js App Router pages
│   │   │   ├── layout.tsx      # Root layout
│   │   │   ├── page.tsx        # Home page
│   │   │   ├── auth/           # Authentication pages
│   │   │   ├── dashboard/      # Dashboard pages
│   │   │   ├── words/          # Word pages
│   │   │   ├── learn/          # Learning pages
│   │   │   ├── quiz/           # Quiz pages
│   │   │   ├── statistics/     # Statistics pages
│   │   │   └── settings/       # Settings pages
│   │   ├── components/         # React components
│   │   │   ├── ui/             # UI components (atoms)
│   │   │   ├── layout/         # Layout components
│   │   │   ├── dashboard/      # Dashboard components
│   │   │   ├── learning/       # Learning components
│   │   │   ├── errors/         # Error boundaries
│   │   │   └── fallbacks/      # Fallback components
│   │   ├── lib/                # Utility libraries
│   │   │   ├── utils/          # General utilities
│   │   │   │   ├── retry.ts    # Retry logic
│   │   │   │   ├── circuitBreaker.ts  # Circuit breaker
│   │   │   │   ├── indexedDB.ts       # IndexedDB wrapper
│   │   │   │   └── performance.ts     # Performance monitoring
│   │   │   ├── security/       # Security utilities
│   │   │   │   ├── validation.ts      # Input validation
│   │   │   │   ├── rateLimiter.ts     # Rate limiting
│   │   │   │   └── csrf.ts            # CSRF protection
│   │   │   └── monitoring/     # Monitoring utilities
│   │   │       ├── sentry.ts   # Sentry integration
│   │   │       ├── analytics.ts       # Google Analytics
│   │   │       └── apm.ts             # APM
│   │   ├── hooks/              # Custom React hooks
│   │   │   ├── useSWR.ts       # SWR caching hook
│   │   │   ├── useAuth.ts      # Authentication hook
│   │   │   └── useWords.ts     # Words data hook
│   │   ├── types/              # TypeScript type definitions
│   │   │   ├── api.ts          # API types
│   │   │   ├── models.ts       # Data models
│   │   │   └── global.d.ts     # Global types
│   │   └── styles/             # Global styles
│   │       └── globals.css     # Tailwind CSS imports
│   ├── __tests__/              # Test files
│   │   ├── unit/               # Unit tests
│   │   ├── integration/        # Integration tests
│   │   └── e2e/                # End-to-end tests
│   ├── .eslintrc.js            # ESLint configuration
│   ├── .prettierrc             # Prettier configuration
│   ├── next.config.js          # Next.js configuration
│   ├── tailwind.config.ts      # Tailwind CSS configuration
│   ├── tsconfig.json           # TypeScript configuration
│   ├── jest.config.js          # Jest configuration
│   ├── jest.setup.js           # Jest setup
│   ├── playwright.config.ts    # Playwright configuration
│   ├── Dockerfile              # Docker configuration
│   └── package.json            # Dependencies
├── docs/                       # Documentation
│   ├── api/                    # API documentation
│   ├── architecture/           # Architecture diagrams
│   └── guides/                 # User guides
├── scripts/                    # Utility scripts
│   ├── setup.sh                # Setup script
│   └── deploy.sh               # Deployment script
├── docker-compose.yml          # Docker Compose configuration
├── API_REFERENCE.md            # API documentation
├── ARCHITECTURE.md             # Architecture documentation
├── DEVELOPER_GUIDE.md          # This file
├── CONTRIBUTING.md             # Contributing guidelines
├── CI_CD.md                    # CI/CD documentation
├── SECURITY.md                 # Security documentation
├── TESTING.md                  # Testing documentation
└── README.md                   # Project overview
```

### Directory Conventions

- **`/app`**: Next.js pages using App Router
- **`/components`**: Reusable React components
- **`/lib`**: Utility functions and libraries
- **`/hooks`**: Custom React hooks
- **`/types`**: TypeScript type definitions
- **`/__tests__`**: Test files (colocated with source when appropriate)

### File Naming Conventions

- **Components**: PascalCase (e.g., `WordCard.tsx`)
- **Utilities**: camelCase (e.g., `formatDate.ts`)
- **Hooks**: camelCase starting with `use` (e.g., `useAuth.ts`)
- **Types**: PascalCase (e.g., `UserTypes.ts`)
- **Tests**: `*.test.ts` or `*.spec.ts`
- **Page Routes**: lowercase with hyphens (e.g., `word-details/page.tsx`)

---

## Key Concepts

### 1. Spaced Repetition

VocaVision uses the **SM-2 algorithm** for spaced repetition:

```typescript
// Spaced repetition calculation
function calculateNextReview(
  quality: number, // 0-5 (user response quality)
  repetitions: number,
  easeFactor: number,
  interval: number
): { nextInterval: number; newEaseFactor: number } {
  // SM-2 algorithm implementation
  let newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  if (newEaseFactor < 1.3) {
    newEaseFactor = 1.3;
  }

  let newInterval: number;

  if (quality < 3) {
    newInterval = 1;
    repetitions = 0;
  } else {
    if (repetitions === 0) {
      newInterval = 1;
    } else if (repetitions === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * newEaseFactor);
    }
  }

  return {
    nextInterval: newInterval,
    newEaseFactor: newEaseFactor,
  };
}
```

### 2. Gamification System

#### XP (Experience Points)

```typescript
// XP calculation
const XP_REWARDS = {
  WORD_LEARNED: 10,
  WORD_REVIEWED: 5,
  QUIZ_COMPLETED: 50,
  PERFECT_QUIZ: 100,
  DAILY_GOAL: 20,
  STREAK_MILESTONE: (days: number) => days * 5,
};

// Level calculation
function calculateLevel(totalXP: number): number {
  // Level = √(XP / 100)
  return Math.floor(Math.sqrt(totalXP / 100));
}

function xpRequiredForNextLevel(currentLevel: number): number {
  // XP needed = 100 * (level + 1)²
  return 100 * Math.pow(currentLevel + 1, 2);
}
```

#### Achievements

```typescript
interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'learning' | 'social' | 'streak' | 'quiz' | 'milestone';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  condition: (user: User) => boolean;
  rewards: {
    xp: number;
    badge?: string;
  };
}

// Example achievement
const FIRST_WORD_ACHIEVEMENT: Achievement = {
  id: 'first_word',
  name: 'First Steps',
  description: 'Learn your first word',
  icon: '/badges/first_word.svg',
  category: 'learning',
  rarity: 'common',
  condition: (user) => user.stats.wordsLearned >= 1,
  rewards: {
    xp: 10,
    badge: 'First Steps Badge',
  },
};
```

### 3. Offline Support

VocaVision supports offline mode using:

- **Service Worker**: Caches assets and API responses
- **IndexedDB**: Stores vocabulary data locally
- **Background Sync**: Syncs data when connection is restored

```typescript
// Service Worker registration
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js').then((registration) => {
    console.log('Service Worker registered:', registration);
  });
}

// IndexedDB usage
import { get, set } from '@/lib/utils/indexedDB';

// Store word data
await set('words', wordData);

// Retrieve word data
const words = await get<Word[]>('words', 'all');
```

### 4. Error Handling

#### Error Boundaries

```tsx
// Root Error Boundary
import { RootErrorBoundary } from '@/components/errors/ErrorBoundary';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <RootErrorBoundary>{children}</RootErrorBoundary>
      </body>
    </html>
  );
}
```

#### Circuit Breaker

```typescript
import { CircuitBreaker } from '@/lib/utils/circuitBreaker';

const apiCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeout: 60000, // 1 minute
});

async function fetchWithCircuitBreaker<T>(url: string): Promise<T> {
  return apiCircuitBreaker.execute(
    () => fetch(url).then((res) => res.json()),
    () => {
      // Fallback response
      return getCachedData(url);
    }
  );
}
```

### 5. Performance Optimization

#### Code Splitting

```tsx
import dynamic from 'next/dynamic';

// Dynamic import with loading state
const HeavyComponent = dynamic(() => import('@/components/HeavyComponent'), {
  loading: () => <Skeleton />,
  ssr: false, // Disable SSR for this component
});
```

#### Image Optimization

```tsx
import { OptimizedImage } from '@/components/ui/OptimizedImage';

<OptimizedImage
  src="/images/vocabulary.jpg"
  alt="Vocabulary"
  width={800}
  height={600}
  priority={false} // Lazy load
  quality={75} // Image quality
/>;
```

---

## Development Workflow

### 1. Feature Development

```bash
# 1. Create feature branch
git checkout -b feature/new-learning-mode

# 2. Make changes and commit
git add .
git commit -m "feat(learning): add new spaced repetition mode"

# 3. Run tests
npm run test

# 4. Run linter
npm run lint

# 5. Push branch
git push origin feature/new-learning-mode

# 6. Create Pull Request on GitHub

# 7. Wait for CI checks to pass

# 8. Request code review

# 9. Merge to develop branch
```

### 2. Bug Fix Workflow

```bash
# 1. Create bugfix branch
git checkout -b bugfix/fix-quiz-scoring

# 2. Fix the bug
# Write tests to reproduce the bug first (TDD)

# 3. Commit with descriptive message
git commit -m "fix(quiz): correct scoring calculation for bonus points"

# 4. Push and create PR
git push origin bugfix/fix-quiz-scoring
```

### 3. Hotfix Workflow

```bash
# 1. Create hotfix branch from main
git checkout main
git checkout -b hotfix/critical-security-fix

# 2. Fix the issue
git commit -m "fix(security): patch XSS vulnerability in user input"

# 3. Merge to both main and develop
git checkout main
git merge hotfix/critical-security-fix
git push origin main

git checkout develop
git merge hotfix/critical-security-fix
git push origin develop
```

### 4. Daily Development

```bash
# Morning: Update your local branch
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/my-feature

# Development cycle
npm run dev              # Start dev server
npm run test:watch       # Run tests in watch mode

# Before committing
npm run lint             # Check linting
npm run type-check       # Check TypeScript
npm run test             # Run all tests

# Commit
git add .
git commit -m "feat: add new feature"
```

---

## Testing

### Unit Testing

```typescript
// Example: Testing a utility function
import { calculateLevel } from '@/lib/utils/gamification';

describe('calculateLevel', () => {
  it('should return level 1 for 100 XP', () => {
    expect(calculateLevel(100)).toBe(1);
  });

  it('should return level 10 for 10,000 XP', () => {
    expect(calculateLevel(10000)).toBe(10);
  });

  it('should return level 0 for 0 XP', () => {
    expect(calculateLevel(0)).toBe(0);
  });
});
```

### Component Testing

```tsx
// Example: Testing a React component
import { render, screen, fireEvent } from '@testing-library/react';
import { WordCard } from '@/components/learning/WordCard';

describe('WordCard', () => {
  const mockWord = {
    id: 'word_1',
    word: 'serendipity',
    definition: 'A happy accident',
    pronunciation: '/ˌserənˈdipədē/',
  };

  it('should render word and definition', () => {
    render(<WordCard word={mockWord} />);

    expect(screen.getByText('serendipity')).toBeInTheDocument();
    expect(screen.getByText('A happy accident')).toBeInTheDocument();
  });

  it('should call onFlip when card is clicked', () => {
    const onFlip = jest.fn();
    render(<WordCard word={mockWord} onFlip={onFlip} />);

    fireEvent.click(screen.getByRole('button'));

    expect(onFlip).toHaveBeenCalledTimes(1);
  });
});
```

### Integration Testing

```typescript
// Example: Testing API integration
import { GET } from '@/app/api/words/route';

describe('GET /api/words', () => {
  it('should return paginated words', async () => {
    const request = new Request('http://localhost:3000/api/words?page=1&limit=20');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toBeInstanceOf(Array);
    expect(data.pagination).toHaveProperty('page', 1);
    expect(data.pagination).toHaveProperty('limit', 20);
  });
});
```

### E2E Testing

```typescript
// Example: Playwright E2E test
import { test, expect } from '@playwright/test';

test.describe('Learning Flow', () => {
  test('should complete a flashcard session', async ({ page }) => {
    // Navigate to learning page
    await page.goto('http://localhost:3000/learn');

    // Start session
    await page.click('button:has-text("Start Learning")');

    // Answer 5 flashcards
    for (let i = 0; i < 5; i++) {
      await page.click('[data-testid="reveal-answer"]');
      await page.click('[data-testid="mark-correct"]');
    }

    // Check completion
    await expect(page.locator('[data-testid="session-complete"]')).toBeVisible();

    // Verify XP earned
    const xpText = await page.locator('[data-testid="xp-earned"]').textContent();
    expect(xpText).toContain('50 XP');
  });
});
```

### Running Tests

```bash
# Unit tests
npm run test                # Run once
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage

# E2E tests
npm run test:e2e            # Headless
npm run test:e2e:headed     # With browser
npm run test:e2e:debug      # Debug mode

# All tests
npm run test:all
```

---

## Deployment

### Development Deployment

```bash
# Deploy to Vercel preview
git push origin feature/my-feature
# Vercel will automatically create a preview deployment
```

### Staging Deployment

```bash
# Push to develop branch
git checkout develop
git merge feature/my-feature
git push origin develop
# Automatically deploys to staging environment
```

### Production Deployment

```bash
# Option 1: Push to main
git checkout main
git merge develop
git push origin main

# Option 2: Create release tag
git tag -a v1.2.0 -m "Release v1.2.0"
git push origin v1.2.0
```

### Manual Deployment

```bash
# Build production
npm run build

# Start production server
npm run start

# Or deploy with Docker
docker build -t vocavision:latest .
docker run -p 3000:3000 vocavision:latest
```

---

## Contributing

### Contribution Process

1. **Find an issue** or create a new one
2. **Fork the repository**
3. **Create a branch**: `git checkout -b feature/my-feature`
4. **Make changes** and write tests
5. **Commit**: Follow commit message conventions
6. **Push**: `git push origin feature/my-feature`
7. **Create Pull Request** with detailed description
8. **Code Review**: Address feedback
9. **Merge**: Maintainer will merge when approved

### Commit Message Convention

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, no logic change)
- `refactor`: Code refactoring
- `perf`: Performance improvement
- `test`: Adding or updating tests
- `chore`: Build process or tooling changes
- `ci`: CI/CD changes

**Examples:**

```bash
feat(learning): add spaced repetition algorithm

Implement SM-2 algorithm for optimal review scheduling.
Includes unit tests and documentation.

Closes #123

fix(quiz): correct scoring calculation

Fix bug where bonus points were not added correctly
for quick answers.

Fixes #456

docs(api): add authentication examples

Add code examples for JWT authentication flow
in multiple programming languages.
```

### Pull Request Guidelines

#### PR Title

```
feat(learning): add new flashcard mode
fix(security): patch XSS vulnerability
docs(api): update authentication guide
```

#### PR Description Template

```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed

## Screenshots (if applicable)
[Add screenshots here]

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests pass locally
- [ ] Dependent changes merged

## Related Issues
Closes #123
Related to #456
```

### Code Review Process

#### Reviewer Checklist

- [ ] Code is readable and maintainable
- [ ] Logic is correct and efficient
- [ ] Tests are comprehensive
- [ ] No security vulnerabilities
- [ ] Performance impact acceptable
- [ ] Documentation is clear
- [ ] Follows project conventions

#### Review Comments

Use conventional comment prefixes:

- **MUST**: Required change
- **SHOULD**: Recommended change
- **NITS**: Minor suggestion
- **QUESTION**: Need clarification

Example:
```
MUST: Add input validation for email field
SHOULD: Consider extracting this logic into a separate function
NITS: Missing comma at end of line
QUESTION: Why is this setTimeout necessary?
```

---

## Code Style Guide

### TypeScript

```typescript
// ✅ Good
interface User {
  id: string;
  name: string;
  email: string;
}

function getUserById(id: string): Promise<User | null> {
  return fetchUser(id);
}

// ❌ Bad
interface user {
  id: any;
  Name: string;
}

function GetUser(id) {
  return fetchUser(id);
}
```

### React Components

```tsx
// ✅ Good
interface WordCardProps {
  word: Word;
  onFlip?: () => void;
  className?: string;
}

export function WordCard({ word, onFlip, className }: WordCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    onFlip?.();
  };

  return (
    <div className={cn('word-card', className)} onClick={handleFlip}>
      {isFlipped ? word.definition : word.word}
    </div>
  );
}

// ❌ Bad
export function WordCard(props: any) {
  return <div>{props.word.word}</div>;
}
```

### Hooks

```typescript
// ✅ Good
function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser().then(setUser).finally(() => setLoading(false));
  }, []);

  return { user, loading };
}

// ❌ Bad
function Auth() {
  const user = useState(null);
  return user;
}
```

### Imports

```typescript
// ✅ Good - Organized imports
import { useState, useEffect } from 'react';
import type { User, Word } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

// ❌ Bad - Unorganized
import { Button } from '@/components/ui/Button';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { User, Word } from '@/types';
```

### Naming Conventions

```typescript
// ✅ Good
const MAX_RETRIES = 3; // Constants: UPPER_SNAKE_CASE
const apiClient = new APIClient(); // Variables: camelCase
function calculateScore() {} // Functions: camelCase
interface UserProfile {} // Interfaces: PascalCase
type ResponseData = {}; // Types: PascalCase
enum UserRole {} // Enums: PascalCase
class UserService {} // Classes: PascalCase

// ❌ Bad
const max_retries = 3;
const APIClient = new APIClient();
function CalculateScore() {}
interface userProfile {}
```

---

## Troubleshooting

### Common Issues

#### 1. Port Already in Use

```bash
# Error: Port 3000 is already in use

# Solution 1: Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Solution 2: Use different port
PORT=3001 npm run dev
```

#### 2. Module Not Found

```bash
# Error: Cannot find module '@/components/...'

# Solution: Check tsconfig.json paths
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}

# Restart TypeScript server in IDE
```

#### 3. Build Failures

```bash
# Error: Build failed

# Solution 1: Clear cache
rm -rf .next
npm run build

# Solution 2: Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Solution 3: Check for TypeScript errors
npm run type-check
```

#### 4. Test Failures

```bash
# Error: Tests failing

# Solution 1: Update snapshots
npm run test -- -u

# Solution 2: Clear Jest cache
npm run test -- --clearCache

# Solution 3: Run specific test
npm run test -- path/to/test.spec.ts
```

### Performance Issues

#### Slow Development Server

```bash
# Check Node.js version
node --version  # Should be v18+

# Increase Node.js memory
NODE_OPTIONS="--max-old-space-size=4096" npm run dev

# Disable source maps in development (faster but harder to debug)
# next.config.js
{
  productionBrowserSourceMaps: false,
}
```

#### Slow Tests

```bash
# Run tests in parallel
npm run test -- --maxWorkers=4

# Run only changed tests
npm run test -- --onlyChanged

# Skip E2E tests during development
npm run test -- --testPathIgnorePatterns=e2e
```

---

## Resources

### Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Playwright Documentation](https://playwright.dev/docs/intro)

### Learning Resources

- [Next.js Learn](https://nextjs.org/learn) - Interactive Next.js tutorial
- [React Patterns](https://reactpatterns.com/) - Common React patterns
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/) - Comprehensive TypeScript guide
- [Web.dev](https://web.dev/) - Web performance and best practices

### Community

- [VocaVision Discord](https://discord.gg/vocavision) - Community chat
- [Developer Forum](https://forum.vocavision.com) - Discussion forum
- [GitHub Discussions](https://github.com/josens83/vocavision/discussions) - Q&A and ideas
- [Stack Overflow](https://stackoverflow.com/questions/tagged/vocavision) - Technical questions

### Tools

- [VS Code](https://code.visualstudio.com/) - Recommended IDE
- [GitHub Desktop](https://desktop.github.com/) - Git GUI client
- [Postman](https://www.postman.com/) - API testing
- [Figma](https://www.figma.com/) - Design collaboration

---

## FAQ

### Q: How do I add a new feature?

A: Follow the Feature Development workflow in the [Development Workflow](#development-workflow) section.

### Q: How do I report a bug?

A: Create an issue on GitHub with reproduction steps, expected behavior, and actual behavior.

### Q: How do I request a feature?

A: Open a GitHub Discussion or create a feature request issue.

### Q: Can I contribute without coding?

A: Yes! We welcome documentation improvements, design suggestions, bug reports, and community support.

### Q: How do I become a maintainer?

A: Consistent high-quality contributions and active community involvement. We'll reach out when we see dedication!

---

## Support

### Getting Help

1. **Check Documentation**: README, DEVELOPER_GUIDE, API_REFERENCE
2. **Search Issues**: [GitHub Issues](https://github.com/josens83/vocavision/issues)
3. **Community Forum**: [forum.vocavision.com](https://forum.vocavision.com)
4. **Discord**: [discord.gg/vocavision](https://discord.gg/vocavision)
5. **Email**: dev@vocavision.com

### Reporting Security Issues

**DO NOT** create public GitHub issues for security vulnerabilities.

Email: security@vocavision.com

---

**Happy Coding! 🚀**

We're excited to have you contribute to VocaVision. If you have any questions or need help, don't hesitate to reach out to the community!

---

**Last Updated:** 2024-01-21
**Version:** 1.0.0
**Maintained By:** VocaVision Development Team
