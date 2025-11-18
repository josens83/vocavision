# VocaVision 📚✨

> AI 기반 영어 단어 학습 플랫폼

VocaVision은 과학적 학습 방법과 AI 기술을 결합하여 효과적인 영어 어휘 학습을 제공하는 종합 플랫폼입니다.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)

## 🌟 주요 기능

### 🎯 과학적 학습 방법
- **SM-2 간격 반복 알고리즘**: 최적의 복습 타이밍으로 장기 기억 형성
- **다중 학습 방법**: 이미지, 비디오, 라임, 연상법, 어원 등 6가지 방식
- **적응형 난이도**: 초급부터 전문가까지 4단계 난이도

### 📚 풍부한 컨텐츠
- **101+ 엄선된 단어**: TOEFL, GRE, SAT 수준 포함
- **상세한 단어 정보**: 발음, 정의, 예문, 동의어, 반의어
- **AI 생성 컨텐츠**: OpenAI 기반 맞춤형 연상법

### 🎮 게임화된 학습
- **업적 시스템**: 9가지 학습 마일스톤
- **일일 목표**: 개인 맞춤 학습 목표 설정
- **연속 기록**: 학습 동기부여를 위한 스트릭 추적

### 📊 상세한 진행 상황 추적
- **실시간 통계**: 학습 진행도, 정확도, 숙련도 분포
- **학습 기록**: 모든 복습 세션 기록 및 분석
- **인사이트**: 개인화된 학습 제안

### 💻 크로스 플랫폼
- **웹 애플리케이션**: 반응형 Next.js 14 앱
- **모바일 앱**: React Native + Expo (iOS/Android)
- **동기화**: 모든 기기에서 학습 진행 상황 동기화

## 🚀 빠른 시작

### 1단계: 저장소 복제

```bash
git clone https://github.com/josens83/vocavision.git
cd vocavision
```

### 2단계: 환경 설정

```bash
# 환경 변수 템플릿 복사
cp .env.example .env

# .env 파일 편집
nano .env
```

### 3단계: Docker로 실행 (권장)

```bash
# Docker 컨테이너 시작
./deploy.sh up

# 데이터베이스 마이그레이션
./deploy.sh migrate

# 데이터베이스 시딩 (101개 단어, 4개 컬렉션, 9개 업적)
./deploy.sh seed
```

### 4단계: 접속

- **웹 애플리케이션**: http://localhost:3000
- **백엔드 API**: http://localhost:3001
- **API 문서**: http://localhost:3001/api-docs

### 로컬 개발 모드

Docker 없이 로컬에서 개발하려면:

```bash
# 백엔드 시작
cd backend
npm install
npm run dev

# 웹 프론트엔드 시작 (새 터미널)
cd web
npm install
npm run dev

# 모바일 앱 시작 (선택사항, 새 터미널)
cd mobile
npm install
npm start
```

## 📖 문서

- [**빠른 시작 가이드**](QUICKSTART.md) - 설치 및 설정 상세 가이드
- [**배포 가이드**](DEPLOYMENT.md) - 프로덕션 배포 전체 가이드
- [**API 문서**](backend/README.md) - REST API 엔드포인트 문서

## 🏗️ 아키텍처

### 기술 스택

#### 백엔드
- **Framework**: Express.js + TypeScript
- **Database**: PostgreSQL 16
- **ORM**: Prisma
- **Authentication**: JWT
- **AI**: OpenAI GPT-3.5 & DALL-E 3
- **Payment**: Stripe

#### 웹 프론트엔드
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State**: Zustand
- **Animation**: Framer Motion

#### 모바일
- **Framework**: React Native + Expo
- **Navigation**: React Navigation
- **UI**: React Native Paper

#### DevOps
- **Containerization**: Docker + Docker Compose
- **Deployment**: Nginx (reverse proxy)
- **CI/CD**: GitHub Actions (준비 중)

### 프로젝트 구조

