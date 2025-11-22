# VocaVision Incident Response Playbook

**Version:** 1.0.0
**Last Updated:** 2024-01-21
**On-Call Team:** devops@vocavision.com

---

## Table of Contents

- [Overview](#overview)
- [Severity Levels](#severity-levels)
- [Incident Response Process](#incident-response-process)
- [Incident Types & Runbooks](#incident-types--runbooks)
- [Communication Protocol](#communication-protocol)
- [Post-Incident Review](#post-incident-review)
- [Escalation Matrix](#escalation-matrix)
- [Tools & Resources](#tools--resources)

---

## Overview

This playbook provides step-by-step procedures for responding to production incidents in VocaVision. It ensures consistent, effective incident management and rapid service restoration.

### Goals

- **Minimize downtime** and impact to users
- **Restore service** as quickly as possible
- **Communicate effectively** with stakeholders
- **Learn and improve** from each incident

### Key Principles

1. **Safety First**: Don't make changes that could worsen the situation
2. **Document Everything**: Record all actions and decisions
3. **Communicate Clearly**: Keep stakeholders informed
4. **Focus on Restoration**: Fix first, investigate cause later
5. **Follow the Process**: Don't skip steps

---

## Severity Levels

### Severity 1 (Critical) 🔴

**Definition**: Complete service outage or critical functionality unavailable

**Examples**:
- Website completely down
- Database unavailable
- Authentication system failure
- Data loss or corruption
- Security breach

**Response Time**: Immediate (< 5 minutes)
**Resolution Target**: < 1 hour
**Escalation**: Immediate to VP Engineering
**Communication**: Real-time updates every 15 minutes

### Severity 2 (High) 🟠

**Definition**: Major feature degraded but core functionality available

**Examples**:
- Learning sessions not saving
- Quiz results not recording
- Email notifications failing
- Significant performance degradation (>50% slower)
- API errors affecting multiple users

**Response Time**: < 15 minutes
**Resolution Target**: < 4 hours
**Escalation**: After 2 hours to Engineering Manager
**Communication**: Updates every 30 minutes

### Severity 3 (Medium) 🟡

**Definition**: Minor feature impaired, workaround available

**Examples**:
- Single feature not working
- UI rendering issues
- Slow page loads (20-50% slower)
- Minor API errors
- Isolated user issues

**Response Time**: < 1 hour
**Resolution Target**: < 24 hours
**Escalation**: After 12 hours to Team Lead
**Communication**: Updates every 2 hours

### Severity 4 (Low) 🟢

**Definition**: Cosmetic issues or planned maintenance

**Examples**:
- Visual inconsistencies
- Missing translations
- Minor performance issues (<20% slower)
- Documentation errors
- Feature requests

**Response Time**: < 4 hours (business hours)
**Resolution Target**: Next sprint
**Escalation**: Not required
**Communication**: Status update in daily standup

---

## Incident Response Process

### Phase 1: Detection & Triage (0-5 minutes)

#### 1. Identify the Incident

**Sources**:
- Monitoring alerts (Sentry, APM)
- User reports
- Support tickets
- Social media mentions
- Manual discovery

**Initial Actions**:
```bash
# Check system status
curl https://api.vocavision.com/health

# Check Sentry for errors
# Visit: https://sentry.io/organizations/vocavision/issues/

# Check Vercel deployment status
# Visit: https://vercel.com/vocavision/deployments

# Check analytics for traffic drops
# Visit: https://analytics.google.com
```

#### 2. Declare an Incident

**Criteria**: If any of the following apply:
- Users are unable to access core features
- Data integrity is at risk
- Security is compromised
- Multiple error reports received

**Action**:
```markdown
# Incident Declaration Template
**Incident ID**: INC-YYYY-MM-DD-###
**Severity**: [1/2/3/4]
**Start Time**: YYYY-MM-DD HH:MM UTC
**Status**: Investigating
**Impact**: [Description of user impact]
**Affected Systems**: [List of affected systems]
**Incident Commander**: [Name]
```

#### 3. Assemble Response Team

**Roles**:
- **Incident Commander (IC)**: Coordinates response
- **Technical Lead**: Investigates and implements fixes
- **Communications Lead**: Manages stakeholder communication
- **Subject Matter Expert(s)**: Domain-specific expertise

**Notifications**:
```bash
# Notify on-call engineer
pagerduty trigger incident

# Create incident channel
slack create-channel #incident-[date]-[description]

# Post incident declaration
slack post-message #incident-channel "Incident declared: [details]"
```

### Phase 2: Investigation & Diagnosis (5-30 minutes)

#### 1. Gather Information

**System Health Check**:
```bash
# Check Vercel status
vercel status

# Check database connections
psql $DATABASE_URL -c "SELECT version();"

# Check Redis
redis-cli ping

# Review recent deployments
git log --oneline -10

# Check recent changes
git diff HEAD~5 HEAD
```

**Monitor Metrics**:
- Error rate (Sentry)
- Response time (APM)
- Traffic volume (GA4)
- Database queries (slow queries)
- API endpoint status

**Review Logs**:
```bash
# Check application logs
vercel logs --follow

# Check error logs
tail -f /var/log/vocavision/error.log

# Search for specific errors
grep "ERROR" /var/log/vocavision/app.log | tail -20
```

#### 2. Identify Root Cause

**Common Root Causes**:
1. **Recent Deployment**: Bad code push
2. **Configuration Change**: Environment variables
3. **External Dependency**: Third-party API down
4. **Resource Exhaustion**: CPU, memory, disk, connections
5. **Database Issue**: Slow queries, locks, corruption
6. **DDoS Attack**: Unusual traffic patterns
7. **Certificate Expiry**: SSL/TLS issues

**Hypothesis Formation**:
```markdown
## Hypothesis Tracking

### Hypothesis 1: Recent deployment introduced bug
- Evidence: Error started after deploy at 10:30 AM
- Testing: Rollback to previous version
- Result: [To be determined]

### Hypothesis 2: Database connection pool exhausted
- Evidence: "Too many connections" errors in logs
- Testing: Increase connection limit
- Result: [To be determined]
```

### Phase 3: Mitigation & Resolution (30 minutes - 4 hours)

#### 1. Implement Fix

**Priority: Restore Service First**

**Quick Mitigation Options**:

1. **Rollback Deployment**:
```bash
# Vercel rollback
vercel rollback [deployment-url]

# Or use Vercel dashboard to promote previous deployment

# Verify rollback
curl https://api.vocavision.com/health
```

2. **Disable Problematic Feature**:
```typescript
// Use feature flags
await updateFeatureFlag('problematic-feature', false);
```

3. **Scale Resources**:
```bash
# Increase instance count
vercel scale [deployment] --min 5 --max 20

# Or in vercel.json
{
  "functions": {
    "api/**/*.ts": {
      "maxDuration": 60,
      "memory": 1024
    }
  }
}
```

4. **Clear Cache**:
```bash
# Clear Redis cache
redis-cli FLUSHDB

# Clear CDN cache
curl -X POST https://api.vercel.com/v1/purge \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -d '{"purgeAll": true}'
```

5. **Restart Services**:
```bash
# Restart application
vercel redeploy

# Restart database connections
# Execute in database management tool
```

#### 2. Verify Fix

**Verification Checklist**:
- [ ] Primary symptom resolved
- [ ] Error rate returned to normal
- [ ] Response time within SLA
- [ ] Key user flows working
- [ ] No new errors introduced

**Smoke Tests**:
```bash
# Test critical endpoints
curl https://api.vocavision.com/api/v1/auth/health
curl https://api.vocavision.com/api/v1/words
curl https://api.vocavision.com/api/v1/learning/daily

# Run E2E tests
npm run test:e2e:critical

# Check monitoring dashboards
# Sentry, GA4, Vercel Analytics
```

#### 3. Monitor Closely

**Post-Fix Monitoring (First Hour)**:
- Error rates every 5 minutes
- Response times every 5 minutes
- User feedback monitoring
- Support ticket volume

**Extended Monitoring (Next 24 Hours)**:
- Hourly metric checks
- Daily summary report
- Watch for recurrence

### Phase 4: Communication (Ongoing)

#### Internal Communication

**Status Updates**:
```markdown
## Incident Status Update #[N]
**Time**: YYYY-MM-DD HH:MM UTC
**Severity**: [1/2/3/4]
**Status**: [Investigating/Identified/Monitoring/Resolved]
**Impact**: [Current user impact]
**Actions Taken**: [List of actions]
**Next Steps**: [Planned next steps]
**ETA**: [Estimated resolution time]
```

**Channels**:
- `#incidents` Slack channel
- Email to leadership
- Status page updates

#### External Communication

**User Notifications**:

1. **Status Page** (https://status.vocavision.com):
```markdown
🔴 Service Disruption - Learning Features
Posted: Jan 21, 2024 10:45 AM UTC

We're currently experiencing issues with our learning features.
Users may be unable to save progress or complete lessons.

Our team is actively working to resolve this issue.
We'll provide updates every 30 minutes.

Next update: 11:15 AM UTC
```

2. **In-App Banner**:
```typescript
showBanner({
  type: 'warning',
  message: 'We are currently experiencing technical difficulties. Our team is working to resolve the issue.',
  dismissible: false
});
```

3. **Email Notification** (Severity 1 & 2 only):
```html
Subject: [Resolved] VocaVision Service Disruption

Dear VocaVision Users,

We experienced a service disruption today from 10:30 AM - 11:45 AM UTC.
During this time, learning features were unavailable.

The issue has been resolved and all services are now operational.

We sincerely apologize for the inconvenience.

If you continue to experience issues, please contact support@vocavision.com

Thank you for your patience.
- The VocaVision Team
```

4. **Social Media** (Severity 1 only):
```
We're aware of technical issues affecting VocaVision.
Our team is working to restore service.
Updates: https://status.vocavision.com
```

### Phase 5: Resolution & Closure (After fix deployed)

#### 1. Confirm Full Resolution

**Final Verification**:
- [ ] All systems operational for 30+ minutes
- [ ] Error rates normal
- [ ] Performance metrics normal
- [ ] No user complaints
- [ ] Monitoring alerts clear

#### 2. Close Incident

```markdown
## Incident Closure
**Incident ID**: INC-2024-01-21-001
**Severity**: 2 (High)
**Start Time**: 2024-01-21 10:30 UTC
**End Time**: 2024-01-21 11:45 UTC
**Duration**: 1 hour 15 minutes
**Root Cause**: Database connection pool exhaustion
**Resolution**: Increased connection pool size from 20 to 50
**Status**: Resolved

**Impact**:
- 5,000 users affected
- Learning progress not saved
- No data loss

**Actions Taken**:
1. Identified connection pool exhaustion in logs
2. Increased pool size via environment variable
3. Restarted application
4. Verified all systems operational
5. Monitored for 30 minutes

**Follow-up Actions**:
- [ ] Schedule post-incident review (PIR)
- [ ] Create tickets for preventive measures
- [ ] Update runbooks with learnings
- [ ] Update monitoring alerts
```

#### 3. Notify Stakeholders

**Resolution Message**:
```markdown
## 🟢 INCIDENT RESOLVED

**Incident ID**: INC-2024-01-21-001
**Duration**: 1 hour 15 minutes
**Resolution Time**: 2024-01-21 11:45 UTC

**Summary**: Database connection pool exhaustion caused learning features to be unavailable. Issue resolved by increasing pool size.

**User Impact**: 5,000 users experienced inability to save progress. No data was lost.

**Next Steps**: Post-incident review scheduled for tomorrow at 2 PM.

Thank you to everyone who helped resolve this incident quickly!
```

---

## Incident Types & Runbooks

### 1. Website Down

**Symptoms**:
- 502/503 errors
- Timeout errors
- Users cannot access site

**Diagnosis**:
```bash
# Check if site is accessible
curl -I https://vocavision.com

# Check Vercel status
vercel status

# Check DNS
nslookup vocavision.com

# Check SSL certificate
echo | openssl s_client -connect vocavision.com:443 2>/dev/null | openssl x509 -noout -dates
```

**Resolution Steps**:
1. Check Vercel deployment status
2. Check for failed deployments
3. Rollback to last known good deployment
4. If DNS issue, check domain registrar
5. If SSL issue, renew certificate

**Prevention**:
- Set up uptime monitoring
- Configure deployment health checks
- Automate SSL renewal

---

### 2. Database Connection Issues

**Symptoms**:
- "Too many connections" errors
- Timeout connecting to database
- Slow query performance

**Diagnosis**:
```bash
# Check database connections
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"

# Check connection pool status
psql $DATABASE_URL -c "SELECT * FROM pg_stat_activity WHERE state = 'active';"

# Check for long-running queries
psql $DATABASE_URL -c "SELECT pid, query, state, query_start FROM pg_stat_activity WHERE state != 'idle' ORDER BY query_start;"
```

**Resolution Steps**:
1. Identify connection leaks in application
2. Increase connection pool size (temporary)
3. Kill long-running queries if necessary
4. Restart application to reset connections
5. Implement connection pooling if not present

**Prevention**:
- Set max connection pool size
- Implement connection timeout
- Monitor connection usage
- Use PgBouncer for connection pooling

---

### 3. API Performance Degradation

**Symptoms**:
- Slow response times (>2s)
- Timeout errors
- High CPU/memory usage

**Diagnosis**:
```bash
# Check API response times
curl -w "@curl-format.txt" -o /dev/null -s https://api.vocavision.com/api/v1/words

# curl-format.txt content:
# time_namelookup:  %{time_namelookup}\n
# time_connect:  %{time_connect}\n
# time_total:  %{time_total}\n

# Check APM metrics
# Visit: APM dashboard

# Check slow queries
# Visit: Database monitoring

# Check error logs
vercel logs --since 1h
```

**Resolution Steps**:
1. Identify slow endpoints
2. Check for N+1 query problems
3. Add database indexes if missing
4. Implement caching for hot paths
5. Scale up resources if needed

**Prevention**:
- Set up performance monitoring
- Implement query optimization
- Add caching layer
- Use database query analyzer

---

### 4. Authentication Failures

**Symptoms**:
- Users cannot log in
- Token validation failures
- Session expiry issues

**Diagnosis**:
```bash
# Test authentication endpoint
curl -X POST https://api.vocavision.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Check JWT secret configuration
# Verify environment variables

# Check session storage (Redis)
redis-cli PING
```

**Resolution Steps**:
1. Verify JWT secret is configured
2. Check token expiry settings
3. Verify Redis is accessible
4. Check for clock skew issues
5. Clear session cache if corrupted

**Prevention**:
- Monitor authentication success rate
- Set up alerts for auth failures
- Implement token rotation
- Use secure secret management

---

### 5. Data Inconsistency

**Symptoms**:
- Missing user data
- Incorrect calculations
- Duplicate records

**Diagnosis**:
```bash
# Check data integrity
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users WHERE email IS NULL;"

# Check for orphaned records
psql $DATABASE_URL -c "SELECT * FROM user_progress WHERE user_id NOT IN (SELECT id FROM users);"

# Check recent migrations
psql $DATABASE_URL -c "SELECT * FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 10;"
```

**Resolution Steps**:
1. Identify affected records
2. Determine root cause (migration, bug, etc.)
3. Create data fix script
4. Test script on staging
5. Apply fix to production
6. Verify data integrity

**Prevention**:
- Add database constraints
- Implement data validation
- Test migrations thoroughly
- Use database transactions

---

### 6. Security Incident

**Symptoms**:
- Unusual API traffic
- Unauthorized access
- Data breach alert
- DDoS attack

**⚠️ CRITICAL: DO NOT SKIP ANY STEPS**

**Immediate Actions**:
1. **Isolate**: Disable affected accounts/endpoints
2. **Preserve**: Take logs/database snapshots
3. **Assess**: Determine scope of breach
4. **Contain**: Block malicious IPs/users
5. **Notify**: Alert security team immediately

**Diagnosis**:
```bash
# Check for unusual traffic
# Review access logs

# Check for unauthorized access
psql $DATABASE_URL -c "SELECT * FROM auth_logs WHERE success = false ORDER BY created_at DESC LIMIT 100;"

# Check for data exfiltration
# Review database query logs
```

**Resolution Steps**:
1. Block malicious traffic
2. Rotate all secrets and tokens
3. Force password reset for affected users
4. Apply security patches
5. Conduct full security audit

**Required Notifications**:
- Security team: Immediately
- Legal team: Within 1 hour
- Users: Within 24-72 hours (per GDPR)
- Authorities: As required by law

**Prevention**:
- Implement rate limiting
- Use DDoS protection
- Enable 2FA
- Conduct security audits
- Implement intrusion detection

---

## Communication Protocol

### Internal Communication

**Slack Channels**:
- `#incidents` - Active incident coordination
- `#incidents-alerts` - Automated alerts
- `#engineering` - Engineering team
- `#support` - Support team updates

**Email Distribution Lists**:
- `engineering@vocavision.com` - All engineers
- `leadership@vocavision.com` - Leadership team
- `oncall@vocavision.com` - On-call rotation

### External Communication

**Channels**:
1. **Status Page**: https://status.vocavision.com
2. **In-App Notifications**: Banner/modal
3. **Email**: support@vocavision.com
4. **Social Media**: @vocavision (Twitter/X)

**Response Templates**:

**Investigating**:
```
We're investigating reports of [issue description].
Our team is actively working to identify the cause.
Updates will be provided every 30 minutes.
```

**Identified**:
```
We've identified the cause of [issue description].
Our team is implementing a fix.
Expected resolution time: [ETA].
```

**Monitoring**:
```
A fix has been applied for [issue description].
We're monitoring the situation to ensure stability.
Services should be fully restored.
```

**Resolved**:
```
The issue affecting [feature/service] has been fully resolved.
All systems are now operational.
We apologize for the inconvenience.
```

---

## Post-Incident Review (PIR)

### Timing

Schedule within **24-48 hours** of incident resolution while details are fresh.

### Attendees

- Incident Commander
- Technical Lead
- All responders
- Engineering Manager
- Product Manager (if user-facing)

### Agenda

1. **Timeline Review** (10 min)
   - What happened and when
   - Key decision points

2. **Root Cause Analysis** (15 min)
   - 5 Whys analysis
   - Contributing factors

3. **Response Evaluation** (10 min)
   - What went well
   - What could improve

4. **Action Items** (15 min)
   - Preventive measures
   - Process improvements
   - Technical debt

5. **Documentation** (10 min)
   - Update runbooks
   - Share learnings

### PIR Template

```markdown
# Post-Incident Review: [Incident Title]

**Date**: YYYY-MM-DD
**Incident ID**: INC-YYYY-MM-DD-###
**Severity**: [1/2/3/4]
**Duration**: [Duration]
**Attendees**: [Names]

## Executive Summary

Brief description of incident, impact, and resolution.

## Timeline

| Time (UTC) | Event |
|------------|-------|
| 10:30 | Incident detected |
| 10:35 | Incident declared |
| 10:40 | Root cause identified |
| 11:00 | Fix deployed |
| 11:15 | Incident resolved |

## Root Cause

### 5 Whys Analysis

1. Why did the service fail?
   - Connection pool exhausted

2. Why was the connection pool exhausted?
   - Too many concurrent requests

3. Why were there too many concurrent requests?
   - Viral social media post drove traffic spike

4. Why couldn't the system handle the spike?
   - Auto-scaling not configured properly

5. Why was auto-scaling not configured?
   - Not anticipated in initial deployment

### Contributing Factors

- Insufficient load testing
- No auto-scaling configuration
- Inadequate monitoring alerts

## Impact Assessment

- **Users Affected**: 5,000
- **Duration**: 1 hour 15 minutes
- **Revenue Impact**: ~$500 (estimated)
- **Reputation Impact**: Medium
- **Data Loss**: None

## What Went Well

- Quick detection (<5 minutes)
- Clear communication
- Effective coordination
- Fast resolution (75 minutes)

## What Could Be Improved

- Monitoring alerts didn't trigger early enough
- Runbook for connection issues was outdated
- Auto-scaling not configured

## Action Items

| Action | Owner | Priority | Due Date |
|--------|-------|----------|----------|
| Configure auto-scaling | DevOps | High | 2024-01-23 |
| Update monitoring alerts | SRE | High | 2024-01-24 |
| Conduct load testing | QA | Medium | 2024-01-30 |
| Update runbook | Eng | Low | 2024-01-25 |

## Lessons Learned

1. Auto-scaling is critical for handling traffic spikes
2. Load testing should include worst-case scenarios
3. Monitoring alerts need tuning
4. Runbooks require regular updates

## Follow-up

PIR document shared: [Link]
Action items tracked: [Jira/GitHub]
Runbook updated: [Link]
```

---

## Escalation Matrix

### Level 1: On-Call Engineer

**Responsibility**: First responder
**Escalates to**: Level 2 after 30 minutes (Sev 1) or 2 hours (Sev 2)

**Contact**:
- PagerDuty: https://vocavision.pagerduty.com
- Slack: @oncall
- Phone: (Automated via PagerDuty)

### Level 2: Team Lead / Senior Engineer

**Responsibility**: Technical expertise, decision making
**Escalates to**: Level 3 after 1 hour (Sev 1) or 4 hours (Sev 2)

**Contact**:
- Email: teamlead@vocavision.com
- Slack: @teamlead
- Phone: +1-555-0102

### Level 3: Engineering Manager

**Responsibility**: Resource allocation, stakeholder communication
**Escalates to**: Level 4 after 2 hours (Sev 1)

**Contact**:
- Email: engmanager@vocavision.com
- Slack: @engmanager
- Phone: +1-555-0103

### Level 4: VP Engineering / CTO

**Responsibility**: Executive decisions, external communication
**Escalates to**: CEO for critical incidents

**Contact**:
- Email: vp-eng@vocavision.com
- Slack: @vp-eng
- Phone: +1-555-0104

### Escalation Criteria

**Automatic Escalation Triggers**:
- Severity 1 incident exceeds 1 hour
- Severity 2 incident exceeds 4 hours
- Data breach or security incident
- Legal or compliance implications
- Media attention

---

## Tools & Resources

### Monitoring & Alerts

- **Sentry**: https://sentry.io/organizations/vocavision
- **Vercel Analytics**: https://vercel.com/vocavision/analytics
- **Google Analytics**: https://analytics.google.com
- **Status Page**: https://status.vocavision.com

### Infrastructure

- **Vercel Dashboard**: https://vercel.com/vocavision
- **Database Console**: [Database provider]
- **Redis Console**: [Redis provider]

### Communication

- **Slack**: https://vocavision.slack.com
- **PagerDuty**: https://vocavision.pagerduty.com
- **Email**: oncall@vocavision.com

### Documentation

- **Runbooks**: `/docs/runbooks/`
- **Architecture Docs**: `ARCHITECTURE.md`
- **API Docs**: `API_REFERENCE.md`
- **CI/CD Docs**: `CI_CD.md`

### Incident Management

- **Incident Log**: [Google Sheets/Notion]
- **PIR Archive**: [Confluence/GitHub]
- **Action Item Tracker**: [Jira/GitHub Issues]

---

## Emergency Contacts

| Role | Name | Phone | Email |
|------|------|-------|-------|
| On-Call Engineer | (Rotation) | PagerDuty | oncall@vocavision.com |
| Team Lead | Jane Doe | +1-555-0102 | jane@vocavision.com |
| Engineering Manager | John Smith | +1-555-0103 | john@vocavision.com |
| VP Engineering | Alice Johnson | +1-555-0104 | alice@vocavision.com |
| CTO | Bob Williams | +1-555-0105 | bob@vocavision.com |
| Security Team | - | +1-555-0199 | security@vocavision.com |

---

## Appendix

### Incident Severity Decision Tree

```
Is the entire service down?
├─ Yes → Severity 1
└─ No → Is a critical feature unavailable?
    ├─ Yes → Is there a workaround?
    │   ├─ Yes → Severity 3
    │   └─ No → Severity 2
    └─ No → Is it affecting user experience?
        ├─ Yes → Severity 3
        └─ No → Severity 4
```

### Quick Command Reference

```bash
# Health check
curl https://api.vocavision.com/health

# Database status
psql $DATABASE_URL -c "SELECT version();"

# Redis status
redis-cli PING

# Deployment rollback
vercel rollback [url]

# View logs
vercel logs --follow

# Check error rate
# Visit Sentry dashboard
```

---

**Document Version**: 1.0.0
**Last Reviewed**: 2024-01-21
**Next Review**: 2024-04-21
**Maintained By**: DevOps Team
**Approval**: VP Engineering

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2024-01-21 | DevOps Team | Initial version |

---

**For questions or suggestions, contact**: devops@vocavision.com
