# VocaVision 배포 가이드

Vercel + Supabase + Railway를 사용한 프로덕션 배포 가이드입니다.

## 아키텍처

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     Vercel      │────▶│    Railway      │────▶│    Supabase     │
│   (Frontend)    │     │   (Backend)     │     │   (Database)    │
│   Next.js 14    │     │   Express.js    │     │   PostgreSQL    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## 1단계: Supabase 데이터베이스 설정

### 1.1 Supabase 프로젝트 생성

1. [Supabase](https://supabase.com)에 로그인
2. **New Project** 클릭
3. 프로젝트 정보 입력:
   - **Name**: `vocavision`
   - **Database Password**: 강력한 비밀번호 생성 (저장해두세요!)
   - **Region**: `Northeast Asia (Seoul)` 권장

### 1.2 Connection String 복사

1. **Project Settings** > **Database**
2. **Connection string** 섹션에서:
   - **Transaction** 모드 (Port 6543) - `DATABASE_URL`용
   - **Session** 모드 (Port 5432) - `DIRECT_URL`용

```env
# Transaction pooling (for serverless)
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true

# Direct connection (for migrations)
DIRECT_URL=postgresql://postgres.[ref]:[password]@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres
```

---

## 2단계: Railway Backend 배포

### 2.1 Railway 프로젝트 생성

1. [Railway](https://railway.app)에 로그인 (GitHub 연동)
2. **New Project** > **Deploy from GitHub repo**
3. `vocavision` 리포지토리 선택
4. **Root Directory**: `/backend` 설정

### 2.2 환경 변수 설정

Railway Dashboard > **Variables** 탭에서:

```env
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.[ref]:[password]@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://your-vercel-app.vercel.app
```

### 2.3 데이터베이스 마이그레이션

Railway 터미널에서:
```bash
npx prisma migrate deploy
npx prisma db seed  # 초기 데이터 (선택)
```

### 2.4 도메인 설정

1. **Settings** > **Networking** > **Generate Domain**
2. 생성된 URL 복사 (예: `vocavision-backend.up.railway.app`)

---

## 3단계: Vercel Frontend 배포

### 3.1 Vercel 프로젝트 생성

1. [Vercel](https://vercel.com)에 로그인 (GitHub 연동)
2. **Add New** > **Project**
3. `vocavision` 리포지토리 선택
4. 설정:
   - **Framework Preset**: Next.js
   - **Root Directory**: `web`

### 3.2 환경 변수 설정

Vercel Dashboard > **Settings** > **Environment Variables**:

```env
NEXT_PUBLIC_API_URL=https://vocavision-backend.up.railway.app/api
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx (선택)
```

### 3.3 배포

**Deploy** 버튼 클릭 후 자동 배포 완료!

---

## 4단계: CORS 업데이트

Railway Backend에서 CORS_ORIGIN을 실제 Vercel URL로 업데이트:

```env
CORS_ORIGIN=https://vocavision.vercel.app
```

---

## 빠른 배포 (CLI)

### Railway CLI

```bash
# Railway CLI 설치
npm install -g @railway/cli

# 로그인
railway login

# Backend 배포
cd backend
railway init
railway link
railway up
```

### Vercel CLI

```bash
# Vercel CLI 설치
npm install -g vercel

# 로그인
vercel login

# Frontend 배포
cd web
vercel --prod
```

---

## 환경별 URL

| 환경 | Frontend | Backend | Database |
|------|----------|---------|----------|
| **Production** | vocavision.vercel.app | vocavision-backend.railway.app | Supabase |
| **Preview** | vocavision-xxx.vercel.app | - | - |
| **Local** | localhost:3000 | localhost:3001 | localhost:5432 |

---

## 체크리스트

- [ ] Supabase 프로젝트 생성
- [ ] Database 비밀번호 저장
- [ ] Railway 프로젝트 생성
- [ ] Railway 환경 변수 설정
- [ ] Prisma 마이그레이션 실행
- [ ] Vercel 프로젝트 생성
- [ ] Vercel 환경 변수 설정
- [ ] CORS 설정 업데이트
- [ ] 테스트 완료

---

## 트러블슈팅

### 1. Database 연결 오류
- Supabase의 Connection Pooling 설정 확인
- `?pgbouncer=true` 파라미터 확인

### 2. CORS 오류
- Backend의 `CORS_ORIGIN` 환경변수 확인
- Vercel 도메인과 정확히 일치하는지 확인

### 3. Prisma 마이그레이션 실패
- `DIRECT_URL` 사용하여 마이그레이션
- Supabase 방화벽 설정 확인

### 4. 빌드 실패
- Node.js 버전 확인 (v20 권장)
- 의존성 설치 확인

---

## 비용

| 서비스 | Free Tier | 예상 비용 (월) |
|--------|-----------|---------------|
| Vercel | 100GB 대역폭 | $0 (개인) |
| Railway | $5 크레딧/월 | ~$5 |
| Supabase | 500MB DB | $0 (Free) |

**총 예상 비용**: $0 ~ $5/월 (트래픽에 따라)