```
vocavision/
├── backend/                 # Express.js 백엔드 API
│   ├── prisma/             # 데이터베이스 스키마 및 마이그레이션
│   │   ├── schema.prisma   # Prisma 스키마
│   │   └── seed.ts         # 101개 단어 데이터
│   ├── src/
│   │   ├── controllers/    # 비즈니스 로직
│   │   ├── routes/         # API 라우트
│   │   ├── middleware/     # 인증, 에러 핸들링
│   │   └── index.ts        # 서버 엔트리 포인트
│   └── Dockerfile          # 백엔드 컨테이너
│
├── web/                    # Next.js 웹 애플리케이션
│   ├── src/
│   │   ├── app/           # Next.js 14 App Router 페이지
│   │   │   ├── dashboard/ # 대시보드
│   │   │   ├── learn/     # 플래시카드 학습
│   │   │   ├── quiz/      # 퀴즈 모드
│   │   │   ├── words/     # 단어 탐색 및 상세
│   │   │   ├── bookmarks/ # 북마크
│   │   │   ├── history/   # 학습 기록
│   │   │   ├── statistics/# 상세 통계
│   │   │   ├── settings/  # 설정
│   │   │   └── pricing/   # 가격 페이지
│   │   ├── components/    # 재사용 가능한 컴포넌트
│   │   └── lib/           # 유틸리티, API 클라이언트
│   └── Dockerfile         # 프론트엔드 컨테이너
│
├── mobile/                # React Native 모바일 앱
│   ├── src/
│   │   ├── screens/       # 화면 컴포넌트
│   │   ├── components/    # UI 컴포넌트
│   │   ├── services/      # API 서비스
│   │   └── navigation/    # 네비게이션 설정
│   └── app.json           # Expo 설정
│
├── docker-compose.yml     # 전체 스택 오케스트레이션
├── deploy.sh              # 배포 자동화 스크립트
├── .env.example           # 환경 변수 템플릿
├── QUICKSTART.md          # 빠른 시작 가이드
├── DEPLOYMENT.md          # 배포 가이드
└── README.md              # 이 파일
```

## 🎓 학습 방법

### 1. 플래시카드 학습
- 앞면: 단어 + 발음
- 뒷면: 정의, 예문, 이미지
- 5단계 평가 시스템

### 2. 퀴즈 모드
- 3가지 퀴즈 유형
- 10개 무작위 문제
- 실시간 점수 피드백

### 3. 단어 탐색
- 난이도별 필터링
- 검색 기능
- 상세 단어 페이지

### 4. 북마크 시스템
- 중요 단어 저장
- 개인 메모 추가
- 빠른 복습 접근

### 5. 일일 목표
- 맞춤형 목표 설정
- 진행률 추적
- 달성 축하

## 📊 데이터베이스

### 단어 분포

- **초급 (Beginner)**: 13개 단어
- **중급 (Intermediate)**: 35개 단어
- **고급 (Advanced)**: 35개 단어
- **전문가 (Expert)**: 18개 단어

**총 101개 단어**

### 컬렉션

1. **Beginner Basics** - 초급 필수 단어
2. **Everyday Conversations** - 일상 대화
3. **TOEFL Vocabulary** - TOEFL 시험 대비
4. **GRE Advanced** - GRE 고급 어휘

### 업적

9가지 학습 마일스톤:
- 첫걸음 (첫 단어 마스터)
- 열정적인 학습자 (10개 단어)
- 단어 마스터 (50개 단어)
- 일주일 연속 (7일)
- 한 달 챌린지 (30일)
- 백 일의 기적 (100일)
- 완벽주의자 (10개 완벽 복습)
- 다재다능 (5가지 학습 방법)
- 시간 투자 (10시간 학습)

## 🔐 인증 & 보안

- **JWT 토큰**: 안전한 stateless 인증
- **비밀번호 해싱**: bcrypt 알고리즘
- **CORS**: 출처 검증
- **Rate Limiting**: API 남용 방지
- **Helmet.js**: 보안 헤더 설정

## 💳 구독 플랜

| 플랜 | 가격 | 주요 기능 |
|------|------|-----------|
| **무료** | ₩0 | 일일 10개 단어, 기본 기능 |
| **월간** | ₩9,990/월 | 무제한 학습, 모든 기능 |
| **연간** | ₩99,900/년 | 월간 + 17% 할인 (₩19,980 절약) |

### 프리미엄 기능

