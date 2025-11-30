# VocaVision - AI 이미지 생성 (WHISK) 연동 가이드

## 개요

VocaVision의 연상 기억법(Mnemonic)을 AI 이미지로 자동 변환하는 파이프라인입니다.

**핵심 기능:**
- 연상 기억법 텍스트 -> AI 이미지 생성
- 10가지 아트 스타일 지원
- Cloudinary 자동 업로드 및 최적화
- 배치 처리 (최대 50개 동시)
- Claude AI 프롬프트 최적화

**기술 스택:**
- Stability AI (SDXL) - Primary 이미지 생성
- OpenAI DALL-E 3 - Fallback
- Cloudinary - 이미지 저장/CDN
- Claude API - 프롬프트 최적화

---

## 파일 구조

```
whisk-integration/
├── types/
│   └── whisk.types.ts           # 타입 정의 & 스타일 설정
├── services/
│   ├── image-generation.service.ts  # 이미지 생성 핵심 로직
│   └── prompt-optimizer.service.ts  # Claude 프롬프트 최적화
├── routes/
│   └── image.routes.ts          # Express API 엔드포인트
├── components/
│   └── ImageGeneration.tsx      # Admin UI 컴포넌트
├── prisma/
│   └── schema-extension.prisma  # DB 스키마 확장
└── WHISK-INTEGRATION-GUIDE.md   # 이 문서
```

---

## 설치 및 설정

### 1. 의존성 설치

```bash
npm install @anthropic-ai/sdk
# Stability AI SDK는 REST API 직접 호출
```

### 2. 환경 변수 설정

```env
# .env

# Stability AI (Primary)
STABILITY_API_KEY=sk-...

# OpenAI DALL-E (Fallback)
OPENAI_API_KEY=sk-...

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789
CLOUDINARY_API_SECRET=abcdefghijk

# Claude (프롬프트 최적화용)
ANTHROPIC_API_KEY=sk-ant-...
```

### 3. API 키 발급 방법

#### Stability AI
1. https://platform.stability.ai 접속
2. 계정 생성 및 로그인
3. API Keys 섹션에서 키 생성
4. 요금: $0.002-0.02/이미지 (SDXL)

#### Cloudinary
1. https://cloudinary.com 접속
2. 무료 계정 생성
3. Dashboard에서 Cloud Name, API Key, API Secret 확인
4. 무료: 25GB 저장/25GB 대역폭/월

### 4. DB 마이그레이션

```bash
# schema-extension.prisma 내용을 schema.prisma에 머지 후
npx prisma migrate dev --name add_image_generation
```

### 5. 라우터 연결

```typescript
// backend/src/app.ts
import imageRoutes from './routes/image.routes';

// ... 기존 라우터 아래에 추가
app.use('/api/admin/images', authMiddleware, adminMiddleware, imageRoutes);
```

---

## 지원 스타일 (10종)

| 스타일 | 한글 | 설명 | 추천 용도 |
|--------|------|------|-----------|
| `cartoon` | 카툰 | 밝고 친근한 카툰 | 일반 학습 (기본) |
| `anime` | 애니메이션 | 일본 애니 스타일 | 젊은 학습자 |
| `watercolor` | 수채화 | 부드러운 수채화 | 감성적 단어 |
| `pixel` | 픽셀아트 | 레트로 게임 스타일 | 게임/IT 단어 |
| `sketch` | 스케치 | 연필 스케치 | 학술적 단어 |
| `3d-render` | 3D 렌더링 | Pixar 스타일 3D | 구체적 사물 |
| `comic` | 만화 | 미국 코믹북 | 액션 단어 |
| `minimalist` | 미니멀 | 심플한 벡터 | 추상적 개념 |
| `vintage` | 빈티지 | 1950s 레트로 | 역사/전통 단어 |
| `pop-art` | 팝아트 | Andy Warhol 스타일 | 현대적 단어 |

---

## API 엔드포인트

### GET /api/admin/images/styles
사용 가능한 스타일 목록

