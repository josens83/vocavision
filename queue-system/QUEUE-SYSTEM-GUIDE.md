# VocaVision Queue System - 작업 큐 시스템 가이드

## 개요

VocaVision의 대량 작업 처리를 위한 Bull/Redis 기반 작업 큐 시스템입니다.

**핵심 기능:**
- 이미지 생성 배치 처리
- 콘텐츠 생성 배치 처리
- CSV/Excel 대량 가져오기
- 데이터 내보내기
- 실시간 진행률 모니터링 (SSE)
- 작업 우선순위 관리
- 자동 재시도 및 에러 처리

**기술 스택:**
- Bull (Redis-based Queue)
- Redis (Message Broker)
- Express.js (API)
- Server-Sent Events (실시간 업데이트)
- React (Admin Dashboard)

---

## 파일 구조

```
queue-system/
├── types/
│   └── queue.types.ts           # 타입 정의 & 설정
├── services/
│   ├── queue-manager.service.ts # 큐 관리 핵심 로직
│   └── job-processors.service.ts# 작업 처리기
├── routes/
│   ├── queue.routes.ts          # REST API 엔드포인트
│   └── queue-sse.routes.ts      # SSE 실시간 스트리밍
├── components/
│   └── QueueDashboard.tsx       # Admin UI 컴포넌트
├── index.ts                     # 메인 진입점
└── QUEUE-SYSTEM-GUIDE.md        # 이 문서
```

---

## 설치 및 설정

### 1. 의존성 설치

```bash
npm install bull ioredis
npm install @types/bull --save-dev
```

### 2. Redis 설치

```bash
# macOS
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt install redis-server
sudo systemctl start redis

# Docker
docker run -d --name redis -p 6379:6379 redis:alpine
```

### 3. 환경 변수 설정

```env
# .env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

### 4. Express 앱에 연결

```typescript
// backend/src/app.ts
import {
  initializeQueueSystem,
  setupQueueRoutes,
} from './queue-system';

// 서버 시작 시 큐 시스템 초기화
async function startServer() {
  const app = express();

  // 큐 시스템 초기화
  await initializeQueueSystem({
    redisHost: process.env.REDIS_HOST,
    redisPort: parseInt(process.env.REDIS_PORT || '6379'),
    registerProcessors: true,
  });

  // 큐 라우트 설정
  setupQueueRoutes(app, {
    basePath: '/api/admin/queue',
    authMiddleware: authMiddleware,
    adminMiddleware: adminMiddleware,
  });

  app.listen(4000);
}
```

---

## 작업 유형

| 유형 | 설명 | 동시 처리 | 타임아웃 |
|------|------|-----------|----------|
| `image-generation` | AI 이미지 생성 | 3개 | 10분 |
| `content-generation` | Claude 콘텐츠 생성 | 5개 | 5분 |
| `batch-import` | CSV/Excel 가져오기 | 1개 | 30분 |
| `export` | 데이터 내보내기 | 2개 | 10분 |
| `cleanup` | 정리 작업 | 1개 | 5분 |

---

## API 엔드포인트

### 큐 통계

```
GET /api/admin/queue/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "waiting": 5,
    "active": 2,
    "completed": 150,
    "failed": 3,
    "delayed": 0,
    "paused": 0,
    "isPaused": false,
    "jobCounts": {
      "image-generation": 100,
      "content-generation": 50,
      "batch-import": 5,
      "export": 3,
      "cleanup": 2
    }
  }
}
```

### 작업 목록

```
GET /api/admin/queue/jobs?type=image-generation&status=active&page=1&limit=20
```

### 이미지 생성 작업 생성

```
POST /api/admin/queue/jobs/image-generation
```

**Request:**
```json
{
  "wordIds": ["uuid-1", "uuid-2", "uuid-3"],
  "style": "cartoon",
  "size": "512x512",
  "regenerate": false,
  "priority": "normal"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "image-generation-abc123",
    "type": "image-generation",
    "totalWords": 3,
    "status": "waiting"
  }
}
```

### 콘텐츠 생성 작업 생성

```
POST /api/admin/queue/jobs/content-generation
```

**Request:**
```json
{
  "wordIds": ["uuid-1", "uuid-2"],
  "options": {
    "generateMnemonic": true,
    "generateExamples": true,
    "generateEtymology": false
  },
  "priority": "high"
}
```

### 작업 상세 조회

```
GET /api/admin/queue/jobs/:jobId
```

### 작업 재시도

```
POST /api/admin/queue/jobs/:jobId/retry
```

### 작업 취소

```
POST /api/admin/queue/jobs/:jobId/cancel
```

### 작업 삭제

```
DELETE /api/admin/queue/jobs/:jobId
```

### 큐 제어

```
POST /api/admin/queue/action
```

**Request:**
```json
{
  "action": "pause" | "resume" | "clean" | "empty",
  "options": {
    "status": "completed" | "failed",
    "grace": 0
  }
}
```

---

## SSE 실시간 업데이트

### 전체 이벤트 스트림

```javascript
const eventSource = new EventSource('/api/admin/queue/events');

eventSource.addEventListener('queue-stats', (event) => {
  const stats = JSON.parse(event.data);
  console.log('Queue stats:', stats);
});

