# VocaVision 배포 가이드 (초상세 버전)

Vercel + Supabase + Railway를 사용한 프로덕션 배포 가이드입니다.
**예상 소요 시간: 약 30-45분**

## 🏗️ 아키텍처 이해

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     Vercel      │────▶│    Railway      │────▶│    Supabase     │
│   (Frontend)    │     │   (Backend)     │     │   (Database)    │
│   Next.js 14    │     │   Express.js    │     │   PostgreSQL    │
│   Port: 443     │     │   Port: 3001    │     │   Port: 5432    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
    사용자 접속            API 요청              데이터 저장
```

**왜 이 구조인가?**
- **Vercel**: Next.js 제작사, 최적화된 무료 프론트엔드 호스팅
- **Railway**: 간편한 백엔드 배포, 월 $5 무료 크레딧
- **Supabase**: PostgreSQL 무료 호스팅, Firebase 대안

---

# 📋 사전 준비 (5분)

## 필요한 계정 생성

아래 3개 사이트에 **GitHub 계정으로** 가입하세요:

### 1. Supabase 가입
1. 브라우저에서 **https://supabase.com** 접속
2. 우측 상단 **"Start your project"** 버튼 클릭
3. **"Continue with GitHub"** 버튼 클릭
4. GitHub 로그인 및 권한 승인
5. 가입 완료!

### 2. Railway 가입
1. 브라우저에서 **https://railway.app** 접속
2. 우측 상단 **"Login"** 클릭
3. **"Login with GitHub"** 클릭
4. GitHub 권한 승인
5. 가입 완료!

### 3. Vercel 가입
1. 브라우저에서 **https://vercel.com** 접속
2. 우측 상단 **"Sign Up"** 클릭
3. **"Continue with GitHub"** 선택
4. GitHub 권한 승인
5. 가입 완료!

---

# 🗄️ 1단계: Supabase 데이터베이스 설정 (10분)

## 1.1 새 프로젝트 생성

1. **https://supabase.com/dashboard** 접속

2. 좌측 상단의 **"New project"** 버튼 클릭
   ```
   ┌──────────────────────────────┐
   │  📁 All projects            │
   │  ┌────────────────────────┐ │
   │  │  + New project         │◀── 이 버튼 클릭
   │  └────────────────────────┘ │
   └──────────────────────────────┘
   ```

3. **Organization 선택** (없으면 자동 생성됨)

4. **프로젝트 정보 입력**:
   ```
   ┌─────────────────────────────────────────┐
   │  Create a new project                   │
   │                                         │
   │  Name: [ vocavision              ]      │ ◀── 입력
   │                                         │
   │  Database Password:                     │
   │  [ ●●●●●●●●●●●●●●●● ] [Generate]        │ ◀── Generate 클릭!
   │                                         │
   │  ⚠️ 이 비밀번호를 반드시 복사해서       │
   │     안전한 곳에 저장하세요!             │
   │                                         │
   │  Region:                                │
   │  [ Northeast Asia (Seoul) ▼ ]           │ ◀── Seoul 선택 (한국 사용자)
   │                                         │
   │  Pricing Plan: Free                     │
   │                                         │
   │  [      Create new project      ]       │ ◀── 클릭
   └─────────────────────────────────────────┘
   ```

5. **프로젝트 생성 대기** (약 2분 소요)
   - "Setting up project..." 메시지가 표시됩니다
   - 완료될 때까지 기다리세요

## 1.2 Connection String 복사 (매우 중요!)

프로젝트가 생성되면:

1. 좌측 사이드바에서 **⚙️ Project Settings** 클릭
   ```
   사이드바:
   ├── 📊 Table Editor
   ├── 🔑 Authentication
   ├── 📦 Storage
   ├── ...
   └── ⚙️ Project Settings  ◀── 이것 클릭
   ```

2. **Database** 탭 클릭
   ```
   Settings 메뉴:
   ├── General
   ├── Database       ◀── 이것 클릭
   ├── API
   └── ...
   ```

3. 아래로 스크롤하여 **"Connection string"** 섹션 찾기

4. **두 가지 연결 문자열을 복사**해야 합니다:

   ### A. Transaction 모드 (Port 6543)
   ```
   ┌─────────────────────────────────────────────────────────┐
   │  Connection string                                      │
   │                                                         │
   │  Mode: [Transaction ▼]  ◀── Transaction 선택되어있는지 확인│
   │                                                         │
   │  URI:                                                   │
   │  ┌─────────────────────────────────────────────────┐   │
   │  │ postgresql://postgres.xxxx:비밀번호@aws-0-ap... │   │
   │  └─────────────────────────────────────────────────┘   │
   │                                    [ 📋 Copy ]         │ ◀── 복사!
   └─────────────────────────────────────────────────────────┘
   ```

   **복사한 내용을 메모장에 붙여넣고 라벨 붙이기:**
   ```
   DATABASE_URL=postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres
   ```

   ### B. Session 모드 (Port 5432)
   ```
   Mode를 [Session ▼] 으로 변경 후 다시 복사
   ```

   **복사한 내용을 메모장에 붙여넣고 라벨 붙이기:**
   ```
   DIRECT_URL=postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres
   ```

5. **비밀번호 확인**
   - `[YOUR-PASSWORD]` 부분에 실제 비밀번호가 들어가 있는지 확인
   - 비밀번호에 특수문자가 있으면 URL 인코딩 필요할 수 있음
   - 예: `@` → `%40`, `#` → `%23`