**Response:**
```json
{
  "success": true,
  "data": {
    "styles": [
      { "value": "cartoon", "label": "Cartoon", "labelKo": "카툰" },
      { "value": "anime", "label": "Anime", "labelKo": "애니메이션" }
    ]
  }
}
```

### POST /api/admin/images/generate
단일 이미지 생성

**Request:**
```json
{
  "wordId": "uuid-here",
  "style": "cartoon",
  "size": "512x512",
  "regenerate": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "wordId": "uuid",
    "word": "abandon",
    "imageUrl": "https://res.cloudinary.com/.../abandon-123.png",
    "thumbnailUrl": "https://res.cloudinary.com/.../abandon-123-thumb.webp",
    "style": "cartoon",
    "generatedAt": "2025-01-15T12:00:00Z",
    "metadata": {
      "model": "stability-sdxl",
      "seed": 12345,
      "steps": 30
    }
  }
}
```

### POST /api/admin/images/generate-batch
배치 이미지 생성 (최대 50개)

**Request:**
```json
{
  "wordIds": ["uuid1", "uuid2", "uuid3"],
  "style": "anime",
  "regenerate": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 3,
    "successful": 2,
    "failed": 1,
    "results": [
      { "wordId": "uuid1", "success": true, "imageUrl": "..." },
      { "wordId": "uuid2", "success": true, "imageUrl": "..." },
      { "wordId": "uuid3", "success": false, "error": "Rate limit exceeded" }
    ]
  }
}
```

### POST /api/admin/images/preview-prompt
프롬프트 미리보기 (이미지 생성 없이)

**Request:**
```json
{
  "word": "abandon",
  "mnemonic": "A band on a ship abandons their instruments",
  "mnemonicKorean": "어밴던 = 어! 밴드가 (배를) 버리다",
  "style": "cartoon"
}
```

### GET /api/admin/images/stats
이미지 생성 통계

### GET /api/admin/images/pending
이미지 생성 대기 단어 목록

### DELETE /api/admin/images/:wordId
단어의 이미지 삭제

---

## 사용 예시

### 단일 이미지 생성

```typescript
import { ImageGenerationService } from './services/image-generation.service';

const result = await ImageGenerationService.generate({
  wordId: 'word-uuid',
  word: 'abandon',
  mnemonic: 'A band on a ship abandons their instruments during a storm',
  mnemonicKorean: '어밴던 = 어! 밴드가 버리고 가다',
  style: 'cartoon',
  size: '512x512',
});

if (result.success) {
  console.log('Image URL:', result.imageUrl);
  console.log('Thumbnail:', result.thumbnailUrl);
}
```

### 프롬프트 최적화

```typescript
import { PromptOptimizer } from './services/prompt-optimizer.service';

const optimized = await PromptOptimizer.optimize({
  word: 'abandon',
  mnemonic: 'A band on a ship abandons their instruments',
  style: 'cartoon',
  targetAudience: 'adult',
});

console.log('Optimized Prompt:', optimized.prompt);
// Output: "A cartoon band of musicians on a wooden ship deck,
//          throwing their instruments overboard during a storm,
//          cute cartoon style, vibrant colors..."
```

### 배치 처리

```typescript
import { ImageGenerationService } from './services/image-generation.service';

const results = await ImageGenerationService.generateBatch(
  [
    { wordId: '1', word: 'abandon', mnemonic: '...', style: 'cartoon' },
    { wordId: '2', word: 'abundant', mnemonic: '...', style: 'cartoon' },
    { wordId: '3', word: 'accelerate', mnemonic: '...', style: 'cartoon' },
  ],
  {
    maxConcurrent: 3,
    onProgress: (completed, total, result) => {
      console.log(`Progress: ${completed}/${total}`);
    },
  }
);

console.log(`Success: ${results.successful}/${results.total}`);
```

---

## 프롬프트 구조

### 기본 프롬프트 템플릿

```
A memorable illustration for learning the English word "{word}".
Scene: {mnemonic}
Style: {styleConfig.promptSuffix}
The image should be educational, memorable, and help visualize the meaning.
```