eventSource.addEventListener('job-progress', (event) => {
  const { jobId, progress } = JSON.parse(event.data);
  console.log(`Job ${jobId}: ${progress.percent}%`);
});

eventSource.addEventListener('job-completed', (event) => {
  const { jobId, result } = JSON.parse(event.data);
  console.log(`Job ${jobId} completed:`, result);
});

eventSource.addEventListener('job-failed', (event) => {
  const { jobId, error } = JSON.parse(event.data);
  console.error(`Job ${jobId} failed:`, error);
});
```

### 특정 작업 모니터링

```javascript
const eventSource = new EventSource(`/api/admin/queue/events/job/${jobId}`);
```

---

## 사용 예시

### 프로그래밍 방식 작업 생성

```typescript
import { QueueManager } from './queue-system';

// 이미지 생성 작업
const imageJob = await QueueManager.addImageGenerationJob(
  ['word-1', 'word-2', 'word-3'],
  {
    style: 'anime',
    size: '512x512',
    regenerate: false,
    priority: 'high',
    createdBy: 'admin-user-id',
  }
);

console.log('Created job:', imageJob.id);

// 작업 진행률 모니터링
QueueManager.on('job-progress', ({ jobId, progress }) => {
  if (jobId === imageJob.id) {
    console.log(`Progress: ${progress.percent}%`);
  }
});
```

### 작업 완료 대기

```typescript
import { QueueManager } from './queue-system';

const job = await QueueManager.addImageGenerationJob(wordIds, options);

// Promise 방식으로 완료 대기
const queue = QueueManager.getQueue();
const completedJob = await queue.getJob(job.id);
const result = await completedJob.finished();

console.log('Job result:', result);
```

---

## 작업 우선순위

| 우선순위 | 값 | 설명 |
|----------|-----|------|
| `critical` | 1 | 긴급 - 즉시 처리 |
| `high` | 2 | 높음 - 우선 처리 |
| `normal` | 3 | 보통 - 기본값 |
| `low` | 4 | 낮음 - 여유 시 처리 |

---

## 에러 처리 및 재시도

### 자동 재시도

- 실패 시 최대 3회 재시도
- Exponential backoff (2초 -> 4초 -> 8초)

### 수동 재시도

```bash
curl -X POST /api/admin/queue/jobs/{jobId}/retry
```

### 에러 로그

작업 실패 시 `JobProgress.errors`에 에러 정보가 기록됩니다:

```typescript
interface JobError {
  itemId?: string;
  itemName?: string;
  code: string;
  message: string;
  timestamp: string;
}
```

---

## Admin UI 사용법

### 대시보드 페이지 추가

```tsx
// app/admin/queue/page.tsx
import { QueueDashboard } from '@/queue-system/components/QueueDashboard';

export default function QueuePage() {
  return (
    <div className="p-6">
      <QueueDashboard />
    </div>
  );
}
```

### AdminDashboard에 네비게이션 추가

```typescript
// AdminDashboard.tsx의 navItems에 추가
{
  id: 'queue',
  label: '작업 큐',
  icon: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
}
```

---

## 성능 최적화

### 동시 처리 수 조정

```typescript
// queue.types.ts의 JOB_TYPE_CONFIGS 수정
'image-generation': {
  timeout: 600000,
  attempts: 3,
  priority: 2,
  concurrency: 5,  // 3 -> 5로 증가
},
```

### Rate Limiting

```typescript
limiter: {
  max: 10,      // 10초당 최대 10개
  duration: 10000,
},
```

### 작업 정리

```typescript
// 오래된 완료 작업 자동 정리
await QueueManager.cleanQueue(
  86400000, // 24시간 이상 된 작업
  'completed'
);
```

---

## 모니터링

### Bull Board (선택적)

```bash
npm install @bull-board/express
```

```typescript
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';

const serverAdapter = new ExpressAdapter();
createBullBoard({
  queues: [new BullAdapter(QueueManager.getQueue())],
  serverAdapter,
});

app.use('/admin/queues', serverAdapter.getRouter());
```

---

## 트러블슈팅

### "Redis connection refused"
- Redis 서버 실행 확인: `redis-cli ping`
- 환경 변수 확인: `REDIS_HOST`, `REDIS_PORT`

### "Job stalled"
- 처리 시간이 타임아웃 초과
- 타임아웃 증가 또는 작업 분할

### "Too many active jobs"
- concurrency 설정 확인
- Redis 메모리 확인

### "SSE connection drops"
- Nginx 버퍼링 비활성화: `X-Accel-Buffering: no`
- 하트비트 간격 조정

---

## 체크리스트

### 설정 확인
- [ ] Redis 서버 실행 중
- [ ] 환경 변수 설정
- [ ] 큐 시스템 초기화
- [ ] 프로세서 등록
- [ ] 라우트 연결

### 테스트
- [ ] 단일 작업 생성 테스트
- [ ] 배치 작업 생성 테스트
- [ ] SSE 실시간 업데이트 확인
- [ ] 작업 재시도 확인
- [ ] Admin UI 동작 확인

---

## 라이선스

VocaVision 프로젝트 내부용
