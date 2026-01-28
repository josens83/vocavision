# VocaVision AI 복습 시스템 명세서

## 개요

VocaVision AI는 과학적으로 검증된 간격 반복 학습(Spaced Repetition)을 기반으로
한국 학생들의 영어 단어 암기 효율을 극대화하는 플랫폼입니다.

---

## 1. 학습 플로우 (플래시카드)

### 1.1 2버튼 시스템

| 버튼 | Rating | 의미 | 동작 |
|------|--------|------|------|
| 모름 | 1 | 단어를 모름 | 당일 복습 대기 |
| 알았음 | 5 | 단어를 앎 | D+3에 복습 대기 |

> 기존 3버튼(모름/애매함/알았음)에서 2버튼으로 단순화됨 (2026-01-27)

### 1.2 플래시카드 완료 시 DB 업데이트

```typescript
// 새 단어 학습 시 (UserProgress 생성)
{
  userId,
  wordId,
  examCategory,
  level,
  initialRating: rating,           // 첫 선택 저장 (1 또는 5)
  learnedAt: new Date(),           // 첫 학습 시간
  lastReviewDate: new Date(),
  nextReviewDate: rating <= 2
    ? new Date()                   // 모름 → 오늘
    : addDays(new Date(), 3),      // 알았음 → D+3
  needsReview: rating <= 2,        // 모름만 즉시 복습 필요
  totalReviews: 1,
  correctCount: 0,                 // 플래시카드에서는 증가 안 함
  incorrectCount: 0,
}

// 같은 단어 재선택 시 (이전으로 돌아가서 변경)
update: {
  initialRating: rating,           // 최신 선택으로 업데이트
  nextReviewDate: rating <= 2
    ? new Date()
    : addDays(new Date(), 3),
  needsReview: rating <= 2,
}
```

### 1.3 플래시카드 학습 Set 구성

- 1 Set = 20개 단어
- Set 완료 조건: 20개 단어 모두 "모름" 또는 "알았음" 선택
- Set 내에서 이전 단어로 돌아가 재선택 가능

---

## 2. 복습 플로우 (4지선다 퀴즈)

### 2.1 복습 대기 조건

```typescript
// 복습 대기 단어 조회 조건
where: {
  userId,
  examCategory,
  level,
  needsReview: true,                    // correctCount < 2
  nextReviewDate: { lte: new Date() },  // 오늘 또는 이전 날짜
}
```

### 2.2 복습 퀴즈 결과 처리

```typescript
// 퀴즈 정답 시
if (isCorrect) {
  correctCount += 1;                    // QUIZ에서만 증가
  nextReviewDate = addDays(new Date(), 1);  // D+1

  if (correctCount >= 2) {
    needsReview = false;                // 복습 완료!
  }
}

// 퀴즈 오답 시
if (!isCorrect) {
  incorrectCount += 1;                  // QUIZ에서만 증가
  nextReviewDate = new Date();          // 오늘 (바로 재복습)
}

// 공통
totalReviews += 1;
lastReviewDate = new Date();
```

### 2.3 복습 완료 조건

```
correctCount >= 2  →  needsReview = false  →  복습 목록에서 제외
```

### 2.4 복습 퀴즈 문제 수

| 복습 대기 | 퀴즈 문제 수 | 진행률 표시 |
|----------|------------|------------|
| 3개 | 3문제 | 1/3 ~ 3/3 |
| 5개 | 5문제 | 1/5 ~ 5/5 |
| 10개 | 10문제 | 1/10 ~ 10/10 |
| 15개 | 10문제 (최대) | 1/10 ~ 10/10 |

---

## 3. 복습 스케줄 요약

### 3.1 "모름" 선택 시 복습 스케줄

```
D+0 (학습일): 플래시카드 "모름" 선택
    ↓
D+0: 복습 대기 (nextReviewDate = 오늘)
    ↓ 퀴즈 정답
D+1: 복습 대기 (nextReviewDate = D+1)
    ↓ 퀴즈 정답
D+2: 복습 완료 (correctCount = 2, needsReview = false)
```

### 3.2 "알았음" 선택 시 복습 스케줄

```
D+0 (학습일): 플래시카드 "알았음" 선택
    ↓
D+1 ~ D+2: 복습 대기 X (nextReviewDate = D+3)
    ↓
D+3: 복습 대기
    ↓ 퀴즈 정답
D+4: 복습 대기 (nextReviewDate = D+4)
    ↓ 퀴즈 정답
D+5: 복습 완료 (correctCount = 2)
```

### 3.3 퀴즈 오답 시

```
복습 퀴즈 오답
    ↓
nextReviewDate = 오늘 (바로 재복습 대기)
incorrectCount += 1
```

---

## 4. 통계 및 정답률 정의

### 4.1 정답률 종류

