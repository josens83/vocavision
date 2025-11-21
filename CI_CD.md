# CI/CD Pipeline Documentation

## Overview

VocaVision uses a comprehensive CI/CD pipeline powered by GitHub Actions to ensure code quality, security, and reliable deployments.

## Table of Contents

- [CI/CD Architecture](#cicd-architecture)
- [Continuous Integration (CI)](#continuous-integration-ci)
- [Continuous Deployment (CD)](#continuous-deployment-cd)
- [Security Scanning](#security-scanning)
- [Docker Containerization](#docker-containerization)
- [Environment Setup](#environment-setup)
- [Deployment Workflow](#deployment-workflow)
- [Monitoring & Rollback](#monitoring--rollback)

## CI/CD Architecture

```
┌─────────────┐
│  Git Push   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│           GitHub Actions Triggers            │
├─────────────────────────────────────────────┤
│  • Push to main/develop                      │
│  • Pull Request                              │
│  • Version Tag (v*.*.*)                      │
│  • Weekly Security Scan                      │
└──────┬──────────────────────────────────────┘
       │
       ├─────────────────┬─────────────────┬──────────────────┐
       │                 │                 │                  │
       ▼                 ▼                 ▼                  ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│     CI      │   │  Security   │   │    Build    │   │     CD      │
│  Workflow   │   │   Scan      │   │   Docker    │   │  Workflow   │
└──────┬──────┘   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘
       │                 │                 │                  │
       ▼                 ▼                 ▼                  ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│   Lint &    │   │  • npm audit│   │ Multi-stage │   │   Deploy    │
│    Test     │   │  • Snyk     │   │    Build    │   │  to Vercel  │
│   • ESLint  │   │  • CodeQL   │   │  • Base     │   │             │
│   • Jest    │   │  • OWASP DC │   │  • Deps     │   │  • Staging  │
│   • Build   │   │  • Semgrep  │   │  • Builder  │   │  • Prod     │
│             │   │  • Secrets  │   │  • Runner   │   │             │
└─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘
```

## Continuous Integration (CI)

### Workflow: `.github/workflows/ci.yml`

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

**Jobs:**

#### 1. Lint Job
```yaml
- ESLint for code quality
- TypeScript type checking
- Next.js build validation
```

**Success Criteria:**
- No ESLint errors
- No TypeScript errors
- Zero linting warnings in production code

#### 2. Test Job
```yaml
- Unit tests with Jest
- Coverage threshold: 80%
- Test all security modules
```

**Coverage Requirements:**
```javascript
{
  branches: 70%,
  functions: 70%,
  lines: 80%,
  statements: 80%
}
```

#### 3. Build Job
```yaml
- Production build
- Bundle size check
- Build artifact upload
```

**Build Optimizations:**
- Tree shaking
- Code splitting
- Minification
- Image optimization

### Running CI Locally

```bash
# Lint
cd web
npm run lint

# Type check
npm run type-check

# Test with coverage
npm run test:coverage

# Build
npm run build
```

## Continuous Deployment (CD)

### Workflow: `.github/workflows/cd.yml`

**Triggers:**
- Push to `main` branch → Production
- Version tags (`v*.*.*`) → Production release
- Push to `develop` branch → Staging

**Environments:**

#### Staging
- **URL:** `https://vocavision-staging.vercel.app`
- **Branch:** `develop`
- **Auto-deploy:** Yes
- **Approval:** Not required

#### Production
- **URL:** `https://vocavision.vercel.app`
- **Branch:** `main`
- **Auto-deploy:** Yes (with approval)
- **Approval:** Required for tags

### Deployment Process

1. **Trigger Deployment:**
   ```bash
   # Staging
   git push origin develop

   # Production
   git push origin main

   # Version Release
   git tag -a v1.0.0 -m "Release v1.0.0"
   git push origin v1.0.0
   ```

2. **Automatic Steps:**
   - Checkout code
   - Setup Node.js 18
   - Install dependencies
   - Build application
   - Deploy to Vercel
   - Run smoke tests
   - Update deployment status

3. **Post-Deployment:**
   - Verify deployment URL
   - Check application health
   - Monitor error rates
   - Review performance metrics

## Security Scanning

### Workflow: `.github/workflows/security.yml`

**Triggers:**
- Push to `main` or `develop`
- Pull requests
- Weekly schedule (Mondays 9 AM UTC)
- Manual trigger

**Security Tools:**

#### 1. npm audit
```bash
# Dependency vulnerability scanning
- Check for known CVEs
- Fail on critical vulnerabilities
- Fail if >5 high severity issues
```

#### 2. Snyk
```bash
# Advanced vulnerability scanning
- Deep dependency analysis
- License compliance
- Container scanning
- SARIF report generation
```

**Setup:**
```bash
# 1. Sign up at https://snyk.io
# 2. Get API token
# 3. Add to GitHub Secrets:
#    SNYK_TOKEN=your_snyk_token
```

#### 3. CodeQL
```bash
# SAST (Static Application Security Testing)
- JavaScript/TypeScript analysis
- Security-extended queries
- Custom security patterns
- OWASP Top 10 detection
```

**Configuration:**
```yaml
queries: +security-extended,security-and-quality
paths:
  - web/src
paths-ignore:
  - web/src/**/*.test.ts
```

#### 4. OWASP Dependency-Check
```bash
# Known vulnerability database check
- NVD (National Vulnerability Database)
- CVE detection
- Fail on CVSS score >= 7
- HTML report generation
```

#### 5. Semgrep
```bash
# Pattern-based SAST
- Custom security rules
- Language-agnostic scanning
- Fast pattern matching
- Zero false positives
```

#### 6. TruffleHog
```bash
# Secret detection
- API keys, tokens, passwords
- Git history scanning
- Verified secrets only
- Pre-commit prevention
```

### Security Reports

**Artifacts (Retention: 30-90 days):**
- `npm-audit-report.json`
- `snyk.sarif`
- `owasp-dependency-check-report/`
- `semgrep-report.sarif`
- `complete-security-report/`

**View Reports:**
1. Go to Actions tab
2. Select Security Scan workflow
3. Click on latest run
4. Download artifacts

### Dependabot Configuration

**File:** `.github/dependabot.yml`

**Features:**
- Weekly dependency updates
- Security patch auto-merge
- Grouped updates (dev/test/security)
- Version pinning for major updates

**Groups:**
```yaml
development-dependencies:  # ESLint, TypeScript, etc.
testing-dependencies:      # Jest, Playwright, etc.
security-updates:          # Critical patches
```

## Docker Containerization

### Dockerfile

**Multi-stage Build:**

```dockerfile
# Stage 1: Base
FROM node:18-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

# Stage 2: Dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Stage 3: Builder
FROM base AS builder
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 4: Runner
FROM base AS runner
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
USER nextjs
EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"
CMD ["node", "server.js"]
```

**Benefits:**
- Minimal image size (~150MB)
- Layer caching optimization
- Security: non-root user
- Production-only dependencies

### Docker Commands

```bash
# Build
cd web
docker build -t vocavision:latest .

# Run
docker run -p 3000:3000 \
  -e DATABASE_URL=$DATABASE_URL \
  -e NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
  vocavision:latest

# Inspect
docker images vocavision
docker inspect vocavision:latest

# Push to registry
docker tag vocavision:latest your-registry/vocavision:latest
docker push your-registry/vocavision:latest
```

### Docker Compose (Development)

```yaml
version: '3.8'
services:
  web:
    build:
      context: ./web
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
    volumes:
      - ./web:/app
      - /app/node_modules
      - /app/.next
```

## Environment Setup

### Required Secrets

Configure in GitHub Settings → Secrets and variables → Actions:

```bash
# Vercel Deployment
VERCEL_TOKEN=                  # Vercel API token
VERCEL_ORG_ID=                 # Vercel organization ID
VERCEL_PROJECT_ID=             # Vercel project ID

# Security Scanning
SNYK_TOKEN=                    # Snyk API token

# Optional
SENTRY_AUTH_TOKEN=             # Error tracking
CODECOV_TOKEN=                 # Code coverage
```

### Environment Variables

**Staging (`.env.staging`):**
```bash
NEXT_PUBLIC_API_URL=https://api-staging.vocavision.com
NEXT_PUBLIC_SENTRY_DSN=
DATABASE_URL=
REDIS_URL=
```

**Production (`.env.production`):**
```bash
NEXT_PUBLIC_API_URL=https://api.vocavision.com
NEXT_PUBLIC_SENTRY_DSN=
DATABASE_URL=
REDIS_URL=
```

### Setup Instructions

1. **Fork & Clone:**
   ```bash
   git clone https://github.com/josens83/vocavision.git
   cd vocavision
   ```

2. **Install Dependencies:**
   ```bash
   cd web
   npm install
   ```

3. **Configure Secrets:**
   - Go to repository Settings → Secrets
   - Add all required secrets

4. **Enable Workflows:**
   - Go to Actions tab
   - Enable workflows if prompted

5. **First Deployment:**
   ```bash
   git checkout -b develop
   git push origin develop  # Triggers staging deployment
   ```

## Deployment Workflow

### Development Flow

```bash
# 1. Feature branch
git checkout -b feature/new-feature
# ... make changes ...
git commit -m "Add new feature"
git push origin feature/new-feature

# 2. Create PR to develop
# → Triggers: CI workflow, Security scan

# 3. Merge to develop
# → Triggers: CI + CD to staging

# 4. Test on staging
# https://vocavision-staging.vercel.app

# 5. Create PR to main
# → Triggers: CI workflow, Security scan

# 6. Merge to main
# → Triggers: CI + CD to production

# 7. Tag release (optional)
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
# → Triggers: Production release deployment
```

### Hotfix Flow

```bash
# 1. Hotfix branch from main
git checkout main
git checkout -b hotfix/critical-fix

# 2. Fix and commit
git commit -m "Fix critical bug"

# 3. Create PR to main
# → Triggers: CI workflow

# 4. Merge and deploy
git checkout main
git merge hotfix/critical-fix
git push origin main
# → Triggers: Immediate production deployment

# 5. Backport to develop
git checkout develop
git merge main
git push origin develop
```

## Monitoring & Rollback

### Deployment Monitoring

**Vercel Dashboard:**
- Real-time deployment status
- Build logs
- Performance metrics
- Error tracking

**GitHub Actions:**
- Workflow runs history
- Failed job notifications
- Artifact downloads

### Health Checks

```bash
# Staging
curl https://vocavision-staging.vercel.app/api/health

# Production
curl https://vocavision.vercel.app/api/health
```

### Rollback Procedure

#### Option 1: Vercel Dashboard
1. Go to Vercel project
2. Click "Deployments"
3. Find previous stable deployment
4. Click "Promote to Production"

#### Option 2: Git Revert
```bash
# Revert commit
git revert HEAD
git push origin main

# OR revert to specific commit
git reset --hard <commit-hash>
git push origin main --force
```

#### Option 3: Redeploy Previous Tag
```bash
# List tags
git tag -l

# Checkout previous tag
git checkout v1.0.0

# Create new deployment
git tag -a v1.0.1 -m "Rollback to v1.0.0"
git push origin v1.0.1
```

### Emergency Contacts

- **DevOps Lead:** @josens83
- **Security Team:** security@vocavision.com
- **On-Call:** [PagerDuty/Slack Channel]

## Best Practices

### Commit Messages

```bash
# Format: <type>(<scope>): <subject>

feat(auth): add OAuth2 login
fix(api): resolve rate limit bug
chore(deps): update dependencies
docs(readme): add setup instructions
test(security): add XSS prevention tests
perf(images): optimize loading performance
```

### Branch Naming

```bash
feature/user-authentication
bugfix/login-error
hotfix/security-patch
refactor/api-structure
docs/api-documentation
```

### Pull Request Checklist

- [ ] Code follows style guidelines
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Security considerations reviewed
- [ ] Performance impact assessed
- [ ] Breaking changes documented

### Security Checklist

- [ ] No secrets in code
- [ ] Dependencies updated
- [ ] Security scan passed
- [ ] OWASP Top 10 reviewed
- [ ] Input validation added
- [ ] Authentication/authorization verified

## Troubleshooting

### CI Failures

**ESLint Errors:**
```bash
npm run lint
npm run lint:fix
```

**Test Failures:**
```bash
npm run test
npm run test:watch  # Debug specific test
```

**Build Errors:**
```bash
npm run build
# Check build logs for specific errors
```

### CD Failures

**Vercel Deployment Failed:**
1. Check Vercel logs in dashboard
2. Verify environment variables
3. Check build command in `vercel.json`
4. Ensure secrets are configured

**Security Scan Failed:**
1. Review security reports
2. Update vulnerable dependencies:
   ```bash
   npm audit fix
   ```
3. Check Snyk dashboard for details

### Docker Issues

**Build Fails:**
```bash
# Check Dockerfile syntax
docker build -t vocavision:latest .

# Use build cache
docker build --cache-from vocavision:latest -t vocavision:latest .
```

**Runtime Errors:**
```bash
# Check logs
docker logs <container-id>

# Interactive shell
docker run -it vocavision:latest sh
```

## Performance Optimization

### Build Time Optimization

```yaml
# Use caching
- uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}

# Parallel jobs
jobs:
  lint:
  test:
  build:
# All run in parallel
```

### Deployment Speed

- **Vercel Edge Network:** Global CDN
- **Incremental Static Regeneration:** Only rebuild changed pages
- **Serverless Functions:** Auto-scaling

## Cost Optimization

### Free Tier Limits

**GitHub Actions:**
- 2,000 minutes/month (Free)
- Unlimited for public repos

**Vercel:**
- 100GB bandwidth/month
- Unlimited deployments
- Custom domains

**Snyk:**
- 200 tests/month (Free tier)
- Unlimited for open source

### Cost Reduction Tips

1. **Cache Dependencies:**
   - Reduces build time
   - Saves CI minutes

2. **Optimize Docker Layers:**
   - Smaller images
   - Faster pulls

3. **Limit Workflow Triggers:**
   - Use `paths` filter
   - Skip unnecessary runs

## References

- [GitHub Actions Documentation](https://docs.github.com/actions)
- [Vercel Deployment Documentation](https://vercel.com/docs)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

## Changelog

### Phase 7 - CI/CD Pipeline (2024-01-21)
- ✅ GitHub Actions CI workflow
- ✅ GitHub Actions CD workflow
- ✅ Security scanning (6 tools)
- ✅ Docker multi-stage build
- ✅ Dependabot configuration
- ✅ Complete documentation

---

**Last Updated:** 2024-01-21
**Maintained By:** VocaVision DevOps Team
**Version:** 1.0.0
