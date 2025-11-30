# VocaVision 단어 입력 가이드

> **VocaVision 콘텐츠 공장 운영 매뉴얼**
> 수능/TEPS/TOEIC/TOEFL/SAT 단어를 시스템에 입력하고 학습 콘텐츠로 발행하는 전체 과정

---

## 목차

1. [전체 흐름 요약](#1-전체-흐름-요약)
2. [Step 1: CSV 파일 준비](#2-step-1-csv-파일-준비)
3. [Step 2: Word 테이블에 단어 생성](#3-step-2-word-테이블에-단어-생성)
4. [Step 3: Claude로 콘텐츠 배치 생성](#4-step-3-claude로-콘텐츠-배치-생성)
5. [Step 4: 이미지 배치 생성](#5-step-4-이미지-배치-생성)
6. [Step 5: Admin에서 검토 및 발행](#6-step-5-admin에서-검토-및-발행)
7. [Step 6: 학습 앱에서 사용](#7-step-6-학습-앱에서-사용)
8. [API 엔드포인트 레퍼런스](#8-api-엔드포인트-레퍼런스)
9. [테스트 체크리스트](#9-테스트-체크리스트)

---

## 1. 전체 흐름 요약

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  CSV 준비   │ -> │ Word 생성   │ -> │ Claude 생성 │ -> │ 이미지 생성 │ -> │ 검토/발행   │
│  (단어목록)  │    │  (껍데기)   │    │ (콘텐츠)    │    │ (연상법GIF) │    │ (PUBLISHED) │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                         │                  │                  │                  │
                    status=DRAFT      status=PENDING    이미지 URL 저장     status=PUBLISHED
                                      _REVIEW                                      │
                                                                                   v
                                                                          학습 앱에서 사용
```

### 상태 흐름 (ContentStatus)

```
DRAFT -> PENDING_REVIEW -> APPROVED -> PUBLISHED
  │            │              │            │
  │            │              │            └── 학습 앱에서 조회 가능
  │            │              └── 발행 준비 완료
  │            └── AI 생성 완료, 검토 대기
  └── Word만 생성됨, 콘텐츠 없음
```

---

## 2. Step 1: CSV 파일 준비

### 2.1 필수 필드

| 필드명 | 타입 | 설명 | 예시 |
|--------|------|------|------|
| `word` | string | 영어 단어 (소문자) | `abandon` |
| `examCategory` | enum | 시험 카테고리 | `CSAT` |
| `partOfSpeech` | enum | 품사 | `VERB` |

### 2.2 선택 필드

| 필드명 | 타입 | 설명 | 기본값 |
|--------|------|------|--------|
| `cefrLevel` | enum | CEFR 레벨 | `B1` |
| `difficulty` | enum | 난이도 | `INTERMEDIATE` |
| `level` | string | 시험 내 레벨 | `null` |
| `tags` | string | 주제 태그 (콤마 구분) | `[]` |

### 2.3 허용되는 ENUM 값

```typescript
// 시험 카테고리
examCategory: 'CSAT' | 'TEPS' | 'TOEIC' | 'TOEFL' | 'SAT'
  // CSAT  = 수능 (대학수학능력시험)
  // TEPS  = 텝스 (서울대 영어능력시험)
  // TOEIC = 토익 (비즈니스 영어)
  // TOEFL = 토플 (학술 영어)
  // SAT   = SAT (미국 대입)

// CEFR 레벨
cefrLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
  // A1 = Elementary
  // A2 = Pre-intermediate
  // B1 = Intermediate (기본값)
  // B2 = Upper-intermediate
  // C1 = Advanced
  // C2 = Proficiency

// 난이도
difficulty: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED'

// 품사
partOfSpeech: 'NOUN' | 'VERB' | 'ADJECTIVE' | 'ADVERB' |
              'PRONOUN' | 'PREPOSITION' | 'CONJUNCTION' | 'INTERJECTION'
```

### 2.4 CSV 예시 (수능 10단어)

파일 위치: `data/csat-test-10.csv`

```csv
word,examCategory,cefrLevel,difficulty,partOfSpeech,level,tags
abandon,CSAT,B2,INTERMEDIATE,VERB,L1,"일반,감정"
ability,CSAT,B1,BASIC,NOUN,L1,"일반"
absorb,CSAT,B2,INTERMEDIATE,VERB,L2,"과학"
abstract,CSAT,C1,ADVANCED,ADJECTIVE,L3,"학술,철학"
abundant,CSAT,B2,INTERMEDIATE,ADJECTIVE,L2,"자연,경제"
accelerate,CSAT,C1,ADVANCED,VERB,L3,"과학,경제"
accomplish,CSAT,B2,INTERMEDIATE,VERB,L2,"일반"
accumulate,CSAT,B2,INTERMEDIATE,VERB,L2,"경제,과학"
accurate,CSAT,B2,INTERMEDIATE,ADJECTIVE,L2,"일반"
acknowledge,CSAT,B2,INTERMEDIATE,VERB,L2,"일반,학술"
```

---

## 3. Step 2: Word 테이블에 단어 생성

> **목표**: Word 테이블에 단어 "껍데기"만 생성 (status=DRAFT)

### 3.1 방법 A: 배치 API 호출

```bash
curl -X POST https://api.vocavision.com/api/content/batch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "words": ["abandon", "ability", "absorb", "abstract", "abundant",
              "accelerate", "accomplish", "accumulate", "accurate", "acknowledge"],
    "examCategory": "CSAT",
    "cefrLevel": "B1"
  }'
```

**응답:**
```json
{
  "success": true,
  "jobId": "cm1234567890abcdef",
  "message": "Batch job created for 10 words"
}
```

### 3.2 방법 B: Prisma Seed 스크립트

파일 위치: `backend/prisma/seed-words.ts`

```typescript
import { PrismaClient, ExamCategory, CEFRLevel, DifficultyLevel, PartOfSpeech } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface WordRow {
  word: string;
  examCategory: string;
  cefrLevel: string;
  difficulty: string;
  partOfSpeech: string;
  level?: string;
  tags?: string;
}

async function parseCSV(filePath: string): Promise<WordRow[]> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',');

  return lines.slice(1).map(line => {
    const values = line.split(',');
    const row: any = {};
    headers.forEach((header, index) => {
      row[header.trim()] = values[index]?.trim().replace(/"/g, '');
    });
    return row as WordRow;
  });
}

async function seedWords(csvPath: string) {
  console.log(`📚 Reading CSV from: ${csvPath}`);
  const words = await parseCSV(csvPath);

  console.log(`📝 Found ${words.length} words to seed\n`);

  let created = 0;
  let skipped = 0;

  for (const row of words) {
    const existing = await prisma.word.findFirst({
      where: { word: row.word.toLowerCase() }
    });

    if (existing) {
      console.log(`⏭️  Skipped: ${row.word} (already exists)`);
      skipped++;
      continue;
    }

    await prisma.word.create({
      data: {
        word: row.word.toLowerCase(),
        definition: '',  // Claude가 생성 예정
        definitionKo: '',
        examCategory: row.examCategory as ExamCategory,
        cefrLevel: (row.cefrLevel || 'B1') as CEFRLevel,
        difficulty: (row.difficulty || 'INTERMEDIATE') as DifficultyLevel,
        partOfSpeech: row.partOfSpeech as PartOfSpeech,
        level: row.level || null,
        tags: row.tags ? row.tags.split(',').map(t => t.trim()) : [],
        status: 'DRAFT',
      },
    });

    console.log(`✅ Created: ${row.word}`);
    created++;
  }

  console.log(`\n========================================`);
  console.log(`✅ Created: ${created}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`📊 Total: ${words.length}`);
  console.log(`========================================\n`);
}

// 실행
const csvPath = process.argv[2] || path.join(__dirname, '../../data/csat-test-10.csv');
seedWords(csvPath)
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

**실행:**
```bash
cd backend
npx ts-node prisma/seed-words.ts ../data/csat-test-10.csv
```

---

## 4. Step 3: Claude로 콘텐츠 배치 생성

> **목표**: DRAFT 상태의 단어들에 대해 Claude API로 콘텐츠 생성

### 4.1 작업 상태 확인

```bash
# 배치 작업 상태 조회
curl https://api.vocavision.com/api/content/jobs/cm1234567890abcdef \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**응답:**
```json
{
  "success": true,
  "job": {
    "id": "cm1234567890abcdef",
    "inputWords": ["abandon", "ability", ...],
    "status": "processing",
    "progress": 70,
    "createdAt": "2024-01-15T10:00:00Z",
    "startedAt": "2024-01-15T10:00:05Z"
  }
}
```

### 4.2 Claude가 생성하는 콘텐츠

단어 하나당 다음 항목이 자동 생성됩니다:

| 항목 | 저장 위치 | 설명 |
|------|-----------|------|
| 영어 정의 | `Word.definition` | 영어 뜻 풀이 |
| 한국어 정의 | `Word.definitionKo` | 한국어 뜻 |
| IPA 발음 | `Word.ipaUs`, `ipaUk` | 미국/영국식 IPA |
| 어원 | `Etymology` 테이블 | 라틴어 원형, 발전 과정 |
| 형태소 분석 | `Word.prefix/root/suffix` | 접두사, 어근, 접미사 |
| 연상법 | `Mnemonic` 테이블 | 경선식 스타일 한국어 연상법 |
| 예문 | `Example` 테이블 | 3~5개 예문 (재미있는 예문 포함) |
| 콜로케이션 | `Collocation` 테이블 | "make a decision" 같은 연어 |
| 동의어 | `Synonym` 테이블 | 뉘앙스 차이 설명 포함 |
| 반의어 | `Antonym` 테이블 | 설명 포함 |
| 라이밍 | `Word.rhymingWords` | 같은 발음 단어들 |

### 4.3 생성 완료 후 상태

- `Word.status` = `PENDING_REVIEW`
- `Word.aiGeneratedAt` = 생성 시각
- `Word.aiModel` = "claude-sonnet-4-20250514"

---

## 5. Step 4: 이미지 배치 생성

> **목표**: Mnemonic(연상법)을 기반으로 학습용 이미지 생성

### 5.1 이미지 생성 대기 목록 조회

```bash
curl https://api.vocavision.com/api/admin/images/pending?limit=20 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 5.2 배치 이미지 생성 요청

```bash
curl -X POST https://api.vocavision.com/api/admin/images/generate-batch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "wordIds": [
      "uuid-abandon",
      "uuid-ability",
      "uuid-absorb"
    ],
    "style": "cartoon",
    "size": "512x512"
  }'
```

**응답:**
```json
{
  "success": true,
  "data": {
    "total": 3,
    "successful": 3,
    "failed": 0,
    "results": [
      {
        "wordId": "uuid-abandon",
        "success": true,
        "imageUrl": "https://res.cloudinary.com/vocavision/..."
      }
    ]
  }
}
```

### 5.3 이미지 스타일 옵션

```typescript
style:
  | 'cartoon'      // 만화 스타일 (기본 추천)
  | 'anime'        // 애니메이션
  | 'watercolor'   // 수채화
  | 'pixel'        // 픽셀 아트
  | 'sketch'       // 스케치
  | '3d-render'    // 3D 렌더링
  | 'comic'        // 코믹북
  | 'minimalist'   // 미니멀리스트
  | 'vintage'      // 빈티지
  | 'pop-art'      // 팝아트

size:
  | '512x512'      // 표준 (기본값)
  | '768x768'      // 중간
  | '1024x1024'    // 고해상도
```

---

## 6. Step 5: Admin에서 검토 및 발행

### 6.1 검토 대기 목록 조회

```bash
curl https://api.vocavision.com/api/content/pending?limit=20 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**응답:**
```json
{
  "success": true,
  "words": [
    {
      "id": "uuid-abandon",
      "word": "abandon",
      "status": "PENDING_REVIEW",
      "definition": "to leave someone or something completely...",
      "definitionKo": "~을 버리다, 포기하다",
      "etymology": { "origin": "Old French 'abandoner'..." },
      "mnemonics": [{ "content": "어-밴-던: 밴을 던지다..." }],
      "examples": [{ "sentence": "He abandoned his car..." }]
    }
  ],
  "pagination": { "total": 10, "limit": 20, "offset": 0 }
}
```

### 6.2 개별 단어 승인

```bash
curl -X POST https://api.vocavision.com/api/content/review/uuid-abandon \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{ "action": "approve" }'
```

### 6.3 수정 후 저장

```bash
curl -X POST https://api.vocavision.com/api/content/review/uuid-abandon \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "action": "edit",
    "fields": {
      "definitionKo": "~을 버리다, 포기하다 (수정됨)"
    }
  }'
```

### 6.4 최종 발행

```bash
# APPROVED -> PUBLISHED
curl -X POST https://api.vocavision.com/api/content/publish/uuid-abandon \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**응답:**
```json
{
  "success": true,
  "wordId": "uuid-abandon",
  "newStatus": "PUBLISHED"
}
```

---

## 7. Step 6: 학습 앱에서 사용

### 7.1 PUBLISHED 단어만 조회

```bash
curl "https://api.vocavision.com/api/words?examCategory=CSAT&status=PUBLISHED&limit=20"
```

### 7.2 프론트엔드 렌더링 예시

```typescript
// Next.js 페이지 예시
export default function LearnPage() {
  const { data: words } = useQuery(['words', 'CSAT'], () =>
    fetch('/api/words?examCategory=CSAT&status=PUBLISHED&limit=20')
      .then(res => res.json())
  );

  return (
    <div className="grid gap-4">
      {words?.map(word => (
        <FlashCard key={word.id}>
          {/* 앞면 */}
          <CardFront>
            <h2 className="text-3xl font-bold">{word.word}</h2>
            <p className="text-gray-500">{word.ipaUs}</p>
            <Badge>{word.partOfSpeech}</Badge>
          </CardFront>

          {/* 뒷면 */}
          <CardBack>
            <p className="text-xl">{word.definitionKo}</p>

            {/* 연상법 + 이미지 */}
            {word.mnemonics?.[0] && (
              <div className="mt-4">
                <img src={word.mnemonics[0].gifUrl} alt="mnemonic" />
                <p>{word.mnemonics[0].koreanHint}</p>
              </div>
            )}

            {/* 예문 */}
            <ul className="mt-4 space-y-2">
              {word.examples?.slice(0, 3).map(ex => (
                <li key={ex.id}>{ex.sentence}</li>
              ))}
            </ul>
          </CardBack>
        </FlashCard>
      ))}
    </div>
  );
}
```

---

## 8. API 엔드포인트 레퍼런스

### 8.1 콘텐츠 생성 (`/api/content`)

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| POST | `/api/content/generate` | 단일 단어 콘텐츠 생성 | Admin |
| POST | `/api/content/batch` | 배치 콘텐츠 생성 작업 | Admin |
| GET | `/api/content/jobs` | 배치 작업 목록 | Admin |
| GET | `/api/content/jobs/:jobId` | 작업 상태 조회 | Admin |
| GET | `/api/content/pending` | 검토 대기 목록 | Admin |
| POST | `/api/content/review/:wordId` | 검토 (approve/reject/edit) | Admin |
| POST | `/api/content/publish/:wordId` | 발행 | Admin |
| GET | `/api/content/audit/:wordId` | 감사 이력 | Admin |

### 8.2 이미지 생성 (`/api/admin/images`)

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| GET | `/api/admin/images/styles` | 스타일 목록 | Admin |
| POST | `/api/admin/images/preview-prompt` | 프롬프트 미리보기 | Admin |
| POST | `/api/admin/images/generate` | 단일 이미지 생성 | Admin |
| POST | `/api/admin/images/generate-batch` | 배치 이미지 생성 | Admin |
| DELETE | `/api/admin/images/:wordId` | 이미지 삭제 | Admin |
| GET | `/api/admin/images/stats` | 이미지 통계 | Admin |
| GET | `/api/admin/images/pending` | 이미지 생성 대기 목록 | Admin |

### 8.3 단어 조회 (`/api/words`)

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| GET | `/api/words` | 단어 목록 조회 | Public/User |
| GET | `/api/words/:id` | 단어 상세 조회 | Public/User |
| GET | `/api/words/search` | 단어 검색 | Public/User |

**쿼리 파라미터:**
- `examCategory`: CSAT, TEPS, TOEIC, TOEFL, SAT
- `status`: PUBLISHED (학습용), DRAFT, PENDING_REVIEW, APPROVED
- `cefrLevel`: A1, A2, B1, B2, C1, C2
- `limit`: 페이지당 개수 (기본: 20)
- `offset`: 오프셋

---

## 9. 테스트 체크리스트

### 수능 10단어 E2E 테스트

```bash
# ================================
# Step 1: CSV 준비
# ================================
# data/csat-test-10.csv 파일 확인

# ================================
# Step 2: Word 생성 (Seed)
# ================================
cd backend
npx ts-node prisma/seed-words.ts ../data/csat-test-10.csv

# ================================
# Step 3: 콘텐츠 배치 생성
# ================================
curl -X POST http://localhost:3001/api/content/batch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "words": ["abandon", "ability", "absorb", "abstract", "abundant",
              "accelerate", "accomplish", "accumulate", "accurate", "acknowledge"],
    "examCategory": "CSAT",
    "cefrLevel": "B1"
  }'

# jobId 저장
export JOB_ID="응답에서_받은_jobId"

# 작업 상태 확인 (완료될 때까지)
curl http://localhost:3001/api/content/jobs/$JOB_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# ================================
# Step 4: 이미지 배치 생성
# ================================
# 먼저 이미지 생성 대기 목록 확인
curl http://localhost:3001/api/admin/images/pending \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# wordIds를 받아서 이미지 생성
curl -X POST http://localhost:3001/api/admin/images/generate-batch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "wordIds": ["uuid-1", "uuid-2", "..."],
    "style": "cartoon",
    "size": "512x512"
  }'

# ================================
# Step 5: 검토 및 발행
# ================================
# 검토 대기 목록 확인
curl http://localhost:3001/api/content/pending \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 각 단어 승인
curl -X POST http://localhost:3001/api/content/review/uuid-abandon \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"action": "approve"}'

# 발행
curl -X POST http://localhost:3001/api/content/publish/uuid-abandon \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# ================================
# Step 6: 학습 앱에서 확인
# ================================
curl "http://localhost:3001/api/words?examCategory=CSAT&status=PUBLISHED"

# 결과: 10개 단어 + 모든 콘텐츠 확인!
```

---

## 부록: 시험별 단어 CSV 템플릿

### 수능 (CSAT)
```csv
word,examCategory,cefrLevel,difficulty,partOfSpeech,level,tags
example,CSAT,B2,INTERMEDIATE,NOUN,L1,"일반"
```

### TEPS
```csv
word,examCategory,cefrLevel,difficulty,partOfSpeech,level,tags
example,TEPS,C1,ADVANCED,NOUN,상급,"학술"
```

### TOEFL
```csv
word,examCategory,cefrLevel,difficulty,partOfSpeech,level,tags
example,TOEFL,C1,ADVANCED,NOUN,academic,"학술,과학"
```

### SAT
```csv
word,examCategory,cefrLevel,difficulty,partOfSpeech,level,tags
example,SAT,C2,ADVANCED,NOUN,high-frequency,"학술"
```

---

## 문서 정보

- **버전**: 1.0.0
- **최종 수정**: 2024-11-30
- **작성자**: VocaVision Team
- **관련 문서**:
  - [CONTENT_PIPELINE.md](./CONTENT_PIPELINE.md) - AI 콘텐츠 파이프라인 상세
  - [ARCHITECTURE.md](../ARCHITECTURE.md) - 시스템 아키텍처