### 스타일별 프롬프트 접미사 예시

**Cartoon:**
```
cute cartoon style, vibrant colors, simple shapes, friendly characters,
children's book illustration
```

**Anime:**
```
anime style, japanese animation, colorful, expressive,
studio ghibli inspired
```

**3D Render:**
```
3d render, Pixar style, cute 3d character, soft lighting,
clay render, octane render
```

### Negative Prompt (제외할 요소)

```
text, watermark, signature, blurry, low quality, deformed, ugly,
nsfw, violence, realistic (for cartoon), photographic
```

---

## 비용 추정

### Stability AI (SDXL)
- 기본: ~$0.002/이미지 (512x512)
- 고해상도: ~$0.006/이미지 (1024x1024)
- 1,000개 단어: **~$2-6**

### OpenAI DALL-E 3 (Fallback)
- Standard: $0.04/이미지 (1024x1024)
- HD: $0.08/이미지
- 1,000개 단어: **~$40-80**

### Cloudinary (저장)
- 무료 티어: 25GB 저장/월
- 이미지당 ~50KB = 약 500,000개 저장 가능

### Claude (프롬프트 최적화, 선택)
- Sonnet: ~$0.003/요청
- 1,000개 단어: **~$3**

**총 예상 비용 (1,000 단어):**
- Stability AI만: ~$5
- DALL-E Fallback 포함: ~$50
- 프롬프트 최적화 포함: +$3

---

## 성능 최적화

### Rate Limiting
```typescript
const RATE_LIMITS = {
  stabilityAi: {
    maxRequests: 50,
    windowMs: 10000,        // 10초당 50개
    delayBetweenRequests: 200,
  },
  batch: {
    maxConcurrent: 3,       // 동시 3개
    delayBetweenBatches: 2000,
  },
};
```

### 권장 배치 크기
- 소량 테스트: 10개
- 일반 배치: 20-30개
- 대량 처리: 50개 (최대)

### 재시도 로직
- 실패 시 최대 3회 재시도
- Exponential backoff (1s -> 2s -> 4s)

---

## 트러블슈팅

### "Rate limit exceeded"
- 요청 간격 늘리기 (`delayBetweenRequests: 500`)
- 동시 요청 수 줄이기 (`maxConcurrent: 2`)

### "Content policy violation"
- 프롬프트에 부적절한 내용 포함
- Negative prompt 강화

### "Cloudinary upload failed"
- API 키 확인
- 저장 용량 확인 (무료 티어 25GB)

### "Image generation timeout"
- 기본 타임아웃: 60초
- 복잡한 프롬프트 시 타임아웃 증가

---

## Admin UI 사용법

### 이미지 생성 페이지 추가

```tsx
// app/admin/images/page.tsx
import { ImageGenerationPage } from '@/components/ImageGeneration';

export default function ImagesPage() {
  return <ImageGenerationPage />;
}
```

### AdminDashboard에 네비게이션 추가

```typescript
// AdminDashboard.tsx의 navItems에 추가
{
  id: 'images',
  label: '이미지 생성',
  icon: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
}
```

---

## 체크리스트

### 설정 확인
- [ ] Stability AI API 키 설정
- [ ] Cloudinary 계정 및 API 키 설정
- [ ] (선택) OpenAI API 키 설정
- [ ] (선택) Anthropic API 키 설정
- [ ] DB 마이그레이션 완료
- [ ] 라우터 연결

### 테스트
- [ ] 단일 이미지 생성 테스트
- [ ] 배치 이미지 생성 테스트 (5개)
- [ ] Cloudinary 업로드 확인
- [ ] 썸네일 생성 확인
- [ ] Admin UI 동작 확인

---

## 다음 단계

**Step 5: 배치 처리 고도화**
- Bull/Redis 큐 시스템
- 백그라운드 작업 처리
- 진행률 실시간 모니터링
- 실패 자동 재시도

---

## 라이선스

VocaVision 프로젝트 내부용
