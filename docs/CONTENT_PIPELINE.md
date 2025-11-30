# VocaVision AI 콘텐츠 파이프라인 완전 가이드

> **Version:** 1.0.0
> **Last Updated:** 2024-11-30
> **For:** AI Assistants & Developers

---

## 목차

1. [개요](#1-개요)
2. [시스템 아키텍처](#2-시스템-아키텍처)
3. [AI 콘텐츠 생성 (Claude API)](#3-ai-콘텐츠-생성-claude-api)
4. [큐 시스템 (Bull/Redis)](#4-큐-시스템-bullredis)
5. [이미지 생성 (WHISK Integration)](#5-이미지-생성-whisk-integration)
6. [콘텐츠 검토/승인 워크플로우](#6-콘텐츠-검토승인-워크플로우)
7. [데이터베이스 스키마](#7-데이터베이스-스키마)
8. [API 레퍼런스](#8-api-레퍼런스)
9. [에러 처리 및 재시도](#9-에러-처리-및-재시도)
10. [성능 최적화](#10-성능-최적화)
11. [비용 추정](#11-비용-추정)
12. [배포 및 설정](#12-배포-및-설정)
13. [모니터링](#13-모니터링)
14. [파일 경로 맵](#14-파일-경로-맵)

---

## 1. 개요

VocaVision의 콘텐츠 파이프라인은 **AI 기반 영어 어휘 학습 콘텐츠 자동 생성 시스템**입니다.

### 1.1 핵심 기능

- **Claude API**를 사용한 고품질 학습 콘텐츠 생성
- **Stability AI/DALL-E**를 사용한 연상 이미지 생성
- **Bull/Redis** 기반 배치 처리 및 비동기 작업 큐
- **SSE(Server-Sent Events)** 기반 실시간 진행률 모니터링
- **검토/승인 워크플로우**를 통한 품질 관리

### 1.2 생성되는 콘텐츠 유형

| 콘텐츠 | 설명 | 예시 |
|--------|------|------|
| **정의** | 영/한 정의 및 품사 | "abandon (v.) - 버리다, 포기하다" |
| **발음** | IPA (미국식/영국식) + 한글 | /əˈbændən/ - 어밴던 |
| **어원** | 어원 분석 및 역사 | Latin "abandonare" → Old French |
| **형태소** | 접두사/어근/접미사 분석 | un- + abandon + -ed |
| **콜로케이션** | 자주 함께 쓰이는 표현 | "abandon hope", "abandon ship" |
| **예문** | 재미있는/실제 사용 예문 | 영화, 뉴스 등 출처 포함 |
| **연상법** | 한국어 발음 연상 기억법 | "어밴던 → 어! 밴이 던지다" |
| **이미지** | AI 생성 연상 이미지 | 10가지 아트 스타일 |
| **관련어** | 동의어/반의어/라이밍 | synonyms, antonyms, rhymes |

---

## 2. 시스템 아키텍처

### 2.1 전체 흐름도

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Admin Dashboard                               │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐    │
│   │ 단일 생성    │  │ 배치 생성    │  │ 검토/승인 관리           │    │
│   └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘    │
└──────────┼────────────────┼─────────────────────┼──────────────────┘
           │                │                     │
           ▼                ▼                     ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         REST API Layer                                │
│  POST /content/generate  POST /content/batch  POST /content/review   │
└──────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────┐
│                       Queue System (Bull/Redis)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │ Content Queue │  │ Image Queue  │  │ Export Queue │               │
│  │ (동시성: 3)   │  │ (동시성: 2)  │  │ (동시성: 1)  │               │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┘               │
└─────────┼─────────────────┼─────────────────────────────────────────┘
          │                 │
          ▼                 ▼
┌─────────────────┐  ┌──────────────────────────────────────────────────┐
│   Claude API    │  │              Image Generation                    │
│  (Anthropic)    │  │  ┌───────────────┐  ┌───────────────────────┐   │
│                 │  │  │ Stability AI  │  │ OpenAI DALL-E (Backup)│   │
│  - 콘텐츠 생성   │  │  │ (SDXL 1.0)   │  │                       │   │
│  - 프롬프트 최적화│  │  └───────┬───────┘  └───────────────────────┘   │
└────────┬────────┘  │          │                                       │
         │           │          ▼                                       │
         │           │  ┌───────────────┐                              │
         │           │  │  Cloudinary   │  ← 이미지 저장/변환           │
         │           │  └───────┬───────┘                              │
         │           └──────────┼──────────────────────────────────────┘
         │                      │
         ▼                      ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     PostgreSQL Database (Prisma ORM)                  │
│  ┌────────┐ ┌─────────┐ ┌─────────┐ ┌───────────┐ ┌──────────────┐  │
│  │  Word  │ │ Example │ │Mnemonic │ │ Etymology │ │ WordImage    │  │
│  └────────┘ └─────────┘ └─────────┘ └───────────┘ └──────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    SSE (Server-Sent Events)                           │
│              실시간 진행률 → Admin Dashboard                          │
└──────────────────────────────────────────────────────────────────────┘
```

### 2.2 기술 스택

| 레이어 | 기술 | 버전 |
|--------|------|------|
| **Backend** | Node.js + Express + TypeScript | 20.x |
| **ORM** | Prisma | 5.x |
| **Database** | PostgreSQL | 15+ |
| **Queue** | Bull + Redis | Bull 4.x |
| **AI - 텍스트** | Anthropic Claude | claude-sonnet-4-20250514 |
| **AI - 이미지** | Stability AI SDXL 1.0 | - |
| **AI - 이미지 (백업)** | OpenAI DALL-E 3 | - |
| **Storage** | Cloudinary | - |
| **Real-time** | SSE (Server-Sent Events) | - |

---

## 3. AI 콘텐츠 생성 (Claude API)

### 3.1 서비스 위치

```
backend/src/services/contentGenerator.service.ts
```

### 3.2 Claude API 설정

```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// 호출 설정
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 4096,
  system: SYSTEM_PROMPT,
  messages: [{ role: 'user', content: userPrompt }],
});
```

### 3.3 시스템 프롬프트

```typescript
const SYSTEM_PROMPT = `당신은 한국인 영어 학습자를 위한 어휘 콘텐츠 전문가입니다.

핵심 역할:
1. 정확하고 기억하기 쉬운 영어 단어 학습 콘텐츠 생성
2. 한국어 발음 연상법을 활용한 창의적 암기법 제공
3. 시험별 맞춤 콘텐츠 (수능, TOEIC, TOEFL, IELTS, GRE, SAT)
4. CEFR 레벨에 맞는 난이도 조정

콘텐츠 생성 원칙:
- 정확성: 사전적 정의와 실제 사용법 일치
- 기억용이성: 연상법, 어원, 라이밍 활용
- 재미: 유머러스한 예문, 영화/드라마 출처
- 실용성: 콜로케이션, 실제 사용 문맥

출력 형식: 반드시 유효한 JSON으로 응답
```

### 3.4 생성 옵션 (GenerationOptions)

```typescript
interface GenerationOptions {
  word: string;                    // 생성할 단어
  examCategory: ExamCategory;      // CSAT | TOEIC | TOEFL | IELTS | GRE | SAT
  cefrLevel: CEFRLevel;           // A1 | A2 | B1 | B2 | C1 | C2
}

type ExamCategory = 'CSAT' | 'TOEIC' | 'TOEFL' | 'IELTS' | 'GRE' | 'SAT';
type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
```

### 3.5 생성되는 콘텐츠 구조

```typescript
interface GeneratedContent {
  pronunciation: {
    ipaUs: string;        // "/əˈbændən/"
    ipaUk: string;        // "/əˈbændən/"
    korean: string;       // "어밴던"
  };

  definitions: Array<{
    partOfSpeech: string;     // "verb"
    definitionEn: string;     // "to leave completely and finally"
    definitionKo: string;     // "버리다, 포기하다"
    exampleEn: string;        // "He abandoned his family."
    exampleKo: string;        // "그는 가족을 버렸다."
  }>;

  etymology: {
    description: string;      // "14세기 프랑스어에서 유래"
    language: string;         // "French"
    breakdown: string;        // "a- (to) + bandon (control)"
  };

  morphology: {
    prefix: { part: string; meaning: string } | null;
    root: { part: string; meaning: string };
    suffix: { part: string; meaning: string } | null;
    note: string;
  };

  collocations: Array<{
    phrase: string;           // "abandon hope"
    translation: string;      // "희망을 버리다"
    type: string;            // "verb + noun"
    exampleEn: string;
    exampleKo: string;
  }>;

  rhyming: {
    words: string[];          // ["hand in", "stand in", "land in"]
    note: string;            // "'-andon' 발음에 집중하세요"
  };

  mnemonic: {
    description: string;      // "연상 기억법 설명"
    koreanAssociation: string; // "어! 밴이 던지다 → 버리다"
    imagePrompt: string;      // "A van throwing something away"
  };

  examples: Array<{
    sentenceEn: string;
    sentenceKo: string;
    isFunny: boolean;
    isReal: boolean;
    source: string | null;    // "Titanic (1997)"
  }>;

  relatedWords: {
    synonyms: string[];       // ["desert", "forsake", "leave"]
    antonyms: string[];       // ["keep", "maintain", "continue"]
    related: string[];        // ["abandonment", "abandoned"]
  };
}
```

### 3.6 콘텐츠 저장 프로세스

```typescript
async function saveGeneratedContent(wordId: string, content: GeneratedContent) {
  // 1. Word 테이블 업데이트
  await prisma.word.update({
    where: { id: wordId },
    data: {
      pronunciation: content.pronunciation.korean,
      ipaUs: content.pronunciation.ipaUs,
      ipaUk: content.pronunciation.ipaUk,
      prefix: content.morphology?.prefix?.part,
      root: content.morphology?.root?.part,
      suffix: content.morphology?.suffix?.part,
      morphologyNote: content.morphology?.note,
      synonymList: content.relatedWords.synonyms,
      antonymList: content.relatedWords.antonyms,
      rhymingWords: content.rhyming.words,
      relatedWords: content.relatedWords.related,
      aiModel: 'claude-sonnet-4-20250514',
      aiGeneratedAt: new Date(),
      humanReviewed: false,
      status: 'PENDING_REVIEW',
    },
  });

  // 2. Etymology 저장
  if (content.etymology) {
    await prisma.etymology.upsert({
      where: { wordId },
      create: {
        wordId,
        origin: content.etymology.description,
        language: content.etymology.language,
        breakdown: content.etymology.breakdown,
      },
      update: { /* ... */ },
    });
  }

  // 3. Mnemonic 저장 (WHISK 프롬프트 포함)
  if (content.mnemonic) {
    await prisma.mnemonic.create({
      data: {
        wordId,
        title: '연상 기억법',
        content: content.mnemonic.description,
        koreanHint: content.mnemonic.koreanAssociation,
        whiskPrompt: content.mnemonic.imagePrompt,
        source: 'AI_GENERATED',
      },
    });
  }

  // 4. Examples 저장
  for (const example of content.examples) {
    await prisma.example.create({
      data: {
        wordId,
        sentence: example.sentenceEn,
        translation: example.sentenceKo,
        isFunny: example.isFunny,
        isReal: example.isReal,
        source: example.source,
      },
    });
  }

  // 5. Collocations 저장
  for (const collocation of content.collocations) {
    await prisma.collocation.create({
      data: {
        wordId,
        phrase: collocation.phrase,
        translation: collocation.translation,
        type: collocation.type,
        exampleEn: collocation.exampleEn,
        exampleKo: collocation.exampleKo,
      },
    });
  }

  // 6. Synonyms/Antonyms/Rhymes 저장
  // ... (관계 테이블에 저장)
}
```

---

## 4. 큐 시스템 (Bull/Redis)

### 4.1 시스템 위치

```
queue-system/
├── index.ts                          # 진입점 및 초기화
├── services/
│   ├── queue-manager.service.ts      # 큐 관리 클래스
│   └── job-processors.service.ts     # 작업 처리 로직
├── routes/
│   ├── queue.routes.ts               # REST API
│   └── queue-sse.routes.ts           # SSE 실시간 업데이트
└── types/
    └── queue.types.ts                # 타입 정의
```

### 4.2 큐 구성

```typescript
const QUEUE_NAMES = {
  CONTENT: 'vocavision:content',      // 콘텐츠 생성
  IMAGE: 'vocavision:image',          // 이미지 생성
  EXPORT: 'vocavision:export',        // 데이터 내보내기
  NOTIFICATION: 'vocavision:notification',  // 알림
} as const;
```

### 4.3 작업 유형

```typescript
type JobType =
  | 'content-generation'    // 단일 콘텐츠 생성
  | 'image-generation'      // 단일 이미지 생성
  | 'batch-content'         // 배치 콘텐츠 생성
  | 'batch-image'           // 배치 이미지 생성
  | 'content-review'        // 콘텐츠 검토 알림
  | 'export'                // 데이터 내보내기
  | 'import';               // 데이터 가져오기
```

### 4.4 Rate Limiting 설정

```typescript
const JOB_RATE_LIMITS: Record<JobType, { max: number; duration: number }> = {
  'content-generation': { max: 5, duration: 10000 },    // 5개/10초
  'image-generation': { max: 10, duration: 10000 },    // 10개/10초
  'batch-content': { max: 2, duration: 60000 },        // 2개/분
  'batch-image': { max: 2, duration: 60000 },          // 2개/분
  'content-review': { max: 20, duration: 10000 },      // 20개/10초
  'export': { max: 1, duration: 60000 },               // 1개/분
  'import': { max: 1, duration: 60000 },               // 1개/분
};
```

### 4.5 재시도 설정

```typescript
const JOB_RETRY_OPTIONS: Record<JobType, { attempts: number; backoff: number }> = {
  'content-generation': { attempts: 3, backoff: 5000 },   // 5초 → 10초 → 20초
  'image-generation': { attempts: 3, backoff: 3000 },     // 3초 → 6초 → 12초
  'batch-content': { attempts: 2, backoff: 10000 },       // 10초 → 20초
  'batch-image': { attempts: 2, backoff: 10000 },
  'content-review': { attempts: 2, backoff: 1000 },
  'export': { attempts: 2, backoff: 5000 },
  'import': { attempts: 2, backoff: 5000 },
};
```

### 4.6 QueueManager 사용법

```typescript
import { QueueManager } from './services/queue-manager.service';

// 초기화
const queueManager = QueueManager.getInstance();
await queueManager.initialize();

// 단일 작업 추가
const job = await queueManager.addJob(
  'vocavision:content',
  'content-generation',
  {
    wordId: 'uuid-123',
    word: 'abandon',
    examCategory: 'CSAT',
    level: 'B1',
  },
  { priority: 1 }
);

// 배치 작업 추가
const batchId = `batch-${Date.now()}`;
const jobs = await queueManager.addBatchJob(
  'vocavision:content',
  'batch-content',
  [
    { wordId: 'uuid-1', word: 'abandon' },
    { wordId: 'uuid-2', word: 'ability' },
  ],
  batchId
);

// 작업 상태 조회
const status = await queueManager.getJobStatus('vocavision:content', job.id);
// { id, state, progress, data, result, error, attempts, timestamp }

// 배치 진행률 조회
const progress = await queueManager.getBatchProgress('vocavision:content', batchId);
// { total, completed, failed, pending, progress }

// 큐 통계
const stats = await queueManager.getQueueStats('vocavision:content');
// { waiting, active, completed, failed, delayed, paused }

// 큐 제어
await queueManager.pauseQueue('vocavision:content');
await queueManager.resumeQueue('vocavision:content');
await queueManager.cleanQueue('vocavision:content');

// 종료
await queueManager.shutdown();
```

### 4.7 이벤트 리스닝

```typescript
// 이벤트 유형
type QueueEventType =
  | 'job:added'
  | 'job:started'
  | 'job:progress'
  | 'job:completed'
  | 'job:failed'
  | 'job:retrying'
  | 'batch:started'
  | 'batch:progress'
  | 'batch:completed'
  | 'queue:paused'
  | 'queue:resumed'
  | 'queue:error';

// 이벤트 리스닝
queueManager.on('job:completed', (event) => {
  console.log(`Job ${event.jobId} completed`, event.result);
});

queueManager.on('job:failed', (event) => {
  console.error(`Job ${event.jobId} failed`, event.error);
});

queueManager.on('batch:progress', (event) => {
  console.log(`Batch ${event.batchId}: ${event.progress}%`);
});
```

### 4.8 SSE 실시간 모니터링

```typescript
// 클라이언트 측 구현
const eventSource = new EventSource('/api/admin/queue/events/batch/batch-123');

eventSource.addEventListener('batch:progress', (event) => {
  const data = JSON.parse(event.data);
  updateProgressBar(data.progress);
});

eventSource.addEventListener('batch:completed', (event) => {
  const data = JSON.parse(event.data);
  showCompletionMessage(data);
  eventSource.close();
});

eventSource.addEventListener('job:failed', (event) => {
  const data = JSON.parse(event.data);
  showErrorMessage(data.error);
});
```

---

## 5. 이미지 생성 (WHISK Integration)

### 5.1 시스템 위치

```
whisk-integration/
├── services/
│   ├── image-generation.service.ts   # 이미지 생성 로직
│   └── prompt-optimizer.service.ts   # 프롬프트 최적화
├── routes/
│   └── image.routes.ts               # 이미지 API
├── components/
│   └── ImageGeneration.tsx           # React 컴포넌트
└── types/
    └── whisk.types.ts                # 타입 정의
```

### 5.2 지원 아트 스타일 (10가지)

```typescript
const IMAGE_STYLES: Record<string, StyleConfig> = {
  'cartoon': {
    name: '카툰',
    promptSuffix: 'cute cartoon style, vibrant colors, simple shapes, friendly characters',
    cfgScale: 7,
    steps: 30,
  },
  'anime': {
    name: '애니메이션',
    promptSuffix: 'anime style, soft shading, expressive eyes, Japanese animation',
    cfgScale: 7,
    steps: 30,
  },
  'watercolor': {
    name: '수채화',
    promptSuffix: 'watercolor painting, soft edges, flowing colors, artistic',
    cfgScale: 8,
    steps: 35,
  },
  'pixel': {
    name: '픽셀아트',
    promptSuffix: 'pixel art style, retro 8-bit graphics, blocky shapes',
    cfgScale: 7,
    steps: 25,
  },
  'sketch': {
    name: '스케치',
    promptSuffix: 'pencil sketch, hand-drawn, clean lines, educational',
    cfgScale: 7,
    steps: 30,
  },
  '3d-render': {
    name: '3D 렌더링',
    promptSuffix: '3D rendered, Pixar style, soft lighting, smooth surfaces',
    cfgScale: 7,
    steps: 35,
  },
  'comic': {
    name: '만화',
    promptSuffix: 'comic book style, bold outlines, dynamic poses, action',
    cfgScale: 7,
    steps: 30,
  },
  'minimalist': {
    name: '미니멀',
    promptSuffix: 'minimalist design, simple shapes, limited colors, clean',
    cfgScale: 8,
    steps: 25,
  },
  'vintage': {
    name: '빈티지',
    promptSuffix: 'vintage illustration, retro style, muted colors, nostalgic',
    cfgScale: 7,
    steps: 30,
  },
  'pop-art': {
    name: '팝아트',
    promptSuffix: 'pop art style, bold colors, halftone dots, Andy Warhol inspired',
    cfgScale: 7,
    steps: 30,
  },
};
```

### 5.3 이미지 생성 프로세스

```typescript
async function generateImage(request: ImageGenerationRequest): Promise<ImageResult> {
  const { wordId, word, mnemonicText, style = 'cartoon', size = '512x512' } = request;

  // 1. 프롬프트 최적화 (Claude 사용)
  const optimizedPrompt = await optimizeMnemonicPrompt({
    word,
    mnemonic: mnemonicText,
    style,
  });

  // 2. 이미지 생성 (Stability AI 우선)
  let imageBuffer: Buffer;
  try {
    imageBuffer = await generateWithStabilityAI(optimizedPrompt, style, size);
  } catch (error) {
    // 3. Fallback: DALL-E 3
    imageBuffer = await generateWithDALLE(optimizedPrompt, style, size);
  }

  // 4. Cloudinary 업로드
  const uploadResult = await uploadToCloudinary(imageBuffer, {
    folder: 'vocavision/mnemonics',
    public_id: `${wordId}-${Date.now()}`,
  });

  // 5. 썸네일 URL 생성
  const thumbnailUrl = getTransformedUrl(uploadResult.secure_url, {
    width: 128,
    height: 128,
    crop: 'fill',
  });

  // 6. DB 저장
  await prisma.wordImage.create({
    data: {
      wordId,
      imageUrl: uploadResult.secure_url,
      thumbnailUrl,
      description: optimizedPrompt.prompt,
      source: 'AI_GENERATED',
      aiPrompt: optimizedPrompt.prompt,
    },
  });

  return {
    imageUrl: uploadResult.secure_url,
    thumbnailUrl,
    prompt: optimizedPrompt.prompt,
  };
}
```

### 5.4 Stability AI 호출

```typescript
async function generateWithStabilityAI(
  prompt: OptimizedPrompt,
  style: string,
  size: string
): Promise<Buffer> {
  const [width, height] = size.split('x').map(Number);
  const styleConfig = IMAGE_STYLES[style];

  const response = await fetch(
    'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
      },
      body: JSON.stringify({
        text_prompts: [
          { text: prompt.prompt, weight: 1 },
          { text: prompt.negativePrompt, weight: -1 },
        ],
        cfg_scale: styleConfig.cfgScale,
        height: Math.min(height, 1024),
        width: Math.min(width, 1024),
        steps: styleConfig.steps,
        samples: 1,
        sampler: 'K_DPMPP_2M',
      }),
    }
  );

  const data = await response.json();
  return Buffer.from(data.artifacts[0].base64, 'base64');
}
```

### 5.5 프롬프트 최적화 (Claude)

```typescript
async function optimizeMnemonicPrompt(request: {
  word: string;
  mnemonic: string;
  style: string;
}): Promise<OptimizedPrompt> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: `You are an expert at creating image generation prompts for vocabulary mnemonics.

Guidelines:
- Focus on concrete, visual elements
- Avoid abstract concepts
- Make it memorable and educational
- Suitable for all ages
- No text in the image
- Consider the art style`,
    messages: [{
      role: 'user',
      content: `Word: "${request.word}"
Mnemonic: "${request.mnemonic}"
Style: ${request.style}

Create an optimized image prompt.`,
    }],
  });

  return JSON.parse(response.content[0].text);
}
```

---

## 6. 콘텐츠 검토/승인 워크플로우

### 6.1 콘텐츠 상태 흐름

```
                    ┌─────────────────┐
                    │      NEW        │
                    │  (단어 등록)     │
                    └────────┬────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    AI 콘텐츠 생성                            │
│            (Claude API → saveGeneratedContent)              │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ PENDING_REVIEW  │
                    │  (검토 대기)     │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
     ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
     │  APPROVED   │ │  REJECTED   │ │    EDIT     │
     │  (승인됨)   │ │  (거절됨)   │ │  (수정 중)  │
     └──────┬──────┘ └─────────────┘ └──────┬──────┘
            │                               │
            │                               │
            ▼                               │
     ┌─────────────┐                        │
     │  PUBLISHED  │ ◄──────────────────────┘
     │  (발행됨)   │        (수정 후 재승인)
     └─────────────┘
```

### 6.2 검토 API

```typescript
// 검토 요청
POST /content/review/:wordId
{
  "action": "approve" | "reject" | "edit",
  "fields": {                    // action이 "edit"일 때 수정할 필드
    "definition": "수정된 정의",
    "mnemonic": "수정된 연상법"
  },
  "reason": "검토 사유"         // 선택사항
}

// 응답
{
  "success": true,
  "wordId": "uuid-123",
  "newStatus": "APPROVED"
}
```

### 6.3 발행 API

```typescript
// 발행 요청 (APPROVED 상태에서만 가능)
POST /content/publish/:wordId

// 응답
{
  "success": true,
  "wordId": "uuid-123",
  "newStatus": "PUBLISHED"
}
```

### 6.4 감사 로그 (Audit Log)

모든 콘텐츠 변경사항은 `ContentAuditLog` 테이블에 기록됩니다.

```typescript
// 감사 이력 조회
GET /content/audit/:wordId?limit=50

// 응답
{
  "success": true,
  "wordId": "uuid-123",
  "logs": [
    {
      "id": "log-uuid",
      "entityType": "Word",
      "entityId": "uuid-123",
      "action": "APPROVE",
      "previousData": { "status": "PENDING_REVIEW" },
      "newData": { "status": "APPROVED" },
      "changedFields": ["status"],
      "performedById": "admin-uuid",
      "performedAt": "2024-01-21T10:30:00Z"
    }
  ]
}
```

---

## 7. 데이터베이스 스키마

### 7.1 핵심 테이블

```prisma
// 단어 (Word)
model Word {
  id              String        @id @default(uuid())
  word            String        @unique
  definition      String
  definitionKo    String?
  pronunciation   String?
  partOfSpeech    PartOfSpeech
  difficulty      DifficultyLevel
  cefrLevel       CEFRLevel?
  examCategory    ExamCategory

  // 발음 확장
  ipaUs           String?
  ipaUk           String?
  audioUrlUs      String?
  audioUrlUk      String?

  // 형태소 분석
  prefix          String?
  root            String?
  suffix          String?
  morphologyNote  String?

  // 관련어 배열
  synonymList     String[]
  antonymList     String[]
  rhymingWords    String[]
  relatedWords    String[]

  // 콘텐츠 상태
  status          ContentStatus @default(DRAFT)
  isActive        Boolean       @default(true)
  publishedAt     DateTime?

  // AI 메타데이터
  aiModel         String?
  aiGeneratedAt   DateTime?
  humanReviewed   Boolean       @default(false)
  reviewedBy      String?
  reviewedAt      DateTime?

  // 관계
  examples        Example[]
  images          WordImage[]
  mnemonics       Mnemonic[]
  etymology       Etymology?
  collocations    Collocation[]
  synonyms        Synonym[]
  antonyms        Antonym[]
}

// 예문 (Example)
model Example {
  id            String   @id @default(uuid())
  wordId        String
  sentence      String
  translation   String?
  isFunny       Boolean  @default(false)
  isReal        Boolean  @default(true)
  source        String?
  order         Int      @default(0)
  word          Word     @relation(...)
}

// 연상 기억법 (Mnemonic)
model Mnemonic {
  id            String   @id @default(uuid())
  wordId        String
  title         String
  content       String
  koreanHint    String?
  imageUrl      String?
  whiskPrompt   String?       // WHISK 이미지 생성 프롬프트
  whiskStyle    String?       // 아트 스타일
  gifUrl        String?
  source        MnemonicSource
  word          Word     @relation(...)
}

// 콜로케이션 (Collocation)
model Collocation {
  id            String   @id @default(uuid())
  wordId        String
  phrase        String
  translation   String?
  type          String?       // "verb+noun", "adj+noun" 등
  exampleEn     String?
  exampleKo     String?
  frequency     Int      @default(0)
  order         Int      @default(0)
  word          Word     @relation(...)
}

// 어원 (Etymology)
model Etymology {
  id            String   @id @default(uuid())
  wordId        String   @unique
  origin        String
  language      String?
  rootWords     String[]
  evolution     String
  breakdown     String?
  word          Word     @relation(...)
}

// 이미지 (WordImage)
model WordImage {
  id            String      @id @default(uuid())
  wordId        String
  imageUrl      String
  thumbnailUrl  String?
  description   String?
  source        ImageSource
  aiPrompt      String?
  word          Word        @relation(...)
}

// 감사 로그 (ContentAuditLog)
model ContentAuditLog {
  id            String   @id @default(uuid())
  entityType    String
  entityId      String
  action        String
  previousData  Json?
  newData       Json?
  changedFields String[]
  performedById String?
  performedAt   DateTime @default(now())
}

// 콘텐츠 생성 작업 (ContentGenerationJob)
model ContentGenerationJob {
  id            String      @id @default(uuid())
  wordId        String?
  batchId       String?
  inputWords    String[]
  status        String      @default("pending")
  progress      Int         @default(0)
  examCategory  ExamCategory?
  cefrLevel     CEFRLevel?
  result        Json?
  errorMessage  String?
  requestedById String?
  startedAt     DateTime?
  completedAt   DateTime?
  createdAt     DateTime    @default(now())
}
```

### 7.2 Enum 정의

```prisma
enum ContentStatus {
  DRAFT           // 초안 (AI 생성 직후)
  PENDING_REVIEW  // 검토 대기
  APPROVED        // 승인됨
  PUBLISHED       // 발행됨
  ARCHIVED        // 보관됨
}

enum ExamCategory {
  CSAT      // 수능
  TEPS      // 텝스
  TOEIC     // 토익
  TOEFL     // 토플
  SAT       // SAT
}

enum CEFRLevel {
  A1  A2  B1  B2  C1  C2
}

enum PartOfSpeech {
  NOUN  VERB  ADJECTIVE  ADVERB
  PRONOUN  PREPOSITION  CONJUNCTION  INTERJECTION
}

enum ImageSource {
  AI_GENERATED  STOCK_PHOTO  ILLUSTRATION  USER_UPLOADED
}

enum MnemonicSource {
  AI_GENERATED  EXPERT_CREATED  COMMUNITY
}
```

---

## 8. API 레퍼런스

### 8.1 콘텐츠 생성 API

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `POST` | `/content/generate` | 단일 단어 콘텐츠 생성 |
| `POST` | `/content/batch` | 배치 콘텐츠 생성 (최대 100개) |
| `GET` | `/content/jobs` | 작업 목록 조회 |
| `GET` | `/content/jobs/:jobId` | 작업 상태 조회 |
| `GET` | `/content/pending` | 검토 대기 콘텐츠 목록 |
| `POST` | `/content/review/:wordId` | 콘텐츠 검토 |
| `POST` | `/content/publish/:wordId` | 콘텐츠 발행 |
| `GET` | `/content/audit/:wordId` | 감사 이력 조회 |

### 8.2 이미지 생성 API

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/api/admin/images/styles` | 스타일 목록 |
| `POST` | `/api/admin/images/preview-prompt` | 프롬프트 미리보기 |
| `POST` | `/api/admin/images/generate` | 단일 이미지 생성 |
| `POST` | `/api/admin/images/generate-batch` | 배치 이미지 생성 (최대 50개) |
| `DELETE` | `/api/admin/images/:wordId` | 이미지 삭제 |
| `GET` | `/api/admin/images/stats` | 생성 통계 |
| `GET` | `/api/admin/images/pending` | 이미지 없는 단어 목록 |

### 8.3 큐 관리 API

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/api/admin/queue/stats` | 전체 큐 통계 |
| `GET` | `/api/admin/queue/:queueName/stats` | 특정 큐 통계 |
| `POST` | `/api/admin/queue/:queueName/pause` | 큐 일시정지 |
| `POST` | `/api/admin/queue/:queueName/resume` | 큐 재개 |
| `POST` | `/api/admin/queue/:queueName/clean` | 큐 정리 |
| `GET` | `/api/admin/queue/events` | SSE 전체 이벤트 |
| `GET` | `/api/admin/queue/events/job/:jobId` | SSE 작업별 이벤트 |
| `GET` | `/api/admin/queue/events/batch/:batchId` | SSE 배치별 이벤트 |

### 8.4 요청/응답 예시

#### 단일 콘텐츠 생성

```typescript
// 요청
POST /content/generate
{
  "word": "abandon",
  "examCategory": "CSAT",
  "cefrLevel": "B1",
  "saveToDb": true
}

// 응답
{
  "success": true,
  "word": "abandon",
  "content": { /* GeneratedContent */ },
  "wordId": "uuid-123"
}
```

#### 배치 콘텐츠 생성

```typescript
// 요청
POST /content/batch
{
  "words": ["abandon", "ability", "able"],
  "examCategory": "CSAT",
  "cefrLevel": "B1"
}

// 응답
{
  "success": true,
  "jobId": "job-123",
  "message": "Batch job created for 3 words"
}
```

#### 이미지 생성

```typescript
// 요청
POST /api/admin/images/generate
{
  "wordId": "uuid-123",
  "style": "anime",
  "size": "512x512"
}

// 응답
{
  "success": true,
  "data": {
    "imageUrl": "https://res.cloudinary.com/...",
    "thumbnailUrl": "https://res.cloudinary.com/.../128x128",
    "prompt": "Optimized prompt used"
  }
}
```

---

## 9. 에러 처리 및 재시도

### 9.1 에러 코드

| 코드 | 설명 | 재시도 |
|------|------|--------|
| `RATE_LIMIT_EXCEEDED` | API 호출 한도 초과 | O |
| `GENERATION_FAILED` | AI 생성 실패 | O |
| `NO_CONTENT` | 생성할 콘텐츠 없음 | X |
| `NO_MNEMONIC` | 연상법 없음 (이미지용) | X |
| `VALIDATION_ERROR` | 입력 검증 실패 | X |
| `UPLOAD_FAILED` | 이미지 업로드 실패 | O |
| `DATABASE_ERROR` | DB 오류 | O |

### 9.2 에러 응답 형식

```typescript
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again in 45 seconds.",
    "jobId": "job-123",
    "retryable": true,
    "retryAfter": 45000,
    "timestamp": "2024-01-21T10:30:00Z"
  }
}
```

### 9.3 재시도 전략

```typescript
// 지수 백오프
const backoffDelay = baseDelay * Math.pow(2, attemptNumber - 1);

// 콘텐츠 생성: 5초 → 10초 → 20초
// 이미지 생성: 3초 → 6초 → 12초
// 배치 작업: 10초 → 20초
```

---

## 10. 성능 최적화

### 10.1 동시 처리 설정

| 큐 | 동시 처리 수 | 이유 |
|----|-------------|------|
| 콘텐츠 생성 | 3 | Claude API 부하 분산 |
| 이미지 생성 | 2 | Stability AI Rate Limit |
| 내보내기 | 1 | I/O 집약적 작업 |

### 10.2 처리 시간 예상

| 작업 | 평균 | 범위 |
|-----|------|------|
| 단일 콘텐츠 생성 | 8-12초 | 6-20초 |
| 단일 이미지 생성 | 15-25초 | 10-45초 |
| 배치 콘텐츠 (10개) | 90-120초 | 70-200초 |
| 배치 이미지 (10개) | 150-250초 | 100-400초 |

### 10.3 처리량

| 작업 | 시간당 | 일일 |
|-----|--------|------|
| 콘텐츠 생성 | ~1,800개 | ~43,200개 |
| 이미지 생성 | ~1,080개 | ~25,920개 |

### 10.4 최적화 팁

```typescript
// 1. 배치 작업 간 딜레이
await new Promise(resolve => setTimeout(resolve, 500));

// 2. Redis 메모리 관리
const cleanOptions = {
  completed: { count: 100 },  // 최근 100개만 유지
  failed: { count: 50 },      // 최근 50개만 유지
  delayed: { count: 100 },
};

// 3. 이미지 크기 최적화
const sizes = {
  main: '512x512',      // 학습 카드용
  thumbnail: '128x128', // 목록용
};
```

---

## 11. 비용 추정

### 11.1 API별 비용

| API | 단위 비용 | 비고 |
|-----|----------|------|
| Claude | ~$0.08/단어 | 2K 입력 + 1K 출력 토큰 |
| Stability AI SDXL | $0.002-0.006/이미지 | 크기별 |
| DALL-E 3 (백업) | $0.04-0.08/이미지 | Standard/HD |
| Cloudinary | 무료 티어 | 25GB 저장/대역폭 |

### 11.2 1,000 단어 기준

```
콘텐츠 생성: 1,000 × $0.08     = $80
이미지 생성: 1,000 × $0.004    = $4
프롬프트 최적화: 1,000 × $0.003 = $3
────────────────────────────────
총 비용: ~$87
```

---

## 12. 배포 및 설정

### 12.1 환경 변수

```env
# Claude API
ANTHROPIC_API_KEY=sk-ant-...

# Stability AI
STABILITY_API_KEY=sk-...

# OpenAI (Fallback)
OPENAI_API_KEY=sk-...

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=123456
CLOUDINARY_API_SECRET=secret

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Database
DATABASE_URL=postgresql://user:pass@host:5432/vocavision
```

### 12.2 초기화 코드

```typescript
import express from 'express';
import { initializeQueueSystem, setupQueueRoutes } from './queue-system';
import contentGenerationRoutes from './routes/contentGeneration.routes';
import imageRoutes from './whisk-integration/routes/image.routes';

const app = express();

// 큐 시스템 초기화
await initializeQueueSystem({
  redisHost: process.env.REDIS_HOST,
  redisPort: parseInt(process.env.REDIS_PORT || '6379'),
  registerProcessors: true,
});

// 라우트 설정
app.use('/content', authenticateToken, requireAdmin, contentGenerationRoutes);
app.use('/api/admin/images', authenticateToken, requireAdmin, imageRoutes);
setupQueueRoutes(app, {
  basePath: '/api/admin/queue',
  authMiddleware: authenticateToken,
  adminMiddleware: requireAdmin,
});

// Graceful Shutdown
process.on('SIGTERM', async () => {
  await shutdownQueueSystem();
  process.exit(0);
});
```

---

## 13. 모니터링

### 13.1 로그 레벨

```typescript
// INFO
[ContentGenerator] Content generation started for "abandon"
[ContentGenerator] Content saved successfully
[QueueManager] Job completed: job-123

// WARN
[ContentGenerator] Rate limit approaching, slowing down
[ImageGen] Stability AI failed, trying DALL-E fallback

// ERROR
[ContentGenerator] Generation failed: Invalid API response
[QueueManager] Job failed after 3 attempts: job-123
```

### 13.2 메트릭

```typescript
// 큐 상태
await queueManager.getDashboardStats();
// {
//   queues: { content: {...}, image: {...} },
//   totalJobs: { waiting: 5, active: 3, completed: 1000, failed: 10 },
//   redis: { connected: true, memory: '50MB' }
// }

// SSE 연결
GET /api/admin/queue/events/stats
// { connectedClients: 5, eventsPerMinute: 120 }
```

---

## 14. 파일 경로 맵

### 14.1 백엔드 서비스

```
backend/src/
├── controllers/
│   └── contentGeneration.controller.ts    # 콘텐츠 생성 컨트롤러
├── services/
│   └── contentGenerator.service.ts        # Claude API 콘텐츠 생성
├── routes/
│   └── contentGeneration.routes.ts        # 콘텐츠 API 라우트
└── prisma/
    └── schema.prisma                      # 데이터베이스 스키마
```

### 14.2 큐 시스템

```
queue-system/
├── index.ts                               # 진입점
├── services/
│   ├── queue-manager.service.ts           # 큐 관리자
│   └── job-processors.service.ts          # 작업 처리기
├── routes/
│   ├── queue.routes.ts                    # REST API
│   └── queue-sse.routes.ts                # SSE 엔드포인트
└── types/
    └── queue.types.ts                     # 타입 정의
```

### 14.3 이미지 생성

```
whisk-integration/
├── services/
│   ├── image-generation.service.ts        # 이미지 생성
│   └── prompt-optimizer.service.ts        # 프롬프트 최적화
├── routes/
│   └── image.routes.ts                    # 이미지 API
├── components/
│   └── ImageGeneration.tsx                # React 컴포넌트
└── types/
    └── whisk.types.ts                     # 타입 정의
```

### 14.4 문서

```
docs/
├── CONTENT_PIPELINE.md                    # 이 문서
├── ARCHITECTURE.md                        # 시스템 아키텍처
├── API_REFERENCE.md                       # API 레퍼런스
queue-system/
└── QUEUE-SYSTEM-GUIDE.md                  # 큐 시스템 가이드
whisk-integration/
└── WHISK-INTEGRATION-GUIDE.md             # 이미지 생성 가이드
```

---

## 부록: 빠른 참조 카드

### A. 콘텐츠 생성 체크리스트

```
□ 단어 목록 준비
□ examCategory 선택 (CSAT/TOEIC/TOEFL/...)
□ cefrLevel 선택 (A1-C2)
□ 배치 크기 확인 (최대 100개)
□ API 키 확인
□ Redis 연결 확인
□ 작업 시작 후 SSE로 진행률 모니터링
□ 완료 후 검토/승인 진행
```

### B. 트러블슈팅

| 증상 | 원인 | 해결 |
|------|------|------|
| 작업 멈춤 | Redis 연결 끊김 | Redis 재시작 |
| 콘텐츠 없음 | JSON 파싱 실패 | 로그 확인, 프롬프트 수정 |
| 이미지 실패 | Rate limit | 대기 후 재시도 |
| 느린 처리 | 동시성 높음 | 동시성 낮추기 |

### C. 유용한 명령어

```bash
# 큐 상태 확인
curl http://localhost:3001/api/admin/queue/stats

# 배치 생성
curl -X POST http://localhost:3001/content/batch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"words": ["test"], "examCategory": "CSAT"}'

# SSE 모니터링
curl http://localhost:3001/api/admin/queue/events
```

---

> **문서 끝**
>
> 질문이나 개선 제안은 GitHub Issues로 남겨주세요.