✅ 무제한 단어 학습
✅ 모든 학습 방법 (이미지, 비디오, 라임, 연상법, 어원)
✅ 고급 통계 및 분석
✅ AI 생성 연상법
✅ 업적 시스템
✅ 우선 고객 지원
✅ 광고 없음

## 🛠️ 개발

### 필수 조건

- Node.js 20+
- PostgreSQL 14+
- Docker & Docker Compose (선택사항)

### 설치

```bash
# 모든 패키지 설치
npm install

# 백엔드만
cd backend && npm install

# 웹 프론트엔드만
cd web && npm install

# 모바일만
cd mobile && npm install
```

### 데이터베이스 마이그레이션

```bash
cd backend

# 마이그레이션 생성
npx prisma migrate dev --name migration_name

# 마이그레이션 적용
npx prisma migrate deploy

# Prisma Studio 실행 (데이터베이스 GUI)
npx prisma studio
```

### 환경 변수

필수 환경 변수 ([.env.example](.env.example) 참조):

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/vocavision

# JWT
JWT_SECRET=your-secret-key-min-32-characters

# OpenAI (선택사항)
OPENAI_API_KEY=sk-your-key

# Stripe (선택사항)
STRIPE_SECRET_KEY=sk_test_your-key
STRIPE_PUBLISHABLE_KEY=pk_test_your-key
```

## 📱 모바일 앱

### Expo 개발 서버 시작

```bash
cd mobile
npm start
```

### 빌드

```bash
# iOS (Mac만 가능)
npm run ios

# Android
npm run android

# 웹 (테스트용)
npm run web
```

## 🚀 배포

### Docker 배포 (권장)

```bash
# 프로덕션 빌드 및 시작
./deploy.sh up

# 로그 확인
./deploy.sh logs

# 서비스 재시작
./deploy.sh restart

# 정리
./deploy.sh clean
```

### 수동 배포

자세한 내용은 [DEPLOYMENT.md](DEPLOYMENT.md) 참조

## 🤝 기여

기여를 환영합니다! 다음 단계를 따라주세요:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 👥 팀

- **개발**: Full-stack Development
- **디자인**: UI/UX Design
- **컨텐츠**: 어휘 큐레이션

## 📧 문의

- **이메일**: support@vocavision.com
- **GitHub Issues**: [Issues](https://github.com/josens83/vocavision/issues)
- **웹사이트**: https://vocavision.com

## 🗺️ 로드맵

### ✅ 완료된 기능

- [x] 사용자 인증 (회원가입, 로그인)
- [x] 101개 단어 데이터베이스
- [x] 플래시카드 학습 시스템
- [x] SM-2 간격 반복 알고리즘
- [x] 퀴즈 모드
- [x] 북마크 시스템
- [x] 일일 목표
- [x] 학습 기록
- [x] 상세 통계
- [x] 업적 시스템
- [x] 설정 페이지
- [x] 가격 페이지
- [x] Docker 배포
- [x] 포괄적인 문서

### 🔄 진행 중

- [ ] 이미지/비디오 컨텐츠 확장
- [ ] AI 생성 연상법 고도화
- [ ] 모바일 앱 완성
- [ ] 알림/리마인더 시스템

### 📅 향후 계획

- [ ] 500+ 단어로 확장
- [ ] 소셜 기능 (친구, 랭킹)
- [ ] 커스텀 단어장
- [ ] 음성 인식 학습
- [ ] 다국어 지원 (일본어, 중국어)
- [ ] 오프라인 모드
- [ ] 웹 확장 프로그램

## ⭐ Star History

이 프로젝트가 도움이 되셨다면 ⭐️을 눌러주세요!

## 🙏 감사의 말

- [Next.js](https://nextjs.org/) - 웹 프레임워크
- [Prisma](https://www.prisma.io/) - ORM
- [OpenAI](https://openai.com/) - AI 기능
- [Expo](https://expo.dev/) - 모바일 개발 도구
- [Tailwind CSS](https://tailwindcss.com/) - 스타일링

---

<div align="center">

**VocaVision** - Master English Vocabulary with AI-Powered Learning

Made with ❤️ by the VocaVision Team

[Website](https://vocavision.com) · [Documentation](https://docs.vocavision.com) · [Blog](https://blog.vocavision.com)

</div>
