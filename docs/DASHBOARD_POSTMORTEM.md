# VocaVision AI — Dashboard learnedWords Bug Postmortem

Written: 2026-03-13
Duration: ~2 days (3/12 ~ 3/13)
Purpose: Prevent recurrence — resolve same-type bugs in 30min instead of 8hrs

## 1. Summary

**Symptom:** After learning, clicking "Exit" shows learnedWords = 0 on dashboard. Refresh shows correct value.

**Root cause:** Not a single bug — 7 independent bugs producing identical symptoms. Fixing one left others maintaining the same symptom → "fixed but still broken" loop.

## 2. Bug Map

```
Symptom: "Dashboard numbers don't update after learning"
        │
        ├─ [BUG-1] Backend appCache (30s TTL)
        │    → Server returns stale value
        │
        ├─ [BUG-2] HTTP Cache-Control: private, no-cache
        │    → Browser returns 304, stale response used
        │
        ├─ [BUG-3] React Query: invalidateQueries only
        │    → Marks stale but doesn't force refetch before mount
        │
        ├─ [BUG-4] Railway build environment
        │    → Root Directory unset → Dockerfile ignored → Railpack fallback
        │    → Deploy fails silently → fixes never applied
        │
        ├─ [BUG-5] DB aggregation error (THEME_ levels)
        │    → Queries level='THEME_RELATIONS' but UserProgress stores 'L1'
        │
        ├─ [BUG-6] Frontend calculation formula
        │    → IN_PROGRESS session value overwrites DB truth
        │    → No restart/resume distinction
        │
        └─ [BUG-7] updateSessionProgress fire-and-forget
             → DB not updated when dashboard fetch executes
```

## 3. Bug Details

### BUG-1: Backend appCache

**File:** `backend/src/controllers/progress.controller.ts`

```typescript
// PROBLEM: cached entire response including dynamic learnedCount
const cacheKey = `dashboard:${userId}:${exam}:${level}`;
const cached = appCache.get(cacheKey);
if (cached) return cached; // 30s TTL — returns stale after learning

// FIX: only cache static data (wordCount), never dynamic (learnedCount)
const wordCount = appCache.get(`wordCount:${exam}:${level}`)
   ?? await prisma.word.count({ where: { ... } });
const learnedCount = await prisma.userProgress.count({ where: { userId, ... } }); // always fresh
```

**Diagnosis:** Railway logs — same request with <5ms response time = cache hit.

### BUG-2: HTTP Cache-Control

**File:** `backend/src/controllers/progress.controller.ts`

| Header | Stores | Reuses | 304 possible |
|--------|--------|--------|-------------|
| no-cache | YES | After revalidation | YES ← problem |
| no-store | NO | NO | NO |

```typescript
// FIX
res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
res.setHeader('Pragma', 'no-cache');
```

**Diagnosis:** Chrome DevTools Network → Status column shows 304.

### BUG-3: React Query invalidateQueries vs removeQueries

```typescript
// PROBLEM: invalidate = mark stale, show old data first, refetch in background
queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
router.push('/dashboard');
// → User sees stale data momentarily

// FIX: remove = delete cache, force fresh fetch on mount
queryClient.removeQueries({ queryKey: ['dashboardSummary'] });
router.push('/dashboard');
```

**Rule:**
- Same page refresh: `invalidateQueries`
- Before page navigation: `removeQueries`

### BUG-4: Railway Build (Dockerfile ignored)

```
Railway service Root Directory: (empty)
  ↓
Metal build reads backend/railway.json
  ↓
dockerfilePath: "Dockerfile" or "backend/Dockerfile"
  ↓
[ERROR] skipping 'Dockerfile' — not rooted at valid path
        (root_dir=, acceptChildOfRepoRoot:false)
  ↓
Dockerfile ignored → Railpack fallback → "No start command" → build fails
```

**Fix:** Railway Console → Backend service → Settings → Source → Root Directory: `backend`

### BUG-5: THEME_ Level DB Aggregation

VocaVision architecture:
- `Word.tags[]` = `['THEME_RELATIONS']` (theme classification)
- `WordExamLevel.level` = `'L1'` (actual difficulty)
- `UserProgress.level` = `'L1'` (stored at learning time)

```typescript
// PROBLEM: WHERE level = 'THEME_RELATIONS' → 0 matches

// FIX: wordId-based aggregation
if (isThematic) {
  const wordIds = await prisma.word.findMany({
    where: { tags: { has: level }, examLevels: { some: { examCategory } }, isActive: true },
    select: { id: true },
  }).then(words => words.map(w => w.id));

  learnedCount = await prisma.userProgress.count({
    where: { userId, wordId: { in: wordIds } }, // no level condition!
  });
}
```

