# VocaVision Handoff Document 📋

> 마지막 업데이트: 2025-12-23
> 목적: 개발 중단 후 컨텍스트 복구용

## 🎯 프로젝트 요약

VocaVision은 AI 기반 영어 단어 학습 플랫폼입니다.
- **프론트엔드**: Next.js 14 (web/)
- **백엔드**: Express.js + TypeScript (backend/)
- **DB**: PostgreSQL (Supabase)
- **이미지 저장소**: Supabase Storage (Cloudinary에서 마이그레이션 완료)

---

## 📝 최근 변경사항 (2025-12-23)

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
293d228 fix: Make BEST/NEW tab container compact with inline-flex
c0ea8b6 fix: Improve mobile UX for bottom tab bar and exam grid
404413c fix: Improve /words page mobile UX
dab8873 fix: Improve mobile UX for flashcard page
36777d4 fix: Update Footer and contact info for privacy
739bc0b fix: Display English caption in admin images modal
8ed79d6 fix: Add Supabase Storage domain to Next.js image config
e1e1492 feat: Migrate image storage from Cloudinary to Supabase Storage
e3de494 fix: Fix pagination for missing-images API
0d56925 fix: Use null instead of undefined for image deletion
620ad12 fix: Make image deletion work same as caption editing
3e0d1d8 fix: Call API when deleting image via X button in admin
81b9690 fix: Update modal state after image upload success
5b29943 fix: Increase Express body size limit to 10mb for image uploads
00e6a1d fix: Fix Express route order for /words/missing-images API
1604535 feat: Add image management menu to admin sidebar
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