| 위치 | 항목 | 계산 방식 | 설명 |
|------|------|----------|------|
| 메인페이지 왼쪽 | 정답률 | 오늘 initialRating>=4 / 오늘 학습 | 오늘 플래시카드 "알았음" 비율 |
| 메인페이지 오른쪽 | 전체 정답률 | 전체 initialRating>=4 / 전체 학습 | 누적 플래시카드 "알았음" 비율 |
| 복습 페이지 | 복습 정답률 | correctCount / (correct + incorrect) | 복습 퀴즈 정답 비율 |

### 4.2 "오늘 맞춤" 정의

```typescript
// 오늘 복습 퀴즈에서 맞춘 단어 수
const todayCorrect = await prisma.userProgress.count({
  where: {
    userId,
    examCategory,
    level,
    lastReviewDate: { gte: todayStartUTC },
    totalReviews: { gte: 2 },  // 첫 학습(1회) 제외, 복습(2회+)만
  }
});
```

> `totalReviews >= 2` 조건으로 플래시카드 "알았음"이 카운트되는 것 방지

### 4.3 복습 현황 카드

```
┌─────────────────────────────────────┐
│  복습 현황                    1일 연속 │
│                                     │
│    10        7         70%         │
│  복습 대기   오늘 맞춤   복습 정답률    │
└─────────────────────────────────────┘
```

---

## 5. DB 스키마 (UserProgress)

### 5.1 주요 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| id | String (UUID) | PK |
| userId | String | 사용자 ID |
| wordId | String | 단어 ID |
| examCategory | Enum | CSAT, TEPS, TOEFL, TOEIC, SAT |
| level | String | L1, L2, L3 |
| initialRating | Int | 첫 플래시카드 선택 (1 또는 5) |
| learnedAt | DateTime | 첫 학습 시간 |
| lastReviewDate | DateTime | 마지막 복습 시간 |
| nextReviewDate | DateTime | 다음 복습 예정일 |
| needsReview | Boolean | 복습 필요 여부 |
| totalReviews | Int | 총 학습/복습 횟수 |
| correctCount | Int | 복습 퀴즈 정답 횟수 (QUIZ에서만 증가) |
| incorrectCount | Int | 복습 퀴즈 오답 횟수 (QUIZ에서만 증가) |
| masteryLevel | Enum | NEW, LEARNING, REVIEWING, MASTERED |

### 5.2 Unique 제약

```prisma
@@unique([userId, wordId, examCategory, level])
```

### 5.3 필드별 업데이트 규칙

| 필드 | 플래시카드 | 복습 퀴즈 |
|------|-----------|----------|
| initialRating | 업데이트 | 변경 안 함 |
| correctCount | 변경 안 함 | 정답 시 +1 |
| incorrectCount | 변경 안 함 | 오답 시 +1 |
| totalReviews | +1 | +1 |
| nextReviewDate | 설정 | 업데이트 |
| lastReviewDate | 설정 | 업데이트 |

---

## 6. API 엔드포인트

### 6.1 학습 관련

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | /api/progress/record | 플래시카드 학습 결과 저장 |
| POST | /api/progress/review | 복습 퀴즈 결과 저장 |
| GET | /api/progress/user | 사용자 학습 현황 조회 |

### 6.2 복습 관련

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | /api/progress/due | 복습 대기 단어 수 조회 |
| GET | /api/progress/review-quiz | 복습 퀴즈 단어 목록 조회 |
| GET | /api/progress/weak-count | 취약 단어 수 조회 |
| GET | /api/progress/stats | 레벨별 통계 조회 |

### 6.3 API 응답 예시

```typescript
// GET /api/progress/due?examCategory=CSAT&level=L1
{
  dueCount: 10,           // 복습 대기 단어 수
  todayCorrect: 7,        // 오늘 맞춘 단어 수
  reviewAccuracy: 70,     // 복습 정답률 (%)
}

// GET /api/progress/user
{
  todayLearned: 20,              // 오늘 학습한 단어
  totalWordsLearned: 150,        // 누적 학습 단어
  todayFlashcardAccuracy: 50,    // 오늘 플래시카드 정답률
  totalFlashcardAccuracy: 65,    // 전체 플래시카드 정답률
  reviewDue: 10,                 // 복습 대기
  currentStreak: 5,              // 연속 학습일
}
```

---

## 7. 프론트엔드 페이지 구조

### 7.1 /dashboard (대시보드)

```
┌─────────────────────────────────────┐
│  오늘의 학습 목표                     │
│  다음 학습할 단어 20개               │
│  [학습 시작]                         │
├─────────────────────────────────────┤
│  시험 선택: [수능] [TEPS]            │
│  레벨 선택: [L1] [L2] [L3]          │
├─────────────────────────────────────┤
│  바로 학습 이어가기                   │
│  수능 L1  Set 3/8 • 12/20           │
│  [학습 시작]                         │
└─────────────────────────────────────┘
```

### 7.2 /review (복습)