## 📝 1단계 완료 체크리스트
```
✅ Supabase 프로젝트 생성 완료
✅ Database Password 안전한 곳에 저장
✅ DATABASE_URL (Transaction, Port 6543) 복사 완료
✅ DIRECT_URL (Session, Port 5432) 복사 완료
```

---

# 🚂 2단계: Railway Backend 배포 (15분)

## 2.1 Railway 프로젝트 생성

1. **https://railway.app/dashboard** 접속

2. **"+ New Project"** 버튼 클릭
   ```
   ┌────────────────────────────────────────┐
   │  Your Projects                         │
   │                                        │
   │  [ + New Project ]  ◀── 클릭           │
   │                                        │
   └────────────────────────────────────────┘
   ```

3. **"Deploy from GitHub repo"** 선택
   ```
   ┌────────────────────────────────────────┐
   │  Start with...                         │
   │                                        │
   │  [📦 Deploy from GitHub repo]  ◀── 클릭│
   │  [🐳 Deploy from Docker image]         │
   │  [📝 Empty project]                    │
   └────────────────────────────────────────┘
   ```

4. **GitHub 연동** (처음인 경우)
   ```
   ┌────────────────────────────────────────┐
   │  Connect GitHub                        │
   │                                        │
   │  [🔗 Configure GitHub App]  ◀── 클릭   │
   └────────────────────────────────────────┘
   ```

   - "Install Railway" 팝업에서 **"All repositories"** 또는 **"Only select repositories"** 선택
   - Only select 선택 시: `vocavision` 체크
   - **"Install"** 클릭

5. **리포지토리 선택**
   ```
   ┌────────────────────────────────────────┐
   │  Select a repository                   │
   │                                        │
   │  🔍 [ 검색어 입력...              ]    │
   │                                        │
   │  📁 josens83/vocavision        ◀── 클릭│
   │  📁 other-repo                         │
   └────────────────────────────────────────┘
   ```

## 2.2 Root Directory 설정 (중요!)

리포지토리 선택 후:

1. **"Add variables"** 화면이 나오면 일단 **스킵** (나중에 설정)

2. 배포가 시작되면 **해당 서비스 카드 클릭**
   ```
   ┌────────────────────────────────────────┐
   │  vocavision                            │
   │  ┌──────────────────────────────────┐ │
   │  │  📦 vocavision           ◀── 클릭│ │
   │  │  Building...                      │ │
   │  └──────────────────────────────────┘ │
   └────────────────────────────────────────┘
   ```

