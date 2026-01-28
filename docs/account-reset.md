# 🔄 VocaVision AI 사용자 계정 초기화 가이드

> 최종 업데이트: 2026-01-28

## 📌 개요

테스트 또는 사용자 요청에 따라 학습 데이터를 초기화할 때 사용하는 SQL 스크립트입니다.

---

## 1️⃣ 전체 초기화 (학습 데이터 완전 삭제)

### 사용 시나리오
- 테스트 계정 초기화
- 사용자 요청에 의한 완전 리셋
- 버그 수정 후 재테스트

### SQL 스크립트

```sql
-- 1. UserProgress 삭제 (학습 진행 상황)
DELETE FROM "UserProgress"
WHERE "userId" = '[USER_ID]';

-- 2. LearningSession 삭제 (학습 세션 기록)
DELETE FROM "LearningSession"
WHERE "userId" = '[USER_ID]';

-- 3. User 통계 리셋
UPDATE "User"
SET
  "totalWordsLearned" = 0,
  "currentStreak" = 0,
  "dailyProgress" = 0,
  "lastActiveDate" = NULL
WHERE id = '[USER_ID]';
```

### 예시 (특정 사용자)

```sql
-- 도현 계정 초기화
DELETE FROM "UserProgress" WHERE "userId" = '01766ce3-d27a-484a-812d-3c1ae4e2f063';
DELETE FROM "LearningSession" WHERE "userId" = '01766ce3-d27a-484a-812d-3c1ae4e2f063';

UPDATE "User"
SET "totalWordsLearned" = 0, "currentStreak" = 0, "dailyProgress" = 0
WHERE id = '01766ce3-d27a-484a-812d-3c1ae4e2f063';
```

---

## 2️⃣ 특정 시험/레벨만 초기화

### 사용 시나리오
- 특정 레벨만 재학습
- 시험 변경 후 이전 데이터 삭제

### SQL 스크립트

```sql
-- 특정 시험의 특정 레벨만 삭제
DELETE FROM "UserProgress"
WHERE "userId" = '[USER_ID]'
  AND "examCategory" = '[EXAM_CATEGORY]'
  AND "level" = '[LEVEL]';
```

### 예시

```sql
-- 수능 L1만 초기화
DELETE FROM "UserProgress"
WHERE "userId" = '01766ce3-d27a-484a-812d-3c1ae4e2f063'
  AND "examCategory" = 'CSAT'
  AND "level" = 'L1';

-- TEPS 전체 초기화
DELETE FROM "UserProgress"
WHERE "userId" = '01766ce3-d27a-484a-812d-3c1ae4e2f063'
  AND "examCategory" = 'TEPS';
```

---

## 3️⃣ 복습 데이터만 초기화 (학습 유지)

### 사용 시나리오
- 복습 진행만 리셋
- 학습 기록은 유지하되 복습 재시작

### SQL 스크립트

```sql
-- 복습 관련 필드만 리셋
UPDATE "UserProgress"
SET
  "correctCount" = 0,
  "incorrectCount" = 0,
  "needsReview" = CASE WHEN "initialRating" <= 2 THEN true ELSE false END,
  "nextReviewDate" = CASE
    WHEN "initialRating" <= 2 THEN NOW()
    ELSE NOW() + INTERVAL '3 days'
  END,
  "totalReviews" = 1
WHERE "userId" = '[USER_ID]';
```

---

## 4️⃣ 잘못된 데이터 수정

### 4.1 correctCount >= 2인데 needsReview = true인 경우

```sql
-- 복습 완료 조건 충족했지만 needsReview가 잘못된 경우 수정
UPDATE "UserProgress"
SET "needsReview" = false
WHERE "correctCount" >= 2
  AND "needsReview" = true;
```

### 4.2 특정 사용자의 잘못된 데이터 수정

```sql
UPDATE "UserProgress"
SET "needsReview" = false
WHERE "userId" = '[USER_ID]'
  AND "correctCount" >= 2;
```

---

## 5️⃣ 데이터 확인 쿼리

