# VocaVision Operational Runbook

**Version:** 1.0.0
**Last Updated:** 2024-01-21
**Team:** DevOps & SRE

---

## Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Daily Operations](#daily-operations)
- [Common Tasks](#common-tasks)
- [Monitoring & Alerts](#monitoring--alerts)
- [Troubleshooting](#troubleshooting)
- [Maintenance Procedures](#maintenance-procedures)
- [Emergency Procedures](#emergency-procedures)
- [Useful Commands](#useful-commands)

---

## Overview

This runbook provides operational procedures and commands for managing VocaVision in production. It serves as a quick reference for engineers and operators.

### Purpose

- **Standardize operations**: Consistent procedures across team
- **Reduce errors**: Step-by-step instructions
- **Enable self-service**: Empower engineers to solve issues
- **Knowledge sharing**: Document tribal knowledge

### When to Use

- Daily operational tasks
- Routine maintenance
- Troubleshooting common issues
- Emergency response

### Related Documentation

- [Incident Response Playbook](./INCIDENT_RESPONSE.md)
- [CI/CD Documentation](./CI_CD.md)
- [Developer Guide](./DEVELOPER_GUIDE.md)
- [API Reference](./API_REFERENCE.md)

---

## System Architecture

### Production Environment

```
┌─────────────────────────────────────────────────────────┐
│                      Users/Browsers                      │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                  Vercel Edge Network                     │
│                     (Global CDN)                         │
└────────────────────────┬────────────────────────────────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
    ┌──────────┐  ┌──────────┐  ┌──────────┐
    │  Static  │  │   API    │  │  Server  │
    │  Assets  │  │  Routes  │  │   Side   │
    │          │  │          │  │ Render   │
    └──────────┘  └─────┬────┘  └──────────┘
                        │
                        ▼
              ┌──────────────────┐
              │   PostgreSQL     │
              │   (Database)     │
              └──────────────────┘
                        │
              ┌──────────────────┐
              │      Redis       │
              │     (Cache)      │
              └──────────────────┘
```

### Key Services

| Service | Provider | Purpose | URL/Connection |
|---------|----------|---------|----------------|
| Frontend Hosting | Vercel | Next.js app hosting | https://vocavision.com |
| API | Vercel Functions | Serverless API | https://api.vocavision.com |
| Database | [Provider] | PostgreSQL 15 | $DATABASE_URL |
| Cache | [Provider] | Redis 7 | $REDIS_URL |
| CDN | Vercel Edge | Static assets | Automatic |
| Monitoring | Sentry | Error tracking | https://sentry.io |
| Analytics | Google Analytics 4 | Usage analytics | https://analytics.google.com |

### Environment Variables

Critical environment variables in production:

```bash
# Application
NEXT_PUBLIC_APP_URL=https://vocavision.com
NEXT_PUBLIC_API_URL=https://api.vocavision.com

# Database
DATABASE_URL=postgresql://...
DATABASE_POOL_SIZE=50

# Redis
REDIS_URL=redis://...

# Authentication
NEXTAUTH_SECRET=***
NEXTAUTH_URL=https://vocavision.com

# External APIs
OPENAI_API_KEY=***
ANTHROPIC_API_KEY=***

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=***
SENTRY_AUTH_TOKEN=***

# Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=***
```

---

## Daily Operations

### Morning Checklist (9 AM UTC)

```bash
# 1. Check system status
□ Visit: https://status.vocavision.com
□ Check: Vercel dashboard for failed deployments
□ Review: Sentry for error spikes

# 2. Review overnight metrics
□ Active users count
□ Error rate (< 0.1%)
□ Average response time (< 200ms p95)
□ Database query performance

# 3. Check alerts
□ Review: Slack #incidents-alerts channel
□ Verify: No unacknowledged PagerDuty alerts
□ Check: Email for monitoring alerts

# 4. Review support tickets
□ Check: Priority issues
□ Identify: Recurring problems
```

### Weekly Checklist (Monday 10 AM UTC)

```bash
# 1. Dependency updates
□ Review: Dependabot PRs
□ Merge: Security updates
□ Test: Staging environment

# 2. Performance review
□ Analyze: Core Web Vitals trends
□ Review: Slow query log
□ Check: Bundle size changes

# 3. Security scan
□ Run: npm audit
□ Review: Snyk security scan
□ Check: SSL certificate expiry

# 4. Backup verification
□ Verify: Database backups successful
□ Test: Restore from backup (monthly)
□ Check: Backup retention policy

# 5. Capacity planning
□ Review: Resource utilization
□ Check: Database growth rate
□ Plan: Scaling if needed
```

### Monthly Checklist (First Monday)

```bash
# 1. Access review
□ Audit: User access permissions
□ Remove: Inactive accounts
□ Rotate: API keys and secrets

# 2. Documentation review
□ Update: Runbooks and playbooks
□ Review: Incident post-mortems
□ Update: Architecture diagrams

# 3. Cost optimization
□ Review: Vercel usage and costs
□ Analyze: Database query efficiency
□ Optimize: CDN cache hit rate

# 4. Compliance check
□ Review: Data retention policies
□ Verify: GDPR compliance
□ Check: Security audit logs
```

---

## Common Tasks

### Deploy to Production

```bash
# Option 1: Push to main branch (automatic deployment)
git checkout main
git pull origin main
git merge develop
git push origin main

# Option 2: Create release tag
git tag -a v1.2.0 -m "Release v1.2.0"
git push origin v1.2.0

# Option 3: Manual deployment via Vercel CLI
cd web
vercel --prod

# Verify deployment
curl https://vocavision.com/api/health
```

### Rollback Deployment

```bash
# Option 1: Via Vercel Dashboard
# 1. Go to https://vercel.com/vocavision/deployments
# 2. Find last stable deployment
# 3. Click "Promote to Production"

# Option 2: Via Vercel CLI
vercel rollback [deployment-url]

# Option 3: Git revert
git revert HEAD
git push origin main

# Verify rollback
curl https://vocavision.com/api/health
```

### Scale Application

```bash
# Increase instance limits
# Edit vercel.json:
{
  "functions": {
    "api/**/*.ts": {
      "maxDuration": 60,
      "memory": 1024
    }
  },
  "regions": ["iad1", "sfo1"]
}

# Deploy changes
git add vercel.json
git commit -m "chore: increase function limits"
git push origin main

# Or use Vercel dashboard:
# Settings → Functions → Configure limits
```

### Database Operations

#### Connect to Database

```bash
# Using psql
psql $DATABASE_URL

# Or using connection details
psql -h hostname -U username -d database_name

# Read-only connection (if available)
psql $DATABASE_READONLY_URL
```

#### Run Database Migration

```bash
# Development
npm run db:migrate

# Production (caution!)
# 1. Test on staging first
# 2. Create database backup
# 3. Run migration
DATABASE_URL=$PROD_DATABASE_URL npm run db:migrate

# Verify migration
psql $DATABASE_URL -c "SELECT * FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 5;"
```

#### Database Backup

```bash
# Manual backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Compress backup
pg_dump $DATABASE_URL | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Restore from backup
psql $DATABASE_URL < backup_20240121_103000.sql

# Or for compressed backup
gunzip -c backup_20240121_103000.sql.gz | psql $DATABASE_URL
```

#### Database Vacuum

```bash
# Analyze tables
psql $DATABASE_URL -c "ANALYZE;"

# Vacuum (standard)
psql $DATABASE_URL -c "VACUUM;"

# Vacuum full (requires downtime)
psql $DATABASE_URL -c "VACUUM FULL;"

# Auto-vacuum status
psql $DATABASE_URL -c "SELECT * FROM pg_stat_progress_vacuum;"
```

### Cache Operations

#### Redis Cache

```bash
# Connect to Redis
redis-cli -u $REDIS_URL

# Check Redis status
redis-cli -u $REDIS_URL PING

# Get cache stats
redis-cli -u $REDIS_URL INFO stats

# Clear specific cache
redis-cli -u $REDIS_URL DEL "cache:words:*"

# Clear all cache (caution!)
redis-cli -u $REDIS_URL FLUSHDB

# Monitor Redis operations
redis-cli -u $REDIS_URL MONITOR
```

#### Vercel Edge Cache

```bash
# Purge specific path
curl -X PURGE https://vocavision.com/api/words

# Purge all cache (via Vercel API)
curl -X POST "https://api.vercel.com/v1/deployments/[deployment-id]/purge" \
  -H "Authorization: Bearer $VERCEL_TOKEN"
```

### User Management

#### Check User Account

```bash
# Query user
psql $DATABASE_URL -c "SELECT id, email, created_at, last_login FROM users WHERE email = 'user@example.com';"

# Check user activity
psql $DATABASE_URL -c "SELECT * FROM user_activity WHERE user_id = 'user_123' ORDER BY created_at DESC LIMIT 10;"

# Check user progress
psql $DATABASE_URL -c "SELECT * FROM user_progress WHERE user_id = 'user_123';"
```

#### Reset User Password

```bash
# Generate password reset token
node scripts/generate-password-reset-token.js user@example.com

# Or via API
curl -X POST https://api.vocavision.com/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
```

#### Delete User Account

```bash
# Soft delete (recommended)
psql $DATABASE_URL -c "UPDATE users SET deleted_at = NOW() WHERE email = 'user@example.com';"

# Hard delete (GDPR compliance)
# Run deletion script
node scripts/delete-user-data.js user@example.com --confirm

# Verify deletion
psql $DATABASE_URL -c "SELECT * FROM users WHERE email = 'user@example.com';"
```

---

## Monitoring & Alerts

### Key Metrics

#### Application Health

```bash
# Check API health
curl https://api.vocavision.com/health

# Response should be:
{
  "status": "healthy",
  "timestamp": "2024-01-21T10:00:00Z",
  "checks": {
    "database": "healthy",
    "redis": "healthy"
  }
}
```

#### Performance Metrics

**Target SLIs** (Service Level Indicators):

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Uptime | 99.9% | < 99.5% |
| Error Rate | < 0.1% | > 0.5% |
| Response Time (p95) | < 200ms | > 500ms |
| Response Time (p99) | < 500ms | > 1000ms |
| Database Query (p95) | < 50ms | > 100ms |
| Core Web Vitals LCP | < 2.5s | > 4s |

#### Monitoring Dashboards

1. **Vercel Analytics**
   - URL: https://vercel.com/vocavision/analytics
   - Metrics: Requests, bandwidth, errors

2. **Sentry Dashboard**
   - URL: https://sentry.io/organizations/vocavision
   - Metrics: Errors, performance, releases

3. **Google Analytics 4**
   - URL: https://analytics.google.com
   - Metrics: Users, sessions, conversions

4. **Database Monitoring**
   - URL: [Database provider dashboard]
   - Metrics: Connections, queries, storage

### Alert Configuration

#### Sentry Alerts

```yaml
# High error rate
- name: High Error Rate
  condition: error_count > 100 in 5 minutes
  severity: high
  notify: #incidents

# Performance degradation
- name: Slow Response Time
  condition: p95_response_time > 500ms for 10 minutes
  severity: medium
  notify: #engineering

# Critical errors
- name: Critical Error
  condition: any error with level=fatal
  severity: critical
  notify: @oncall
```

#### Vercel Monitoring

```yaml
# Deployment failures
- name: Deployment Failed
  condition: deployment_status == failed
  severity: high
  notify: #incidents

# High function duration
- name: Function Timeout
  condition: function_duration > 50s
  severity: medium
  notify: #engineering
```

### Viewing Logs

```bash
# Real-time logs
vercel logs --follow

# Logs from specific deployment
vercel logs [deployment-url]

# Filter logs by function
vercel logs --output $(vercel list | grep production | awk '{print $2}')

# Application logs (if using structured logging)
# Query in logging service (e.g., Datadog, CloudWatch)
```

---

## Troubleshooting

### High Response Times

**Symptoms**: API endpoints slow (>500ms)

**Diagnosis**:
```bash
# 1. Check Vercel function duration
# Visit: Vercel dashboard → Functions

# 2. Check database slow queries
psql $DATABASE_URL -c "
  SELECT query, mean_exec_time, calls
  FROM pg_stat_statements
  ORDER BY mean_exec_time DESC
  LIMIT 10;
"

# 3. Check Redis latency
redis-cli -u $REDIS_URL --latency

# 4. Check external API responses
# Review Sentry performance monitoring
```

**Resolution**:
1. Add database indexes for slow queries
2. Implement caching for frequent queries
3. Optimize database queries (N+1 issues)
4. Scale up function memory if needed

---

### High Error Rate

**Symptoms**: Error rate > 0.5%

**Diagnosis**:
```bash
# 1. Check Sentry for error trends
# Visit: https://sentry.io/organizations/vocavision/issues/

# 2. Review recent deployments
vercel list | head -10

# 3. Check for dependency issues
npm outdated

# 4. Review error logs
vercel logs --since 1h | grep ERROR
```

**Resolution**:
1. Identify error pattern (authentication, API, database)
2. Check for recent code changes
3. Rollback if related to deployment
4. Apply hotfix if bug identified

---

### Database Connection Pool Exhausted

**Symptoms**: "Too many connections" errors

**Diagnosis**:
```bash
# Check active connections
psql $DATABASE_URL -c "
  SELECT count(*),
         state,
         wait_event_type,
         wait_event
  FROM pg_stat_activity
  GROUP BY state, wait_event_type, wait_event
  ORDER BY count DESC;
"

# Check connection pool configuration
env | grep DATABASE_POOL
```

**Resolution**:
```bash
# Option 1: Increase pool size (temporary)
# Update environment variable
DATABASE_POOL_SIZE=100

# Option 2: Kill idle connections
psql $DATABASE_URL -c "
  SELECT pg_terminate_backend(pid)
  FROM pg_stat_activity
  WHERE state = 'idle'
    AND state_change < NOW() - INTERVAL '10 minutes';
"

# Option 3: Implement PgBouncer
# See CI_CD.md for PgBouncer setup
```

---

### Cache Not Working

**Symptoms**: High database load, slow responses

**Diagnosis**:
```bash
# Check Redis status
redis-cli -u $REDIS_URL PING

# Check cache hit rate
redis-cli -u $REDIS_URL INFO stats | grep keyspace

# Check cache size
redis-cli -u $REDIS_URL DBSIZE

# Monitor cache operations
redis-cli -u $REDIS_URL MONITOR
```

**Resolution**:
```bash
# Option 1: Restart Redis
# Contact Redis provider or restart service

# Option 2: Clear corrupted cache
redis-cli -u $REDIS_URL FLUSHDB

# Option 3: Check cache configuration
# Review cache TTL settings in application code
```

---

### SSL Certificate Issues

**Symptoms**: HTTPS errors, certificate warnings

**Diagnosis**:
```bash
# Check certificate expiry
echo | openssl s_client -connect vocavision.com:443 2>/dev/null | \
  openssl x509 -noout -dates

# Check certificate chain
echo | openssl s_client -connect vocavision.com:443 -showcerts

# Check SSL configuration
curl -I https://vocavision.com
```

**Resolution**:
1. Vercel handles SSL automatically
2. Check custom domain configuration
3. Renew certificate if expired (usually automatic)
4. Contact Vercel support if issues persist

---

## Maintenance Procedures

### Planned Maintenance

#### Preparation (1 week before)

```bash
# 1. Schedule maintenance window
# Choose low-traffic time (e.g., Sunday 2 AM UTC)

# 2. Notify users
# Update status page
# Send email notification
# Post in-app banner

# 3. Prepare rollback plan
# Document rollback steps
# Test rollback procedure

# 4. Create maintenance checklist
# List all tasks
# Assign responsibilities
# Set time estimates
```

#### During Maintenance

```bash
# 1. Enable maintenance mode
# Update status page
# Show maintenance page

# 2. Take backups
pg_dump $DATABASE_URL > backup_before_maintenance.sql

# 3. Perform maintenance tasks
# Run migrations
# Update configurations
# Apply patches

# 4. Verify changes
# Run smoke tests
# Check monitoring dashboards
# Test critical user flows

# 5. Disable maintenance mode
# Remove maintenance page
# Update status page
# Send completion notification
```

#### Post-Maintenance

```bash
# 1. Monitor closely
# Watch error rates for 1 hour
# Check performance metrics
# Review user feedback

# 2. Document changes
# Update changelog
# Record any issues
# Note lessons learned

# 3. Send update
# Notify completion
# Thank users for patience
# Summarize changes made
```

---

### Database Maintenance

#### Weekly Maintenance

```bash
# Analyze tables
psql $DATABASE_URL -c "ANALYZE VERBOSE;"

# Check for bloat
psql $DATABASE_URL -c "
  SELECT schemaname, tablename,
         pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"

# Update statistics
psql $DATABASE_URL -c "VACUUM ANALYZE;"
```

#### Monthly Maintenance

```bash
# Full vacuum (requires maintenance window)
psql $DATABASE_URL -c "VACUUM FULL ANALYZE;"

# Reindex (requires maintenance window)
psql $DATABASE_URL -c "REINDEX DATABASE vocavision;"

# Clean up old data
psql $DATABASE_URL -c "
  DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '90 days';
  DELETE FROM session_logs WHERE created_at < NOW() - INTERVAL '30 days';
"
```

---

### Security Maintenance

#### Rotate Secrets (Quarterly)

```bash
# 1. Generate new secrets
NEW_SECRET=$(openssl rand -base64 32)

# 2. Update environment variables
# Vercel: Settings → Environment Variables
# Add new secret with _NEW suffix

# 3. Deploy with new secrets
# Gradual rollout to avoid disruption

# 4. Verify new secrets work
# Test authentication
# Check API endpoints

# 5. Remove old secrets
# After 24 hours of monitoring
```

#### Security Audit (Quarterly)

```bash
# 1. Dependency audit
npm audit
npm audit fix

# 2. Security scan
npm run security:scan

# 3. Access review
# Audit team member access
# Remove inactive accounts
# Review API key usage

# 4. Vulnerability scan
# Run security scanner (Snyk, etc.)
# Review findings
# Prioritize fixes

# 5. Compliance check
# GDPR compliance
# Data retention policies
# Privacy policy updates
```

---

## Emergency Procedures

### Complete Site Down

```bash
# 1. Check Vercel status
curl -I https://vocavision.com

# 2. Check DNS
nslookup vocavision.com

# 3. Check Vercel deployments
vercel list | head -5

# 4. Check for failed deployments
vercel inspect [deployment-url]

# 5. Rollback to last known good
# Via Vercel dashboard or CLI

# 6. If DNS issue
# Check domain registrar
# Verify nameservers

# 7. Notify stakeholders
# Update status page
# Post in #incidents
```

### Database Emergency

```bash
# 1. Check database status
psql $DATABASE_URL -c "SELECT version();"

# 2. Check connections
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"

# 3. Kill problematic queries
psql $DATABASE_URL -c "
  SELECT pg_terminate_backend(pid)
  FROM pg_stat_activity
  WHERE query_start < NOW() - INTERVAL '5 minutes'
    AND state = 'active';
"

# 4. If database unresponsive
# Contact database provider support
# Check provider status page

# 5. Failover to replica (if available)
# Update DATABASE_URL
# Restart application
```

### Security Breach

**⚠️ CRITICAL: Follow Incident Response Playbook**

```bash
# 1. Isolate affected systems
# Disable compromised accounts
# Block malicious IPs

# 2. Preserve evidence
# Take database snapshot
# Save all logs

# 3. Assess scope
# Check access logs
# Identify affected data
# Determine breach timeline

# 4. Contain breach
# Rotate all secrets
# Force password reset
# Apply security patches

# 5. Notify
# Security team: Immediately
# Legal team: < 1 hour
# Users: < 72 hours (GDPR)

# See INCIDENT_RESPONSE.md for full procedure
```

---

## Useful Commands

### Quick Reference

```bash
# System health
curl https://api.vocavision.com/health

# Database version
psql $DATABASE_URL -c "SELECT version();"

# Redis ping
redis-cli -u $REDIS_URL PING

# Recent deployments
vercel list | head -10

# Current deployment
vercel ls --prod

# View logs
vercel logs --follow

# Rollback
vercel rollback [url]

# Environment variables
vercel env ls

# Database backup
pg_dump $DATABASE_URL > backup.sql

# Redis backup
redis-cli -u $REDIS_URL BGSAVE
```

### Database Queries

```sql
-- Active connections
SELECT count(*), state
FROM pg_stat_activity
GROUP BY state;

-- Slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Table sizes
SELECT schemaname, tablename,
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- User count
SELECT COUNT(*) FROM users WHERE deleted_at IS NULL;

-- Active users (last 7 days)
SELECT COUNT(DISTINCT user_id)
FROM user_activity
WHERE created_at > NOW() - INTERVAL '7 days';
```

---

## Contact Information

### Team Contacts

| Role | Contact | Availability |
|------|---------|--------------|
| On-Call Engineer | PagerDuty | 24/7 |
| DevOps Team | devops@vocavision.com | Business hours |
| Database Admin | dba@vocavision.com | Business hours |
| Security Team | security@vocavision.com | 24/7 |

### Vendor Support

| Vendor | Support | Priority Support |
|--------|---------|------------------|
| Vercel | https://vercel.com/support | Enterprise plan |
| Database Provider | [Support URL] | [Plan details] |
| Redis Provider | [Support URL] | [Plan details] |

---

**Document Version**: 1.0.0
**Last Updated**: 2024-01-21
**Next Review**: 2024-04-21
**Maintained By**: DevOps Team

---

**For updates or corrections, contact**: devops@vocavision.com