3. **Settings 탭** 클릭
   ```
   탭 메뉴:
   [ Deployments ] [ Variables ] [ Settings ] ◀── 클릭 [ Metrics ]
   ```

4. **Root Directory 설정**
   ```
   ┌─────────────────────────────────────────────────┐
   │  Service Settings                               │
   │                                                 │
   │  Root Directory                                 │
   │  ┌─────────────────────────────────────────┐   │
   │  │  /backend                               │   │ ◀── 입력!
   │  └─────────────────────────────────────────┘   │
   │                                                 │
   │  Watch Paths (Optional)                        │
   │  ┌─────────────────────────────────────────┐   │
   │  │                                         │   │
   │  └─────────────────────────────────────────┘   │
   └─────────────────────────────────────────────────┘
   ```

   **반드시 `/backend` 입력!** (슬래시 포함)

5. **Build Command 확인** (보통 자동 감지됨)
   ```
   Build Command: npm run build
   Start Command: npm start
   ```

## 2.3 환경 변수 설정 (매우 중요!)

1. **Variables 탭** 클릭
   ```
   탭 메뉴:
   [ Deployments ] [ Variables ] ◀── 클릭 [ Settings ] [ Metrics ]
   ```

2. **"+ New Variable"** 클릭하여 하나씩 추가

3. **필수 환경 변수 6개 추가**:

   | Variable Name | Value | 설명 |
   |--------------|-------|------|
   | `DATABASE_URL` | `postgresql://postgres.xxx...` | 1단계에서 복사한 Transaction URL |
   | `DIRECT_URL` | `postgresql://postgres.xxx...` | 1단계에서 복사한 Session URL |
   | `JWT_SECRET` | `my-super-secret-key-at-least-32-chars` | 32자 이상 비밀키 |
   | `NODE_ENV` | `production` | 프로덕션 모드 |
   | `PORT` | `3001` | 백엔드 포트 |
   | `CORS_ORIGIN` | `*` | 임시로 모두 허용 (나중에 수정) |

   **입력 예시:**
   ```
   ┌─────────────────────────────────────────────────┐
   │  Variables                                      │
   │                                                 │
   │  [ + New Variable ]                             │
   │                                                 │
   │  ┌───────────────┬───────────────────────────┐ │
   │  │ DATABASE_URL  │ postgresql://postgres...  │ │
   │  ├───────────────┼───────────────────────────┤ │
   │  │ DIRECT_URL    │ postgresql://postgres...  │ │
   │  ├───────────────┼───────────────────────────┤ │
   │  │ JWT_SECRET    │ your-32-char-secret-key   │ │
   │  ├───────────────┼───────────────────────────┤ │
   │  │ NODE_ENV      │ production                │ │
   │  ├───────────────┼───────────────────────────┤ │
   │  │ PORT          │ 3001                      │ │
   │  ├───────────────┼───────────────────────────┤ │
   │  │ CORS_ORIGIN   │ *                         │ │
   │  └───────────────┴───────────────────────────┘ │
   └─────────────────────────────────────────────────┘
   ```

   **⚠️ JWT_SECRET 생성 팁:**
   - 터미널에서: `openssl rand -base64 32`
   - 또는 간단히: `vocavision-jwt-secret-key-2024-production`

## 2.4 데이터베이스 마이그레이션

환경 변수 설정 후 배포가 완료되면:

1. **Deployments 탭**에서 최신 배포 클릭

2. **"View Logs"** 버튼 클릭하여 로그 확인
   - 에러 없이 "Server running on port 3001" 메시지가 보이면 성공

3. **Settings 탭** > 아래로 스크롤 > **"Railway CLI"** 또는 터미널 아이콘 클릭

