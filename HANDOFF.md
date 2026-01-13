# VocaVision AI Handoff Document 📋

> 마지막 업데이트: 2026-01-13
> 목적: 개발 중단 후 컨텍스트 복구용

## 🎯 프로젝트 요약

VocaVision AI는 AI 기반 영어 단어 학습 플랫폼입니다. (2024-12월 VocaVision → VocaVision AI로 리브랜딩)
- **프론트엔드**: Next.js 14 (web/)
- **백엔드**: Express.js + TypeScript (backend/)
- **DB**: PostgreSQL (Supabase)
- **이미지 저장소**: Supabase Storage (Cloudinary에서 마이그레이션 완료)

---

## 📝 최근 변경사항 (2026-01-13)

### 1. VocaVision → VocaVision AI 리브랜딩 ✅
- 헤더 로고에 "AI" 추가
- 태그라인 추가: "AI와 함께하는 어휘 학습"
- Navigation, Footer 등 전역 업데이트

### 2. Lucide 화살표 아이콘 교체 ✅
**이전**: 텍스트 화살표 (→, ←)
**이후**: Lucide ArrowLeft/ArrowRight 컴포넌트

**변경 파일 (11개):**
- `web/src/components/learning/FlashCardGesture.tsx`
- `web/src/app/my/history/page.tsx`
- `web/src/app/my/collections/page.tsx`
- `web/src/app/my/bookmarks/page.tsx`
- `web/src/app/games/page.tsx`
- `web/src/app/games/write/page.tsx`
- `web/src/app/games/true-false/page.tsx`
- `web/src/app/games/match/page.tsx`
- `web/src/app/statistics/page.tsx`
- `web/src/app/decks/create/page.tsx`
- `web/src/app/my/collections/[id]/page.tsx`

### 3. 모바일 하단 탭 버그 수정 ✅
**문제 1**: 스크롤 시 "홈", "수능" 탭만 보이는 현상
**문제 2**: 탭 스와이프가 메인 페이지 콘텐츠를 이동시킴

**해결책 (`web/src/components/navigation/BottomTabBar.tsx`):**
- `max-w-screen-sm mx-auto` 제거 → `w-full` 사용
- `flex-1 min-w-0`로 탭 균등 분배
- `onTouchStart/onTouchMove`에 `stopPropagation()` 추가
- `touchAction: manipulation`, `overscrollBehaviorX: contain` 추가

### 4. 홈 페이지 정적 상품 카드 ✅
**문제**: API에서 1개만 반환 시 상품이 1개만 표시됨
**해결책**: `getStaticPackages()` 함수로 3개 정적 카드 폴백

**변경 파일:**
- `web/src/components/home/ProductPackageSection.tsx`

---

## 📝 이전 변경사항 (2025-12-23)

### 1. Cloudinary → Supabase Storage 마이그레이션 ✅
**이유**: Cloudinary 무료 티어 초과

**변경 파일:**
- `backend/src/lib/supabase.ts` - Supabase 클라이언트 싱글톤 (NEW)
- `backend/src/services/imageGenerator.service.ts` - uploadToSupabase 함수
- `backend/src/controllers/admin.controller.ts` - Supabase 스토리지 사용
- `backend/src/scripts/generateImages.ts` - 독립 스크립트도 Supabase 사용
- `web/next.config.js` - Supabase 도메인 추가

**환경변수 (backend/.env):**
```
SUPABASE_URL=https://sfqzlrsvrszdlusntdky.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
SUPABASE_STORAGE_BUCKET=vocavision-images
```

**Supabase Storage 버킷**: `vocavision-images` (public)

---

### 2. Footer 개인정보 업데이트 ✅
- 상세 주소 제거 → "경기도 화성시"
- 전화번호 제거
- 이메일 변경 → support@vocavision.kr

**변경 파일:**
- `web/src/components/Footer.tsx`
- `web/src/app/contact/page.tsx`
- `web/src/app/terms/page.tsx`
- `web/src/app/privacy/page.tsx`
- `web/src/components/faq/FAQContent.tsx`
- `web/src/app/checkout/fail/page.tsx`
- `web/src/app/vocabulary/VocabularyPage.tsx`
- `web/src/app/vocabulary/[category]/VocabularyCategoryPage.tsx`

---

### 3. 모바일 UI/UX 개선 (3차) ✅

#### 3-1. 플래시카드 페이지 (`web/src/app/learn/page.tsx`)
- 헤더 컴팩트화: 정확도 간소화, 시험명 크게
- 평가 버튼 sticky 처리 (모바일)

#### 3-2. /words 페이지 (`web/src/app/words/page.tsx`)
- 새 로고 적용 (V 그라디언트)
- 모바일 네비게이션 숨김
- 검색 버튼 아이콘만 (모바일)
- 시험 필터에서 TOEFL/TOEIC 제거

#### 3-3. 하단 탭바 (`web/src/components/navigation/BottomTabBar.tsx`)
- `w-full` + `transform: translateZ(0)` 추가 (스와이프 시 고정)
- `max-w-screen-sm mx-auto` 중앙 정렬