### BUG-6: Frontend learnedWords Calculation

**Evolution of failed fixes:**

1. Original: IN_PROGRESS → session only (ignores DB=68, shows session=45)
2. Fix attempt: `Math.max(session, db)` → breaks restart (shows 78 instead of 5)
3. Fix attempt: THEME_ special branch → breaks resume (shows 5 instead of 78)

**Final solution — isRestart explicit field:**

```typescript
// schema.prisma
model LearningSession {
  isRestart  Boolean  @default(false)
}

// dashboard/page.tsx
const learnedWords = !learningSession
  ? examLevelLearnedWords                                    // no session: DB value
  : learningSession.isRestart
    ? sessionLearnedWords                                    // restart: session progress (0→5)
    : Math.max(sessionLearnedWords, examLevelLearnedWords);  // resume: cumulative (78→78)
```

**Key insight:** The correct abstraction is user intent (restart vs resume), not session status or level type.

### BUG-7: updateSessionProgress fire-and-forget

```typescript
// PROBLEM: no await → DB not written when dashboard fetches
const handleExit = async () => {
  await flushPendingReviews();      // ✅
  updateSessionProgress();           // ❌ fire-and-forget
  removeQueries(...);
  router.push('/dashboard');         // dashboard fetch → totalReviewed=0
};

// FIX
await updateSessionProgress();       // ✅ await added
```

**Rule:** All DB writes must complete (await) before `router.push`.

## 4. P2002 Race Condition (Additional Fix)

**File:** `backend/src/services/progress.service.ts`

When users flip cards quickly, concurrent upserts on same `(userId, wordId)` cause P2002.

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

Use `findFirst` not `findUnique` (composite key safety).

## 5. Diagnostic Decision Tree

```
"Dashboard numbers don't update after learning"
                │
                ▼
    F12 → Network → dashboard-summary
    Response Status?
                │
        ┌───────┴───────┐
       304             200
        │               │
        ▼               ▼
   HTTP cache      Response Preview:
   BUG-2           learnedWords value?
   add no-store         │
                  ┌──────┴──────┐
                 Wrong         Correct
                  │              │
                  ▼              ▼
              Server issue   Frontend calc
                  │           BUG-6
            ┌─────┤       check isRestart
     No response  Wrong value
            │       │
            ▼       ▼
        Timing    appCache or
        issue     DB aggregation
        BUG-7     │
        check     ├─ THEME_ level?
        await     │  YES → BUG-5 wordId aggregation
                  │
                  └─ Railway logs
                     X/Y reviews processed?
                     X < Y → P2002
```

## 6. 30-Minute Resolution Routine

| Step | Time | Action |
|------|------|--------|
| 1 | 5min | Verify Railway deploy success ("Server running on port 8080") |
| 2 | 5min | F12 → Network → dashboard-summary → identify layer |
| 3 | 5min | Railway logs → check review processing, API timing |
| 4 | 15min | Fix identified layer → deploy → verify |

## 7. Why This Took 8+ Hours

1. **7 independent bugs with identical symptoms** — fixing one left others producing same result
2. **Diagnostic tools not used early** — F12 Network tab would have separated server/frontend in 2 minutes
3. **Deploy failure discovered late (BUG-4)** — debugging against undeployed code
4. **THEME_ architecture understood late** — "tag-based classification, level-based storage" not documented
5. **restart/resume abstraction delayed** — 3 wrong fixes before recognizing user intent as the right abstraction level

## 8. Complete Fix List

| # | File | Change |
|---|------|--------|
| 1 | progress.controller.ts | Remove learnedCount from appCache |
| 2 | progress.controller.ts | Cache-Control: no-store |
| 3 | learn/page.tsx | invalidateQueries → removeQueries |
| 4 | backend/railway.json | dockerfilePath: "Dockerfile" (Root-relative) |
| 5 | Railway Console | Root Directory: backend |
| 6 | progress.controller.ts | THEME_ isThematic + wordId aggregation |
| 7 | schema.prisma | LearningSession.isRestart column |
| 8 | learning.controller.ts | isRestart: restart===true on create |
| 9 | dashboard/page.tsx | isRestart-based learnedWords branch |
| 10 | learn/page.tsx | await updateSessionProgress |
| 11 | progress.service.ts | P2002 catch + findFirst fallback |
