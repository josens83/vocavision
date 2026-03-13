# VocaVision AI — Claude Code Guidelines

## Architecture Rules (from Dashboard Bug Postmortem 2026-03-13)

Full postmortem: `docs/DASHBOARD_POSTMORTEM.md`

### 1. Cache Strategy

**Backend appCache:**
- Static data (wordCount, word lists) → TTL cache OK
- Dynamic data (learnedCount, progress) → NEVER cache, always query DB directly

**HTTP Headers for user progress endpoints:**
```
Cache-Control: no-cache, no-store, must-revalidate
Pragma: no-cache
```

**React Query — page navigation vs same-page refresh:**
- Before `router.push()`: use `removeQueries` (delete cache completely)
- Same-page refresh: use `invalidateQueries` (stale + background refetch)

### 2. Exit/Complete Handler — Required Order

```typescript
const handleExit = async () => {
  await flushPendingReviews();        // 1. await REQUIRED
  await updateSessionProgress();      // 2. await REQUIRED
  queryClient.removeQueries({         // 3. before router.push
    queryKey: ['dashboardSummary']
  });
  router.push('/dashboard');          // 4. last
};
```

Never fire-and-forget DB writes before navigation.

### 3. THEME_ Level Aggregation

THEME_ learning stores `UserProgress.level = 'L1'` (actual word level), NOT `'THEME_RELATIONS'`.
- Always use `wordId IN (theme word list)` for aggregation
- Never use `level = 'THEME_...'` string matching
- Apply `isThematic` branch in all aggregation queries

### 4. Session Mode: restart vs resume

```typescript
const learnedWords = !learningSession
  ? examLevelLearnedWords                                    // no session: DB value
  : learningSession.isRestart
    ? sessionLearnedWords                                    // restart: session progress (0→5)
    : Math.max(sessionLearnedWords, examLevelLearnedWords);  // resume: cumulative (78→78)
```

- Use `isRestart` field, NOT `status` (IN_PROGRESS/COMPLETED)
- restart and resume have same status but different UX intent

### 5. Upsert Race Condition

All concurrent upserts must catch P2002:
```typescript
try {
  await prisma.model.upsert(...)
} catch (e) {
  if (e?.code === 'P2002') {
    const existing = await prisma.model.findFirst({ where: { ... } });
    if (!existing) throw e;
    record = existing;
  } else throw e;
}
```
Use `findFirst`, not `findUnique` (composite key safety).

### 6. Railway Monorepo Deployment

- Always set Root Directory per service (e.g., `backend`)
- `dockerfilePath` in railway.json is relative to Root Directory
- Verify build log shows `using build driver dockerfile`, not `railpack`

### 7. Diagnostic Decision Tree

When "dashboard numbers don't update after learning":
1. Check Railway deploy status first
2. F12 → Network → dashboard-summary → Preview → check `learnedWords` value
   - 304 status → HTTP cache issue (add no-store)
   - Value correct in response but wrong in UI → frontend calculation (isRestart branch)
   - Value wrong in response → server issue (appCache or DB aggregation)
   - Response too fast (<5ms) → server cache hit
3. Railway logs: "X/Y reviews processed" where X < Y → P2002 race condition
