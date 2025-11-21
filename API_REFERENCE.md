# VocaVision API Reference

**Version:** 1.0.0
**Base URL:** `https://api.vocavision.com/v1`
**Last Updated:** 2024-01-21

---

## Table of Contents

- [Introduction](#introduction)
- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [Error Handling](#error-handling)
- [API Endpoints](#api-endpoints)
  - [Authentication](#authentication-endpoints)
  - [Users](#users-endpoints)
  - [Words](#words-endpoints)
  - [Learning](#learning-endpoints)
  - [Quiz](#quiz-endpoints)
  - [Statistics](#statistics-endpoints)
  - [Collections](#collections-endpoints)
  - [Achievements](#achievements-endpoints)
  - [Social](#social-endpoints)
- [Webhooks](#webhooks)
- [Code Examples](#code-examples)

---

## Introduction

The VocaVision API provides programmatic access to vocabulary learning data, user progress, and gamification features. This RESTful API uses JSON for request and response payloads.

### Key Features

- 🔐 **Secure Authentication**: JWT-based authentication with refresh tokens
- 🚀 **High Performance**: < 200ms response time (p95)
- 📊 **Comprehensive Data**: Access all vocabulary and learning data
- 🎮 **Gamification**: Achievements, leagues, and challenges
- 🔔 **Real-time Updates**: WebSocket support for live notifications
- 📈 **Analytics**: Detailed learning statistics and predictions

### Base URLs

| Environment | URL |
|-------------|-----|
| Production | `https://api.vocavision.com/v1` |
| Staging | `https://api-staging.vocavision.com/v1` |
| Development | `http://localhost:3000/api/v1` |

---

## Authentication

VocaVision uses JWT (JSON Web Tokens) for authentication. All API requests require a valid access token except for the authentication endpoints.

### Authentication Flow

```
1. User Login → Access Token + Refresh Token
2. Use Access Token for API calls (valid for 15 minutes)
3. When expired, use Refresh Token to get new Access Token
4. Refresh Token valid for 7 days
```

### Headers

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Token Structure

**Access Token (JWT):**
```json
{
  "userId": "user_123",
  "email": "user@example.com",
  "role": "premium",
  "iat": 1705843200,
  "exp": 1705844100
}
```

**Refresh Token:**
- Opaque token stored securely
- Used only for token refresh endpoint
- Rotated on each use

### Security Best Practices

1. **Store tokens securely**: Use httpOnly cookies or secure storage
2. **Never expose tokens**: Don't log or expose in URLs
3. **Rotate refresh tokens**: Implement token rotation
4. **Use HTTPS only**: All API calls must use HTTPS
5. **Implement token expiry**: Handle 401 errors gracefully

---

## Rate Limiting

VocaVision implements rate limiting to ensure fair usage and system stability.

### Rate Limits by Plan

| Plan | Requests/Minute | Requests/Hour | Requests/Day |
|------|----------------|---------------|--------------|
| Free | 30 | 1,000 | 10,000 |
| Premium | 100 | 5,000 | 50,000 |
| Enterprise | 1,000 | 50,000 | Unlimited |

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1705843260
```

### Rate Limit Response

When rate limit is exceeded:

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again in 45 seconds.",
    "retryAfter": 45
  }
}
```

**Status Code:** `429 Too Many Requests`

### Best Practices

- Implement exponential backoff
- Respect `Retry-After` header
- Cache responses when possible
- Use webhooks for real-time updates instead of polling

---

## Error Handling

VocaVision uses conventional HTTP response codes and provides detailed error messages.

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 204 | No Content | Request successful, no content to return |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Authentication required or failed |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict (e.g., duplicate) |
| 422 | Unprocessable Entity | Validation failed |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Temporary service outage |

### Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ],
    "requestId": "req_abc123xyz",
    "timestamp": "2024-01-21T10:30:00Z"
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|------------|-------------|
| `AUTHENTICATION_REQUIRED` | 401 | No valid token provided |
| `TOKEN_EXPIRED` | 401 | Access token has expired |
| `INVALID_TOKEN` | 401 | Token is invalid or malformed |
| `INSUFFICIENT_PERMISSIONS` | 403 | User lacks required permissions |
| `RESOURCE_NOT_FOUND` | 404 | Requested resource doesn't exist |
| `VALIDATION_ERROR` | 422 | Request validation failed |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Internal server error |

### Error Handling Best Practices

```typescript
try {
  const response = await fetch('https://api.vocavision.com/v1/words', {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    const error = await response.json();

    switch (error.error.code) {
      case 'TOKEN_EXPIRED':
        // Refresh token and retry
        await refreshAccessToken();
        return retry();

      case 'RATE_LIMIT_EXCEEDED':
        // Wait and retry
        await wait(error.error.retryAfter * 1000);
        return retry();

      default:
        // Handle other errors
        throw new Error(error.error.message);
    }
  }

  const data = await response.json();
  return data;
} catch (error) {
  console.error('API Error:', error);
  throw error;
}
```

---

## API Endpoints

### Authentication Endpoints

#### Register User

Create a new user account.

```http
POST /auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "username": "johndoe",
  "firstName": "John",
  "lastName": "Doe",
  "acceptTerms": true
}
```

**Validation Rules:**
- `email`: Valid email format, unique
- `password`: Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
- `username`: 3-20 chars, alphanumeric and underscore only, unique
- `firstName`: 1-50 chars
- `lastName`: 1-50 chars
- `acceptTerms`: Must be true

**Response:** `201 Created`
```json
{
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "username": "johndoe",
    "firstName": "John",
    "lastName": "Doe",
    "role": "free",
    "createdAt": "2024-01-21T10:30:00Z"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "rt_abc123xyz...",
    "expiresIn": 900
  }
}
```

---

#### Login

Authenticate and receive access tokens.

```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:** `200 OK`
```json
{
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "username": "johndoe",
    "role": "premium"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "rt_abc123xyz...",
    "expiresIn": 900
  }
}
```

**Errors:**
- `401`: Invalid credentials
- `423`: Account locked (too many failed attempts)

---

#### Refresh Token

Get a new access token using refresh token.

```http
POST /auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "rt_abc123xyz..."
}
```

**Response:** `200 OK`
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "rt_new456abc...",
  "expiresIn": 900
}
```

**Notes:**
- Old refresh token is invalidated (token rotation)
- Both tokens are returned

---

#### Logout

Invalidate current session and tokens.

```http
POST /auth/logout
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "refreshToken": "rt_abc123xyz..."
}
```

**Response:** `204 No Content`

---

#### Forgot Password

Request password reset email.

```http
POST /auth/forgot-password
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:** `200 OK`
```json
{
  "message": "If the email exists, a password reset link has been sent."
}
```

**Notes:**
- Always returns success to prevent email enumeration
- Reset link valid for 1 hour

---

#### Reset Password

Reset password using reset token.

```http
POST /auth/reset-password
```

**Request Body:**
```json
{
  "token": "reset_token_xyz",
  "newPassword": "NewSecurePass123!"
}
```

**Response:** `200 OK`
```json
{
  "message": "Password reset successful"
}
```

**Errors:**
- `400`: Invalid or expired token
- `422`: Password doesn't meet requirements

---

### Users Endpoints

#### Get Current User

Get authenticated user's profile.

```http
GET /users/me
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:** `200 OK`
```json
{
  "id": "user_123",
  "email": "user@example.com",
  "username": "johndoe",
  "firstName": "John",
  "lastName": "Doe",
  "avatar": "https://cdn.vocavision.com/avatars/user_123.jpg",
  "role": "premium",
  "settings": {
    "language": "en",
    "dailyGoal": 20,
    "notifications": {
      "email": true,
      "push": true,
      "dailyReminder": true
    },
    "theme": "dark"
  },
  "subscription": {
    "plan": "premium",
    "status": "active",
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2025-01-01T00:00:00Z"
  },
  "stats": {
    "totalWords": 350,
    "wordsLearned": 280,
    "currentStreak": 15,
    "longestStreak": 45,
    "totalXP": 12500
  },
  "createdAt": "2023-06-15T10:00:00Z",
  "updatedAt": "2024-01-21T10:30:00Z"
}
```

---

#### Update User Profile

Update user profile information.

```http
PATCH /users/me
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "username": "johnsmith",
  "avatar": "base64_encoded_image_data"
}
```

**Response:** `200 OK`
```json
{
  "id": "user_123",
  "email": "user@example.com",
  "username": "johnsmith",
  "firstName": "John",
  "lastName": "Smith",
  "avatar": "https://cdn.vocavision.com/avatars/user_123.jpg",
  "updatedAt": "2024-01-21T10:35:00Z"
}
```

**Errors:**
- `409`: Username already taken
- `422`: Validation failed

---

#### Update User Settings

Update user preferences and settings.

```http
PATCH /users/me/settings
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "language": "ko",
  "dailyGoal": 30,
  "notifications": {
    "email": true,
    "push": false,
    "dailyReminder": true,
    "reminderTime": "09:00"
  },
  "theme": "light"
}
```

**Response:** `200 OK`
```json
{
  "settings": {
    "language": "ko",
    "dailyGoal": 30,
    "notifications": {
      "email": true,
      "push": false,
      "dailyReminder": true,
      "reminderTime": "09:00"
    },
    "theme": "light"
  },
  "updatedAt": "2024-01-21T10:40:00Z"
}
```

---

#### Delete User Account

Permanently delete user account and all associated data.

```http
DELETE /users/me
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "password": "CurrentPassword123!",
  "confirmation": "DELETE"
}
```

**Response:** `204 No Content`

**Notes:**
- Irreversible action
- All user data is permanently deleted
- Complies with GDPR right to deletion

---

### Words Endpoints

#### List Words

Get paginated list of words.

```http
GET /words?page=1&limit=20&difficulty=intermediate&status=learning
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `limit` | integer | 20 | Items per page (max 100) |
| `difficulty` | string | all | `beginner`, `intermediate`, `advanced` |
| `status` | string | all | `new`, `learning`, `learned`, `mastered` |
| `category` | string | all | Word category filter |
| `search` | string | - | Search in word or definition |
| `sort` | string | `createdAt` | `createdAt`, `difficulty`, `frequency` |
| `order` | string | `desc` | `asc`, `desc` |

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "word_123",
      "word": "serendipity",
      "pronunciation": "/ˌserənˈdipədē/",
      "phonetic": "se-ruhn-DIP-i-tee",
      "partOfSpeech": "noun",
      "difficulty": "advanced",
      "frequency": "uncommon",
      "definitions": [
        {
          "definition": "The occurrence of events by chance in a happy or beneficial way",
          "example": "A fortunate stroke of serendipity brought the two old friends together"
        }
      ],
      "synonyms": ["chance", "luck", "fortuity"],
      "antonyms": ["misfortune", "bad luck"],
      "etymology": "Coined by Horace Walpole in 1754",
      "images": [
        "https://cdn.vocavision.com/images/word_123_1.jpg"
      ],
      "audio": "https://cdn.vocavision.com/audio/word_123.mp3",
      "userProgress": {
        "status": "learning",
        "accuracy": 75,
        "lastReviewed": "2024-01-20T15:30:00Z",
        "nextReview": "2024-01-22T15:30:00Z",
        "reviewCount": 5
      },
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1500,
    "totalPages": 75,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

#### Get Word by ID

Get detailed information about a specific word.

```http
GET /words/:id
```

**Response:** `200 OK`
```json
{
  "id": "word_123",
  "word": "serendipity",
  "pronunciation": "/ˌserənˈdipədē/",
  "phonetic": "se-ruhn-DIP-i-tee",
  "partOfSpeech": "noun",
  "difficulty": "advanced",
  "frequency": "uncommon",
  "definitions": [
    {
      "definition": "The occurrence of events by chance in a happy or beneficial way",
      "example": "A fortunate stroke of serendipity brought the two old friends together",
      "context": "Formal writing, literature"
    }
  ],
  "synonyms": ["chance", "luck", "fortuity", "providence"],
  "antonyms": ["misfortune", "bad luck", "design", "planning"],
  "etymology": "Coined by Horace Walpole in 1754, from 'Serendip' (old name for Sri Lanka)",
  "usageNotes": "Often used in formal or literary contexts",
  "collocations": ["pure serendipity", "moment of serendipity"],
  "images": [
    {
      "url": "https://cdn.vocavision.com/images/word_123_1.jpg",
      "caption": "A chance encounter",
      "attribution": "Photo by John Doe"
    }
  ],
  "audio": {
    "us": "https://cdn.vocavision.com/audio/word_123_us.mp3",
    "uk": "https://cdn.vocavision.com/audio/word_123_uk.mp3"
  },
  "exampleSentences": [
    {
      "sentence": "It was pure serendipity that we met at the coffee shop.",
      "translation": "우리가 커피숍에서 만난 것은 순전히 행운이었다."
    }
  ],
  "mnemonics": [
    {
      "id": "mnemonic_1",
      "text": "SEREN-DIPPITY: Serene dip in tea - a happy accident!",
      "author": {
        "id": "user_456",
        "username": "memory_master"
      },
      "votes": 45,
      "userVote": 1
    }
  ],
  "relatedWords": [
    {
      "id": "word_456",
      "word": "fortuitous",
      "relation": "synonym"
    }
  ],
  "userProgress": {
    "status": "learning",
    "accuracy": 75,
    "lastReviewed": "2024-01-20T15:30:00Z",
    "nextReview": "2024-01-22T15:30:00Z",
    "reviewCount": 5,
    "correctStreak": 3,
    "history": [
      {
        "date": "2024-01-20T15:30:00Z",
        "correct": true,
        "timeSpent": 12
      }
    ]
  },
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-20T15:30:00Z"
}
```

**Errors:**
- `404`: Word not found

---

#### Get Word of the Day

Get today's featured word.

```http
GET /words/daily
```

**Response:** `200 OK`
```json
{
  "date": "2024-01-21",
  "word": {
    "id": "word_789",
    "word": "ephemeral",
    "pronunciation": "/əˈfem(ə)rəl/",
    "definitions": [
      {
        "definition": "Lasting for a very short time",
        "example": "The ephemeral beauty of cherry blossoms"
      }
    ],
    "difficulty": "intermediate"
  },
  "challenge": {
    "id": "challenge_123",
    "description": "Use 'ephemeral' in a sentence today",
    "reward": {
      "xp": 50,
      "badge": "Word of the Day Master"
    }
  }
}
```

---

#### Add Word to Learning

Add a word to user's learning list.

```http
POST /words/:id/learn
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:** `201 Created`
```json
{
  "wordId": "word_123",
  "status": "learning",
  "addedAt": "2024-01-21T10:45:00Z",
  "nextReview": "2024-01-21T11:45:00Z"
}
```

**Errors:**
- `409`: Word already in learning list

---

#### Update Word Progress

Update learning progress for a word.

```http
POST /words/:id/progress
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "correct": true,
  "timeSpent": 15,
  "method": "flashcard"
}
```

**Response:** `200 OK`
```json
{
  "wordId": "word_123",
  "status": "learning",
  "accuracy": 80,
  "reviewCount": 6,
  "correctStreak": 4,
  "nextReview": "2024-01-23T10:45:00Z",
  "spacedRepetition": {
    "interval": 2,
    "easeFactor": 2.5
  }
}
```

---

### Learning Endpoints

#### Get Daily Progress

Get user's learning progress for today.

```http
GET /learning/daily
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:** `200 OK`
```json
{
  "date": "2024-01-21",
  "goal": 20,
  "progress": {
    "wordsLearned": 15,
    "wordsReviewed": 25,
    "timeSpent": 45,
    "accuracy": 85,
    "xpEarned": 450
  },
  "streak": {
    "current": 15,
    "longest": 45
  },
  "dueReviews": {
    "count": 12,
    "urgent": 3
  },
  "recommendations": [
    {
      "type": "review",
      "message": "You have 3 words due for urgent review",
      "action": "Review Now"
    }
  ]
}
```

---

#### Get Learning Path

Get personalized learning path for user.

```http
GET /learning/path
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `category` | string | all | Focus category |
| `difficulty` | string | adaptive | `beginner`, `intermediate`, `advanced`, `adaptive` |

**Response:** `200 OK`
```json
{
  "userId": "user_123",
  "category": "all",
  "difficulty": "adaptive",
  "recommendedWords": [
    {
      "id": "word_234",
      "word": "ubiquitous",
      "reason": "Matches your level and interests",
      "priority": "high",
      "estimatedTime": 10
    }
  ],
  "reviewWords": [
    {
      "id": "word_123",
      "word": "serendipity",
      "dueDate": "2024-01-21T10:00:00Z",
      "urgency": "high"
    }
  ],
  "weakAreas": [
    {
      "category": "advanced vocabulary",
      "accuracy": 65,
      "recommendation": "Focus on advanced words"
    }
  ],
  "estimatedCompletionTime": 30
}
```

---

#### Start Learning Session

Start a new learning session.

```http
POST /learning/sessions
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "mode": "flashcard",
  "wordIds": ["word_123", "word_234", "word_345"],
  "settings": {
    "autoPlay": true,
    "showHints": false,
    "timeLimit": 60
  }
}
```

**Response:** `201 Created`
```json
{
  "sessionId": "session_abc123",
  "mode": "flashcard",
  "words": [
    {
      "id": "word_123",
      "word": "serendipity",
      "order": 1
    }
  ],
  "settings": {
    "autoPlay": true,
    "showHints": false,
    "timeLimit": 60
  },
  "startedAt": "2024-01-21T11:00:00Z"
}
```

---

#### Complete Learning Session

Complete a learning session and submit results.

```http
POST /learning/sessions/:sessionId/complete
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "results": [
    {
      "wordId": "word_123",
      "correct": true,
      "timeSpent": 12,
      "attempts": 1
    },
    {
      "wordId": "word_234",
      "correct": false,
      "timeSpent": 20,
      "attempts": 2
    }
  ],
  "totalTime": 180,
  "completed": true
}
```

**Response:** `200 OK`
```json
{
  "sessionId": "session_abc123",
  "results": {
    "wordsLearned": 8,
    "accuracy": 80,
    "timeSpent": 180,
    "xpEarned": 240,
    "achievements": [
      {
        "id": "achievement_1",
        "name": "Speed Learner",
        "description": "Complete 10 words in under 3 minutes",
        "icon": "https://cdn.vocavision.com/badges/speed_learner.svg"
      }
    ]
  },
  "levelUp": {
    "newLevel": 15,
    "rewards": {
      "xp": 500,
      "badge": "Level 15 Master"
    }
  },
  "nextSession": {
    "recommendedTime": "2024-01-21T18:00:00Z",
    "wordsToReview": 5
  }
}
```

---

### Quiz Endpoints

#### List Quizzes

Get available quizzes.

```http
GET /quizzes
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `category` | string | all | Quiz category |
| `difficulty` | string | all | Quiz difficulty |
| `status` | string | all | `available`, `completed`, `in_progress` |

**Response:** `200 OK`
```json
{
  "quizzes": [
    {
      "id": "quiz_123",
      "title": "Advanced Vocabulary Challenge",
      "description": "Test your knowledge of 50 advanced words",
      "category": "advanced",
      "difficulty": "hard",
      "questionCount": 50,
      "timeLimit": 1800,
      "rewards": {
        "xp": 500,
        "badge": "Quiz Master"
      },
      "attempts": 0,
      "bestScore": null,
      "averageScore": 75,
      "completionRate": 65
    }
  ]
}
```

---

#### Start Quiz

Start a quiz session.

```http
POST /quizzes/:id/start
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:** `201 Created`
```json
{
  "quizSession": {
    "id": "quiz_session_abc",
    "quizId": "quiz_123",
    "questions": [
      {
        "id": "question_1",
        "type": "multiple_choice",
        "question": "What does 'ephemeral' mean?",
        "options": [
          {
            "id": "option_a",
            "text": "Lasting for a short time"
          },
          {
            "id": "option_b",
            "text": "Lasting forever"
          },
          {
            "id": "option_c",
            "text": "Occurring repeatedly"
          },
          {
            "id": "option_d",
            "text": "Happening rarely"
          }
        ],
        "points": 10
      }
    ],
    "timeLimit": 1800,
    "startedAt": "2024-01-21T11:30:00Z",
    "expiresAt": "2024-01-21T12:00:00Z"
  }
}
```

---

#### Submit Quiz Answer

Submit an answer for a quiz question.

```http
POST /quizzes/sessions/:sessionId/answers
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "questionId": "question_1",
  "answer": "option_a",
  "timeSpent": 8
}
```

**Response:** `200 OK`
```json
{
  "questionId": "question_1",
  "correct": true,
  "correctAnswer": "option_a",
  "explanation": "'Ephemeral' means lasting for a very short time.",
  "points": 10,
  "bonusPoints": 2,
  "currentScore": 12,
  "questionsRemaining": 49
}
```

---

#### Complete Quiz

Complete and submit quiz results.

```http
POST /quizzes/sessions/:sessionId/complete
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:** `200 OK`
```json
{
  "quizSession": {
    "id": "quiz_session_abc",
    "quizId": "quiz_123",
    "score": 450,
    "maxScore": 500,
    "accuracy": 90,
    "timeSpent": 1200,
    "correctAnswers": 45,
    "totalQuestions": 50,
    "rank": "A",
    "percentile": 85
  },
  "rewards": {
    "xp": 450,
    "achievements": [
      {
        "id": "achievement_quiz_master",
        "name": "Quiz Master",
        "icon": "https://cdn.vocavision.com/badges/quiz_master.svg"
      }
    ]
  },
  "leaderboard": {
    "rank": 42,
    "totalPlayers": 1250
  }
}
```

---

### Statistics Endpoints

#### Get User Statistics

Get comprehensive user statistics.

```http
GET /statistics
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `period` | string | `30d` | `7d`, `30d`, `90d`, `1y`, `all` |
| `groupBy` | string | `day` | `day`, `week`, `month` |

**Response:** `200 OK`
```json
{
  "period": "30d",
  "summary": {
    "totalWords": 350,
    "wordsLearned": 280,
    "wordsInProgress": 70,
    "accuracy": 85,
    "totalTimeSpent": 3600,
    "totalXP": 12500,
    "currentLevel": 15,
    "currentStreak": 15,
    "longestStreak": 45
  },
  "timeline": [
    {
      "date": "2024-01-21",
      "wordsLearned": 15,
      "wordsReviewed": 25,
      "accuracy": 88,
      "timeSpent": 45,
      "xpEarned": 450
    }
  ],
  "categoryBreakdown": [
    {
      "category": "advanced",
      "wordCount": 120,
      "accuracy": 78,
      "timeSpent": 1200
    }
  ],
  "weakAreas": [
    {
      "category": "idioms",
      "accuracy": 65,
      "wordCount": 25,
      "improvement": -5
    }
  ],
  "strongAreas": [
    {
      "category": "business",
      "accuracy": 95,
      "wordCount": 50,
      "improvement": 10
    }
  ],
  "predictions": {
    "projectedLevel": 18,
    "estimatedTime": "45 days",
    "confidence": 0.85
  }
}
```

---

#### Get Learning Heatmap

Get learning activity heatmap data.

```http
GET /statistics/heatmap
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `year` | integer | current | Year to display |

**Response:** `200 OK`
```json
{
  "year": 2024,
  "data": [
    {
      "date": "2024-01-21",
      "count": 25,
      "level": 4
    }
  ],
  "streaks": [
    {
      "start": "2024-01-07",
      "end": "2024-01-21",
      "length": 15
    }
  ],
  "summary": {
    "totalDays": 180,
    "activeDays": 150,
    "consistencyScore": 83
  }
}
```

---

### Collections Endpoints

#### List Collections

Get user's word collections.

```http
GET /collections
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:** `200 OK`
```json
{
  "collections": [
    {
      "id": "collection_123",
      "name": "SAT Vocabulary",
      "description": "Essential words for SAT preparation",
      "wordCount": 500,
      "category": "academic",
      "isPublic": true,
      "author": {
        "id": "user_123",
        "username": "johndoe"
      },
      "followers": 1250,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-20T10:00:00Z"
    }
  ]
}
```

---

#### Create Collection

Create a new word collection.

```http
POST /collections
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "name": "Business English",
  "description": "Essential business vocabulary",
  "category": "business",
  "isPublic": false,
  "wordIds": ["word_123", "word_234"]
}
```

**Response:** `201 Created`
```json
{
  "id": "collection_456",
  "name": "Business English",
  "description": "Essential business vocabulary",
  "wordCount": 2,
  "category": "business",
  "isPublic": false,
  "createdAt": "2024-01-21T12:00:00Z"
}
```

---

### Achievements Endpoints

#### List Achievements

Get user achievements.

```http
GET /achievements
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | string | `all` | `unlocked`, `locked`, `all` |
| `category` | string | `all` | Achievement category |

**Response:** `200 OK`
```json
{
  "achievements": [
    {
      "id": "achievement_1",
      "name": "First Steps",
      "description": "Learn your first 10 words",
      "icon": "https://cdn.vocavision.com/badges/first_steps.svg",
      "category": "learning",
      "rarity": "common",
      "status": "unlocked",
      "unlockedAt": "2024-01-15T10:30:00Z",
      "progress": {
        "current": 10,
        "required": 10
      },
      "rewards": {
        "xp": 100,
        "badge": "First Steps Badge"
      }
    }
  ],
  "summary": {
    "totalAchievements": 50,
    "unlockedAchievements": 15,
    "completionRate": 30,
    "totalXPFromAchievements": 2500
  }
}
```

---

### Social Endpoints

#### Get Leaderboard

Get global or friends leaderboard.

```http
GET /social/leaderboard
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `scope` | string | `global` | `global`, `friends`, `league` |
| `metric` | string | `xp` | `xp`, `streak`, `words_learned` |
| `period` | string | `week` | `day`, `week`, `month`, `all_time` |
| `limit` | integer | 50 | Max 100 |

**Response:** `200 OK`
```json
{
  "scope": "global",
  "metric": "xp",
  "period": "week",
  "leaderboard": [
    {
      "rank": 1,
      "user": {
        "id": "user_789",
        "username": "vocab_master",
        "avatar": "https://cdn.vocavision.com/avatars/user_789.jpg",
        "level": 25
      },
      "score": 5000,
      "change": 2
    }
  ],
  "currentUser": {
    "rank": 42,
    "score": 2500,
    "change": -3
  },
  "nextUpdate": "2024-01-22T00:00:00Z"
}
```

---

## Webhooks

VocaVision can send webhook notifications for various events.

### Setting Up Webhooks

Configure webhooks in your account settings:

```http
POST /webhooks
```

**Request Body:**
```json
{
  "url": "https://your-app.com/webhooks/vocavision",
  "events": [
    "word.learned",
    "achievement.unlocked",
    "streak.milestone"
  ],
  "secret": "your_webhook_secret"
}
```

### Webhook Payload

```json
{
  "id": "webhook_evt_123",
  "event": "word.learned",
  "timestamp": "2024-01-21T12:00:00Z",
  "data": {
    "userId": "user_123",
    "wordId": "word_234",
    "word": "ephemeral",
    "status": "learned"
  },
  "signature": "sha256=..."
}
```

### Verifying Webhooks

```typescript
import crypto from 'crypto';

function verifyWebhook(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return `sha256=${expectedSignature}` === signature;
}
```

### Webhook Events

| Event | Description |
|-------|-------------|
| `user.registered` | New user registration |
| `word.learned` | User learned a new word |
| `word.mastered` | User mastered a word |
| `achievement.unlocked` | Achievement unlocked |
| `level.up` | User leveled up |
| `streak.milestone` | Streak milestone reached |
| `quiz.completed` | Quiz completed |
| `subscription.started` | Subscription started |
| `subscription.cancelled` | Subscription cancelled |

---

## Code Examples

### JavaScript / TypeScript

```typescript
// API Client Setup
class VocaVisionAPI {
  private accessToken: string;
  private refreshToken: string;
  private baseURL = 'https://api.vocavision.com/v1';

  constructor(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (response.status === 401) {
      // Token expired, refresh and retry
      await this.refreshAccessToken();
      return this.request(endpoint, options);
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error.message);
    }

    return response.json();
  }

  private async refreshAccessToken(): Promise<void> {
    const response = await fetch(`${this.baseURL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: this.refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();
    this.accessToken = data.accessToken;
    this.refreshToken = data.refreshToken;
  }

  // Get words
  async getWords(params?: {
    page?: number;
    limit?: number;
    difficulty?: string;
    status?: string;
  }): Promise<any> {
    const queryParams = new URLSearchParams(params as any);
    return this.request(`/words?${queryParams}`);
  }

  // Get word by ID
  async getWord(id: string): Promise<any> {
    return this.request(`/words/${id}`);
  }

  // Add word to learning
  async learnWord(id: string): Promise<any> {
    return this.request(`/words/${id}/learn`, { method: 'POST' });
  }

  // Update word progress
  async updateWordProgress(
    id: string,
    data: { correct: boolean; timeSpent: number; method: string }
  ): Promise<any> {
    return this.request(`/words/${id}/progress`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Get statistics
  async getStatistics(period: string = '30d'): Promise<any> {
    return this.request(`/statistics?period=${period}`);
  }

  // Start quiz
  async startQuiz(id: string): Promise<any> {
    return this.request(`/quizzes/${id}/start`, { method: 'POST' });
  }
}

// Usage
const api = new VocaVisionAPI('access_token', 'refresh_token');

// Get words
const words = await api.getWords({ difficulty: 'intermediate', limit: 20 });

// Learn a word
const result = await api.learnWord('word_123');

// Update progress
await api.updateWordProgress('word_123', {
  correct: true,
  timeSpent: 15,
  method: 'flashcard',
});
```

### Python

```python
import requests
from typing import Dict, Any, Optional

class VocaVisionAPI:
    def __init__(self, access_token: str, refresh_token: str):
        self.access_token = access_token
        self.refresh_token = refresh_token
        self.base_url = 'https://api.vocavision.com/v1'

    def _request(
        self,
        endpoint: str,
        method: str = 'GET',
        data: Optional[Dict] = None
    ) -> Dict[str, Any]:
        url = f'{self.base_url}{endpoint}'
        headers = {
            'Authorization': f'Bearer {self.access_token}',
            'Content-Type': 'application/json'
        }

        response = requests.request(method, url, headers=headers, json=data)

        if response.status_code == 401:
            self._refresh_access_token()
            return self._request(endpoint, method, data)

        response.raise_for_status()
        return response.json()

    def _refresh_access_token(self):
        response = requests.post(
            f'{self.base_url}/auth/refresh',
            json={'refreshToken': self.refresh_token}
        )
        response.raise_for_status()
        data = response.json()
        self.access_token = data['accessToken']
        self.refresh_token = data['refreshToken']

    def get_words(self, **params) -> Dict[str, Any]:
        endpoint = '/words'
        if params:
            query = '&'.join([f'{k}={v}' for k, v in params.items()])
            endpoint = f'{endpoint}?{query}'
        return self._request(endpoint)

    def get_word(self, word_id: str) -> Dict[str, Any]:
        return self._request(f'/words/{word_id}')

    def learn_word(self, word_id: str) -> Dict[str, Any]:
        return self._request(f'/words/{word_id}/learn', method='POST')

    def update_word_progress(
        self,
        word_id: str,
        correct: bool,
        time_spent: int,
        method: str
    ) -> Dict[str, Any]:
        data = {
            'correct': correct,
            'timeSpent': time_spent,
            'method': method
        }
        return self._request(f'/words/{word_id}/progress', method='POST', data=data)

    def get_statistics(self, period: str = '30d') -> Dict[str, Any]:
        return self._request(f'/statistics?period={period}')

# Usage
api = VocaVisionAPI('access_token', 'refresh_token')

# Get words
words = api.get_words(difficulty='intermediate', limit=20)

# Learn a word
result = api.learn_word('word_123')

# Update progress
api.update_word_progress('word_123', correct=True, time_spent=15, method='flashcard')
```

---

## Best Practices

### 1. Authentication

- Store tokens securely (httpOnly cookies, secure storage)
- Implement automatic token refresh
- Handle 401 errors gracefully
- Never expose tokens in URLs or logs

### 2. Error Handling

- Implement retry logic with exponential backoff
- Handle rate limiting (respect `Retry-After` header)
- Provide user-friendly error messages
- Log errors for debugging

### 3. Performance

- Cache responses when appropriate
- Use pagination for large datasets
- Implement request deduplication
- Use webhooks instead of polling

### 4. Security

- Always use HTTPS
- Validate and sanitize input
- Implement CSRF protection
- Use Content Security Policy (CSP)

### 5. Rate Limiting

- Implement client-side rate limiting
- Monitor rate limit headers
- Use exponential backoff on errors
- Batch requests when possible

---

## Support

### Getting Help

- **Documentation**: https://docs.vocavision.com
- **API Status**: https://status.vocavision.com
- **Support Email**: support@vocavision.com
- **Developer Forum**: https://forum.vocavision.com

### Reporting Issues

Report bugs or issues to: api-bugs@vocavision.com

Include:
- API endpoint
- Request/response details
- Error messages
- Request ID (from error response)

---

**Last Updated:** 2024-01-21
**Version:** 1.0.0
**Maintained By:** VocaVision API Team