### 5.1 사용자 학습 현황 확인

```sql
SELECT
  "examCategory",
  "level",
  COUNT(*) as total_words,
  SUM(CASE WHEN "initialRating" = 1 THEN 1 ELSE 0 END) as dont_know,
  SUM(CASE WHEN "initialRating" = 5 THEN 1 ELSE 0 END) as know,
  SUM(CASE WHEN "needsReview" = true THEN 1 ELSE 0 END) as needs_review,
  SUM(CASE WHEN "correctCount" >= 2 THEN 1 ELSE 0 END) as review_complete
FROM "UserProgress"
WHERE "userId" = '[USER_ID]'
GROUP BY "examCategory", "level"
ORDER BY "examCategory", "level";
```

### 5.2 복습 대기 상세 확인

```sql
SELECT
  "initialRating",
  "correctCount",
  "totalReviews",
  "needsReview",
  DATE("nextReviewDate") as next_review,
  COUNT(*) as count
FROM "UserProgress"
WHERE "userId" = '[USER_ID]'
GROUP BY "initialRating", "correctCount", "totalReviews", "needsReview", DATE("nextReviewDate")
ORDER BY "initialRating", "correctCount";
```

### 5.3 오늘 복습 대기 확인

```sql
SELECT COUNT(*) as due_today
FROM "UserProgress"
WHERE "userId" = '[USER_ID]'
  AND "correctCount" < 2
  AND "nextReviewDate" <= NOW();
```

### 5.4 복습 일정 확인 (오늘/내일/이번 주)

```sql
SELECT
  CASE
    WHEN DATE("nextReviewDate") = CURRENT_DATE THEN '오늘'
    WHEN DATE("nextReviewDate") = CURRENT_DATE + 1 THEN '내일'
    WHEN DATE("nextReviewDate") <= CURRENT_DATE + 7 THEN '이번 주'
    ELSE '이후'
  END as schedule,
  COUNT(*) as count
FROM "UserProgress"
WHERE "userId" = '[USER_ID]'
  AND "correctCount" < 2
GROUP BY
  CASE
    WHEN DATE("nextReviewDate") = CURRENT_DATE THEN '오늘'
    WHEN DATE("nextReviewDate") = CURRENT_DATE + 1 THEN '내일'
    WHEN DATE("nextReviewDate") <= CURRENT_DATE + 7 THEN '이번 주'
    ELSE '이후'
  END;
```

---

## 6️⃣ 주의사항

### ⚠️ 삭제 전 백업

```sql
-- 삭제 전 데이터 백업 (SELECT로 확인)
SELECT * FROM "UserProgress" WHERE "userId" = '[USER_ID]';
SELECT * FROM "LearningSession" WHERE "userId" = '[USER_ID]';
```

### ⚠️ 프로덕션 환경 주의

- 프로덕션에서는 반드시 `WHERE` 조건 확인
- 가능하면 트랜잭션 사용

```sql
BEGIN;
DELETE FROM "UserProgress" WHERE "userId" = '[USER_ID]';
-- 확인 후 COMMIT 또는 ROLLBACK
COMMIT;
```

### ⚠️ 관련 테이블

| 테이블 | 설명 | 초기화 필요 |
|--------|------|------------|
| UserProgress | 단어별 학습 진행 | ✅ 필수 |
| LearningSession | 학습 세션 기록 | ✅ 권장 |
| User | 사용자 통계 | ✅ 권장 |
| Bookmark | 북마크 | ⚠️ 선택 |

---

## 7️⃣ 자주 사용하는 User ID

| 사용자 | User ID |
|--------|---------|
| 도현 (테스트) | 01766ce3-d27a-484a-812d-3c1ae4e2f063 |

---

## 8️⃣ 초기화 후 확인 체크리스트

```
□ UserProgress 삭제 확인
□ LearningSession 삭제 확인
□ User 통계 리셋 확인
□ 대시보드 → 학습 데이터 0으로 표시
□ 복습 페이지 → 복습 대기 0개
□ 통계 페이지 → 모든 수치 0
```