4. **또는** 로컬에서 Railway CLI 사용:
   ```bash
   # Railway CLI 설치
   npm install -g @railway/cli

   # 로그인
   railway login

   # 프로젝트 연결
   railway link

   # 마이그레이션 실행
   railway run npx prisma migrate deploy
   ```

   **⚠️ Railway CLI 없이 하는 방법:**
   - Railway 대시보드에서 배포 시 자동으로 `prisma migrate deploy` 실행되도록 설정
   - `backend/package.json`의 `scripts`에 이미 포함되어 있으면 자동 실행됨

## 2.5 도메인 URL 생성

1. **Settings 탭** 클릭

2. **"Networking"** 섹션으로 스크롤

3. **"Generate Domain"** 버튼 클릭
   ```
   ┌─────────────────────────────────────────────────┐
   │  Networking                                     │
   │                                                 │
   │  Public Networking                              │
   │  [ Generate Domain ]  ◀── 클릭                  │
   │                                                 │
   └─────────────────────────────────────────────────┘
   ```

4. **생성된 URL 복사**
   ```
   ┌─────────────────────────────────────────────────┐
   │  Networking                                     │
   │                                                 │
   │  🌐 vocavision-production.up.railway.app       │
   │     [ 📋 Copy ]  ◀── 복사해서 메모장에 저장!    │
   └─────────────────────────────────────────────────┘
   ```

   **메모장에 저장:**
   ```
   BACKEND_URL=https://vocavision-production.up.railway.app
   ```

## 2.6 배포 확인

1. 브라우저에서 **`https://[your-railway-url]/api/health`** 접속

2. 정상이면 다음과 같은 응답:
   ```json
   {
     "status": "ok",
     "timestamp": "2024-01-15T12:00:00.000Z"
   }
   ```

## 📝 2단계 완료 체크리스트
```
✅ Railway 프로젝트 생성 완료
✅ Root Directory를 /backend로 설정
✅ 6개 환경 변수 모두 설정
✅ Generate Domain으로 URL 생성
✅ Backend URL 메모장에 저장
✅ /api/health 접속하여 정상 확인
```

---

# ▲ 3단계: Vercel Frontend 배포 (10분)

## 3.1 Vercel 프로젝트 생성

1. **https://vercel.com/dashboard** 접속

2. **"Add New..."** 버튼 클릭 > **"Project"** 선택
   ```
   ┌────────────────────────────────────────┐
   │  [Add New... ▼]                        │
   │   ├── Project        ◀── 클릭          │
   │   ├── Domain                           │
   │   └── Store                            │
   └────────────────────────────────────────┘
   ```

3. **"Import Git Repository"** 섹션에서 GitHub 연동
   ```
   ┌────────────────────────────────────────────────┐
   │  Import Git Repository                         │
   │                                                │
   │  [ 🔗 + Add GitHub Account ]  ◀── 처음이면 클릭│
   │                                                │
   │  또는                                          │
   │                                                │
   │  🔍 [ 검색...                        ]         │
   │                                                │
   │  📁 josens83/vocavision      [Import] ◀── 클릭│
   └────────────────────────────────────────────────┘
   ```

## 3.2 프로젝트 설정

Import 클릭 후 설정 화면:

```
┌─────────────────────────────────────────────────────┐
│  Configure Project                                  │
│                                                     │
│  Project Name                                       │
│  ┌─────────────────────────────────────────────┐   │
│  │  vocavision                                 │   │ ◀── 원하는 이름
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Framework Preset                                   │
│  ┌─────────────────────────────────────────────┐   │
│  │  Next.js                            ▼       │   │ ◀── 자동 감지됨
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Root Directory                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  web                                        │   │ ◀── 중요! 'web' 입력
│  └─────────────────────────────────────────────┘   │
│  [ Edit ] 클릭하여 'web' 입력                       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**⚠️ Root Directory 설정 방법:**
1. Root Directory 옆의 **"Edit"** 클릭
2. `web` 입력
3. 확인

## 3.3 환경 변수 설정

같은 설정 화면에서 아래로 스크롤:

```
┌─────────────────────────────────────────────────────┐
│  Environment Variables                              │
│                                                     │
│  ┌─────────────────┬─────────────────────────────┐ │
│  │ NAME            │ VALUE                       │ │
│  ├─────────────────┼─────────────────────────────┤ │
│  │ NEXT_PUBLIC_API │ https://vocavision-prod...  │ │
│  │ _URL            │ .up.railway.app/api         │ │
│  └─────────────────┴─────────────────────────────┘ │
│                                                     │
│  [ + Add ]  ◀── 클릭하여 환경 변수 추가             │
└─────────────────────────────────────────────────────┘
```

**추가할 환경 변수:**

| Variable Name | Value | 설명 |
|--------------|-------|------|
| `NEXT_PUBLIC_API_URL` | `https://[railway-url]/api` | 2단계에서 생성한 Railway URL + /api |