```
┌─────────────────────────────────────┐
│  복습 대기                           │
│  10개 단어가 복습을 기다려요          │
│  [복습 시작]                         │
├─────────────────────────────────────┤
│  시험 선택: [수능] [TEPS]            │
│  레벨 선택: [L1] [L2] [L3]          │
├─────────────────────────────────────┤
│  복습 현황           1일 연속        │
│  10       7        70%              │
│  복습대기  오늘맞춤  복습정답률        │
├─────────────────────────────────────┤
│  바로 복습 이어가기                   │
│  수능 L1                            │
│  [퀴즈] [플래시카드] [북마크]        │
└─────────────────────────────────────┘
```

### 7.3 /review/quiz (복습 퀴즈)

```
┌─────────────────────────────────────┐
│  <- 뒤로                    3 / 10   │
│  ═══════════════════════════        │ (프로그레스 바)
├─────────────────────────────────────┤
│           수능 • L1                 │
│            명사                     │
│          effort                    │
│         /efrt/                     │
│      [이미지] [이미지] [이미지]      │
├─────────────────────────────────────┤
│  [ 1. 표준, 기준              ]     │
│  [ 2. 노력, 힘쓰기            ]     │ <- 정답
│  [ 3. 무거운 것을 끌다        ]     │
│  [ 4. 영속적인, 끝없는        ]     │
├─────────────────────────────────────┤
│        [정답 확인]                  │
│          O 0 | X 2                 │
└─────────────────────────────────────┘
```

---

## 8. 주요 비즈니스 규칙

### 8.1 학습 규칙

1. **1 Set = 20개 단어** (고정)
2. **플래시카드는 2버튼** (모름/알았음)
3. **Set 내 재선택 가능** (initialRating 업데이트)
4. **레벨별 독립 진행** (L1 완료 후 L2 시작)

### 8.2 복습 규칙

1. **"모름" -> 당일 복습 대기**
2. **"알았음" -> D+3에 복습 대기**
3. **퀴즈 정답 -> D+1에 다시 복습**
4. **퀴즈 오답 -> 즉시 재복습 대기**
5. **2번 맞추면 복습 완료** (correctCount >= 2)

### 8.3 통계 규칙

1. **플래시카드 정답률 != 복습 정답률** (별도 계산)
2. **correctCount/incorrectCount는 QUIZ에서만 증가**
3. **"오늘 맞춤"은 totalReviews >= 2인 단어만 카운트**

---

## 9. 계정 초기화 스크립트

### 9.1 전체 초기화 (테스트용)

```sql
-- UserProgress 삭제
DELETE FROM "UserProgress" WHERE "userId" = '[USER_ID]';

-- LearningSession 삭제
DELETE FROM "LearningSession" WHERE "userId" = '[USER_ID]';

-- User 통계 리셋
UPDATE "User"
SET
  "totalWordsLearned" = 0,
  "currentStreak" = 0,
  "dailyProgress" = 0,
  "lastActiveDate" = NULL
WHERE id = '[USER_ID]';
```

### 9.2 특정 레벨만 초기화

```sql
DELETE FROM "UserProgress"
WHERE "userId" = '[USER_ID]'
  AND "examCategory" = 'CSAT'
  AND "level" = 'L1';
```

---

## 10. 향후 개선 계획

### 10.1 복습 패턴 고도화 (미구현)

```
D+0, D+1: 복습 대기
D+2: 쉬는 날
D+3, D+4: 복습 대기
D+5: 쉬는 날
...
```

### 10.2 SM-2 알고리즘 도입 (미구현)

- easeFactor 기반 간격 조절
- 개인별 학습 패턴 분석
- 최적 복습 시점 예측

### 10.3 게이미피케이션 강화

- 연속 학습 스트릭 보상
- 레벨업 알림
- 주간/월간 리포트

---

## 변경 이력

| 날짜 | 변경 내용 | 커밋 |
|------|----------|------|
| 2026-01-27 | 3버튼 -> 2버튼 시스템 | 2e1a7da |
| 2026-01-27 | nextReviewDate 로직 (모름=오늘) | 4912b5b |
| 2026-01-27 | "오늘 완료" -> "오늘 맞춤" | 37bc3a9 |
| 2026-01-27 | 정답률 로직 분리 | 77d2922 |
| 2026-01-28 | initialRating 재선택 시 업데이트 | 4671ef2 |
| 2026-01-28 | correctCount QUIZ에서만 증가 | 209191a |
| 2026-01-28 | "오늘 맞춤" totalReviews 조건 | 4318dc0 |
| 2026-01-28 | 복습 퀴즈 동적 문제 수 | 6821977 |

---

## 검증 완료 항목

- [x] 플래시카드 2버튼 정상 작동
- [x] "모름" 선택 시 당일 복습 대기
- [x] "알았음" 선택 시 D+3 복습 대기
- [x] 복습 퀴즈 동적 문제 수 (최대 10개)
- [x] 퀴즈 정답 시 correctCount 증가
- [x] 퀴즈 오답 시 즉시 재복습 대기
- [x] 2번 맞추면 복습 완료
- [x] 플래시카드 정답률 / 복습 정답률 분리
- [x] "오늘 맞춤" 정확한 카운트
- [x] 복습 완료 시 "복습 완료!" 화면 표시
