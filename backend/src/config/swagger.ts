import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'VocaVision API',
      version: '1.0.0',
      description: `
VocaVision API - AI 기반 영어 단어 학습 플랫폼

## 주요 기능
- 사용자 인증 및 관리
- 단어 학습 및 진행도 추적
- SM-2 간격 반복 알고리즘
- 퀴즈 및 평가
- 업적 및 게임화
- 알림 시스템

## 인증
대부분의 엔드포인트는 JWT Bearer 토큰 인증이 필요합니다.
\`Authorization: Bearer <token>\`

## 요청 제한
- API: 10 requests/second
- Web: 30 requests/second
      `,
      contact: {
        name: 'VocaVision Support',
        email: 'support@vocavision.com',
        url: 'https://vocavision.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001/api',
        description: 'Development server',
      },
      {
        url: 'https://api.vocavision.com/api',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT 토큰을 입력하세요',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            role: { type: 'string', enum: ['USER', 'ADMIN', 'MODERATOR'] },
            subscriptionStatus: { type: 'string', enum: ['FREE', 'TRIAL', 'ACTIVE', 'CANCELLED', 'EXPIRED'] },
            totalWordsLearned: { type: 'integer' },
            currentStreak: { type: 'integer' },
            longestStreak: { type: 'integer' },
            dailyGoal: { type: 'integer' },
            dailyProgress: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Word: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            word: { type: 'string' },
            definition: { type: 'string' },
            pronunciation: { type: 'string' },
            phonetic: { type: 'string' },
            partOfSpeech: { type: 'string', enum: ['NOUN', 'VERB', 'ADJECTIVE', 'ADVERB', 'PRONOUN', 'PREPOSITION', 'CONJUNCTION', 'INTERJECTION'] },
            difficulty: { type: 'string', enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'] },
            frequency: { type: 'integer' },
          },
        },
        UserProgress: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            wordId: { type: 'string', format: 'uuid' },
            masteryLevel: { type: 'string', enum: ['NEW', 'LEARNING', 'FAMILIAR', 'MASTERED'] },
            correctCount: { type: 'integer' },
            incorrectCount: { type: 'integer' },
            totalReviews: { type: 'integer' },
            nextReviewDate: { type: 'string', format: 'date-time' },
            lastReviewDate: { type: 'string', format: 'date-time' },
          },
        },
        Achievement: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string' },
            icon: { type: 'string' },
            requirement: { type: 'integer' },
            type: { type: 'string', enum: ['WORDS_LEARNED', 'DAILY_STREAK', 'PERFECT_REVIEWS', 'METHODS_USED', 'STUDY_TIME'] },
          },
        },
        Collection: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string' },
            category: { type: 'string' },
            difficulty: { type: 'string', enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'] },
            isPublic: { type: 'boolean' },
            wordIds: { type: 'array', items: { type: 'string' } },
          },
        },
        Notification: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            type: { type: 'string', enum: ['REVIEW_REMINDER', 'STREAK_WARNING', 'STREAK_ACHIEVED', 'ACHIEVEMENT_UNLOCK', 'GOAL_COMPLETED', 'GOAL_REMINDER', 'WEEKLY_SUMMARY', 'NEW_WORDS'] },
            title: { type: 'string' },
            message: { type: 'string' },
            isRead: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Bookmark: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            wordId: { type: 'string', format: 'uuid' },
            notes: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            error: { type: 'string' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            token: { type: 'string' },
            user: { $ref: '#/components/schemas/User' },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: '인증 토큰이 없거나 유효하지 않습니다',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
        NotFoundError: {
          description: '리소스를 찾을 수 없습니다',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
        ValidationError: {
          description: '입력 데이터 유효성 검사 실패',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: '인증 관련 API' },
      { name: 'Users', description: '사용자 관리 API' },
      { name: 'Words', description: '단어 관련 API' },
      { name: 'Learning', description: '학습 관련 API' },
      { name: 'Progress', description: '학습 진행도 API' },
      { name: 'Quiz', description: '퀴즈 관련 API' },
      { name: 'Bookmarks', description: '북마크 관련 API' },
      { name: 'Goals', description: '일일 목표 API' },
      { name: 'Achievements', description: '업적 관련 API' },
      { name: 'Collections', description: '컬렉션 관련 API' },
      { name: 'Notifications', description: '알림 관련 API' },
      { name: 'Subscriptions', description: '구독 관련 API' },
    ],
  },
  apis: ['./src/routes/*.ts'], // Path to the API routes
};

export const swaggerSpec = swaggerJsdoc(options);