**⚠️ 주의사항:**
- URL 끝에 `/api` 붙이기!
- URL 끝에 슬래시(/) 붙이지 않기!
- 예: `https://vocavision-production.up.railway.app/api` ✅
- 예: `https://vocavision-production.up.railway.app/api/` ❌

## 3.4 배포 실행

1. **"Deploy"** 버튼 클릭
   ```
   ┌─────────────────────────────────────────────────────┐
   │                                                     │
   │            [     Deploy     ]  ◀── 클릭             │
   │                                                     │
   └─────────────────────────────────────────────────────┘
   ```

2. **배포 진행 상황 확인** (약 2-3분 소요)
   ```
   Building...
   ├── Installing dependencies...
   ├── Building Next.js application...
   ├── Generating static pages...
   └── Deploying to Vercel's Edge Network...

   ✅ Ready!
   ```

3. **배포 완료!**
   ```
   ┌─────────────────────────────────────────────────────┐
   │  🎉 Congratulations!                                │
   │                                                     │
   │  Your project is now live at:                       │
   │  🔗 https://vocavision.vercel.app      ◀── 클릭!    │
   │                                                     │
   │  [  Continue to Dashboard  ]                        │
   └─────────────────────────────────────────────────────┘
   ```

## 3.5 생성된 URL 확인 및 저장

1. **Dashboard에서 URL 확인**
   ```
   ┌─────────────────────────────────────────────────────┐
   │  vocavision                                         │
   │                                                     │
   │  Domains:                                           │
   │  • vocavision.vercel.app          ◀── 기본 도메인   │
   │  • vocavision-xxxxx.vercel.app    ◀── 프리뷰        │
   └─────────────────────────────────────────────────────┘
   ```

2. **메모장에 저장:**
   ```
   FRONTEND_URL=https://vocavision.vercel.app
   ```

## 📝 3단계 완료 체크리스트
```
✅ Vercel 프로젝트 생성 완료
✅ Root Directory를 'web'으로 설정
✅ NEXT_PUBLIC_API_URL 환경 변수 설정
✅ 배포 완료 및 URL 확인
✅ 웹사이트 접속 테스트
```

---

# 🔗 4단계: CORS 설정 업데이트 (5분)

Frontend URL이 생성되었으니 Backend의 CORS를 업데이트합니다.

## 4.1 Railway CORS 업데이트

1. **https://railway.app/dashboard** 접속

2. **vocavision 프로젝트** 클릭

3. **vocavision 서비스** 클릭

4. **Variables 탭** 클릭

5. **CORS_ORIGIN 값 수정**:
   ```
   이전: CORS_ORIGIN = *
   이후: CORS_ORIGIN = https://vocavision.vercel.app
   ```

   **입력 방법:**
   - 기존 `CORS_ORIGIN` 변수 클릭
   - 값을 `https://vocavision.vercel.app` 으로 변경
   - Enter 또는 저장

6. **자동 재배포** 확인
   - 환경 변수 변경 시 Railway가 자동으로 재배포합니다
   - Deployments 탭에서 새 배포 진행 확인

## 📝 4단계 완료 체크리스트
```
✅ Railway CORS_ORIGIN을 Vercel URL로 변경
✅ 자동 재배포 완료 확인
```