#### 3-4. 시험 아이콘 그리드 (`web/src/components/home/ExamIconGrid.tsx`)
- TOEFL, TOEIC, SAT → `available: false` (준비중 배지)
- "내 단어장" 항목 삭제 (8개 → 7개)
- `justify-items-center` 그리드 중앙 정렬

#### 3-5. BEST/NEW 탭 (`web/src/components/home/PopularWordsSection.tsx`)
- `flex` → `inline-flex` (컴팩트 탭 컨테이너)

---

## 🚀 현재 사용 가능한 시험

| 시험 | 상태 | 비고 |
|------|------|------|
| 수능 (CSAT) | ✅ 사용 가능 | 메인 |
| TEPS | ✅ 사용 가능 | |
| TOEFL | 🏷️ 준비중 | 데이터 없음 |
| TOEIC | 🏷️ 준비중 | 데이터 없음 |
| SAT | 🏷️ 준비중 | 데이터 없음 |
| IELTS | 🏷️ 준비중 | 데이터 없음 |
| GRE | 🏷️ 준비중 | 데이터 없음 |

---

## 📁 주요 파일 위치

### 프론트엔드 (web/)
```
web/src/
├── app/
│   ├── learn/page.tsx          # 플래시카드 학습 페이지
│   ├── words/page.tsx          # 단어 목록 페이지
│   ├── admin/images/page.tsx   # 어드민 이미지 관리
│   └── ...
├── components/
│   ├── home/
│   │   ├── ExamIconGrid.tsx    # 시험별 빠른 학습
│   │   ├── PopularWordsSection.tsx  # BEST/NEW 추천 단어
│   │   └── HomePage.tsx
│   ├── navigation/
│   │   ├── BottomTabBar.tsx    # 모바일 하단 탭
│   │   └── Navigation.tsx      # 상단 네비게이션
│   ├── learning/
│   │   └── FlashCardGesture.tsx  # 플래시카드 제스처
│   └── Footer.tsx
└── ...
```

### 백엔드 (backend/)
```
backend/src/
├── lib/
│   └── supabase.ts             # Supabase 클라이언트
├── services/
│   └── imageGenerator.service.ts  # 이미지 생성 & 업로드
├── controllers/
│   └── admin.controller.ts     # 어드민 API
├── scripts/
│   └── generateImages.ts       # 이미지 생성 스크립트
└── ...
```

---

## ⚠️ 주의사항

### 1. 이미지 생성 중일 때
- 백그라운드에서 AI 이미지 생성이 진행 중일 수 있음
- PR/배포 전에 생성 완료 여부 확인 필요

### 2. Supabase Storage
- 버킷: `vocavision-images` (public)
- 파일 경로 패턴: `visuals/{word}-{type}-{timestamp}.png`
- 기존 Cloudinary 이미지는 그대로 유지 (마이그레이션 불필요)

### 3. Next.js Image 도메인
```javascript
// web/next.config.js
images: {
  domains: [
    'res.cloudinary.com',  // 기존 이미지
    'via.placeholder.com',
    'sfqzlrsvrszdlusntdky.supabase.co'  // 새 이미지
  ],
}
```

---

## 🔜 다음 작업 후보

1. **TOEFL/TOEIC 데이터 추가** - 현재 "준비중"으로 표시됨
2. **모바일 앱** - React Native/Expo (mobile/ 디렉토리)
3. **결제 시스템** - 현재 기본 구조만 있음
4. **사용자 피드백** - 학습 UX 개선

---

## 📊 최근 커밋 히스토리

```
ac31cd7 Merge PR #471: Resolve mobile bottom tab visibility and swipe conflicts
8f838fd fix: Resolve mobile bottom tab visibility and swipe conflicts
fb90671 Merge PR #470: Replace text arrows with Lucide ArrowLeft/ArrowRight icons
f9573f2 feat: Replace text arrows with Lucide ArrowLeft/ArrowRight icons
e781184 Merge PR #469: Show static product cards on home page
c4c1303 fix: Show static product cards on home page when API data is incomplete
053ee75 feat: Add product cards and replace text arrows with Lucide icons
c2dda8b fix: Prevent nav items from wrapping to multiple lines
17c4faf feat: Add tagline to header logo
1b370be fix: Add AI to header logo in Navigation component
30e8f5d feat: Rebrand VocaVision to VocaVision AI
```

---

## 🔐 환경 변수 체크리스트

### Backend (.env)
- [ ] `DATABASE_URL` - PostgreSQL 연결
- [ ] `SUPABASE_URL` - Supabase 프로젝트 URL
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Service Role 키
- [ ] `SUPABASE_STORAGE_BUCKET` - 스토리지 버킷명
- [ ] `OPENAI_API_KEY` - OpenAI API 키 (이미지 생성용)
- [ ] `JWT_SECRET` - JWT 시크릿

### Frontend (.env.local)
- [ ] `NEXT_PUBLIC_API_URL` - 백엔드 API URL

---

## 💡 Claude Code에 물어볼 때

새 세션 시작 시 이 파일을 먼저 읽으라고 요청:

```
HANDOFF.md 파일을 읽고 프로젝트 컨텍스트를 파악해줘
```

특정 작업 이어하기:
```
HANDOFF.md를 읽고, [작업명]을 이어서 진행해줘
```