---

# ✅ 5단계: 최종 테스트 (5분)

## 5.1 Frontend 테스트

1. **https://vocavision.vercel.app** 접속

2. **확인할 것들:**
   - [ ] 메인 페이지 로딩 확인
   - [ ] 로그인/회원가입 페이지 이동 확인
   - [ ] 회원가입 기능 테스트
   - [ ] 로그인 기능 테스트

## 5.2 API 연결 테스트

1. **브라우저 개발자 도구 열기** (F12)

2. **Network 탭** 선택

3. **페이지 새로고침** 후 API 호출 확인
   - `api` 로 시작하는 요청들이 보여야 함
   - Status가 200이면 성공

## 5.3 채팅 기능 테스트

1. **로그인 후** Dashboard 접속

2. **"AI 도우미"** 또는 **채팅 버튼** 클릭

3. **메시지 전송** 테스트
   - "안녕하세요" 입력 후 전송
   - AI 응답 확인

## 📝 최종 체크리스트
```
✅ Frontend 페이지 정상 로딩
✅ Backend API 연결 성공 (Network 탭 확인)
✅ 회원가입/로그인 기능 정상
✅ 채팅 기능 정상 작동
```

---

# 🆘 트러블슈팅

## 문제 1: "Failed to fetch" 또는 네트워크 오류

**증상:** API 호출 시 네트워크 에러

**해결:**
1. Railway Backend가 실행 중인지 확인
2. CORS_ORIGIN이 정확한 Vercel URL인지 확인
3. NEXT_PUBLIC_API_URL 끝에 `/api` 붙어있는지 확인

## 문제 2: "Database connection error"

**증상:** Backend 로그에 DB 연결 오류

**해결:**
1. Supabase에서 Connection string 다시 복사
2. 비밀번호에 특수문자 있으면 URL 인코딩
   - `@` → `%40`
   - `#` → `%23`
   - `$` → `%24`
3. Railway 환경 변수 재설정

## 문제 3: Railway 빌드 실패

**증상:** Deployments에서 빌드 실패

**해결:**
1. Root Directory가 `/backend`인지 확인
2. Logs에서 에러 메시지 확인
3. Node.js 버전 확인 (v18 이상 필요)

## 문제 4: Vercel 빌드 실패

**증상:** Vercel 배포 실패

**해결:**
1. Root Directory가 `web`인지 확인
2. Build 로그에서 에러 확인
3. NEXT_PUBLIC_API_URL이 설정되어 있는지 확인

## 문제 5: 페이지는 뜨는데 데이터가 안 보임

**증상:** UI는 보이지만 데이터 로딩 안됨

**해결:**
1. 브라우저 개발자 도구 > Console 탭에서 에러 확인
2. Network 탭에서 API 응답 확인
3. Backend가 정상 실행 중인지 Railway에서 확인

---

# 📊 배포 완료 후 URL 정리

| 서비스 | URL | 용도 |
|--------|-----|------|
| Frontend | https://vocavision.vercel.app | 사용자 접속 |
| Backend API | https://[your-railway].up.railway.app | API 서버 |
| Database | Supabase (내부) | 데이터 저장 |

---

# 💰 비용 안내

| 서비스 | Free Tier | 예상 비용 |
|--------|-----------|----------|
| **Vercel** | 100GB 대역폭/월 | $0 (Hobby) |
| **Railway** | $5 무료 크레딧/월 | $0~5 |
| **Supabase** | 500MB DB, 1GB 저장소 | $0 |

**총 예상 비용: $0 ~ $5/월**

---

# 🎉 축하합니다!

VocaVision이 성공적으로 배포되었습니다!

**다음 단계:**
1. 커스텀 도메인 연결 (선택)
2. 실제 AI API 연동 (OpenAI 등)
3. 모니터링 설정
4. 백업 설정

문제가 있으면 GitHub Issues에 등록해주세요!
