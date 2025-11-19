import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { mockRequest, mockResponse } from './setup';

const {
  getUserProgress,
  getDueWords,
  submitReview,
  startSession,
  endSession,
  getProgressHistory
} = require('../controllers/progress.controller');

const prisma = new PrismaClient();

describe('Progress Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserProgress', () => {
    it('should return user progress statistics', async () => {
      const req = mockRequest({
        user: { id: 'userId' },
      });
      const res = mockResponse();

      const mockProgress = [
        {
          id: 'progress1',
          wordId: 'word1',
          masteryLevel: 3,
          reviewCount: 5,
          lastReviewed: new Date(),
          word: { word: 'ephemeral', difficulty: 'ADVANCED' },
        },
      ];

      (prisma.userProgress.findMany as jest.Mock).mockResolvedValue(mockProgress);
      (prisma.userProgress.count as jest.Mock).mockResolvedValue(10);

      await getUserProgress(req as Request, res as Response);

      expect(prisma.userProgress.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'userId' },
        })
      );
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('getDueWords', () => {
    it('should return words due for review', async () => {
      const req = mockRequest({
        user: { id: 'userId' },
        query: { limit: '10' },
      });
      const res = mockResponse();

      const mockDueWords = [
        {
          id: 'progress1',
          wordId: 'word1',
          nextReview: new Date(Date.now() - 86400000), // yesterday
          word: {
            id: 'word1',
            word: 'ephemeral',
            definition: 'lasting for a very short time',
          },
        },
      ];

      (prisma.userProgress.findMany as jest.Mock).mockResolvedValue(mockDueWords);

      await getDueWords(req as Request, res as Response);

      expect(prisma.userProgress.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'userId',
            nextReview: expect.objectContaining({
              lte: expect.any(Date),
            }),
          }),
        })
      );
      expect(res.json).toHaveBeenCalledWith(expect.any(Array));
    });
  });

  describe('submitReview', () => {
    it('should update progress after correct answer', async () => {
      const req = mockRequest({
        user: { id: 'userId' },
        body: {
          wordId: 'word1',
          correct: true,
          responseTime: 3000,
        },
      });
      const res = mockResponse();

      const existingProgress = {
        id: 'progress1',
        userId: 'userId',
        wordId: 'word1',
        masteryLevel: 2,
        reviewCount: 5,
        easeFactor: 2.5,
        interval: 4,
      };

      (prisma.userProgress.findFirst as jest.Mock).mockResolvedValue(existingProgress);
      (prisma.userProgress.update as jest.Mock).mockResolvedValue({
        ...existingProgress,
        masteryLevel: 3,
        reviewCount: 6,
        interval: 10,
        nextReview: new Date(),
      });
      (prisma.user.update as jest.Mock).mockResolvedValue({});

      await submitReview(req as Request, res as Response);

      expect(prisma.userProgress.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 'userId',
          wordId: 'word1',
        },
      });
      expect(prisma.userProgress.update).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          masteryLevel: expect.any(Number),
        })
      );
    });

    it('should create new progress for first review', async () => {
      const req = mockRequest({
        user: { id: 'userId' },
        body: {
          wordId: 'newWord',
          correct: true,
          responseTime: 2000,
        },
      });
      const res = mockResponse();

      (prisma.userProgress.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.userProgress.create as jest.Mock).mockResolvedValue({
        id: 'newProgress',
        userId: 'userId',
        wordId: 'newWord',
        masteryLevel: 1,
        reviewCount: 1,
      });
      (prisma.user.update as jest.Mock).mockResolvedValue({});

      await submitReview(req as Request, res as Response);

      expect(prisma.userProgress.create).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });

    it('should decrease mastery level on incorrect answer', async () => {
      const req = mockRequest({
        user: { id: 'userId' },
        body: {
          wordId: 'word1',
          correct: false,
          responseTime: 5000,
        },
      });
      const res = mockResponse();

      const existingProgress = {
        id: 'progress1',
        userId: 'userId',
        wordId: 'word1',
        masteryLevel: 3,
        reviewCount: 10,
        easeFactor: 2.5,
        interval: 10,
      };

      (prisma.userProgress.findFirst as jest.Mock).mockResolvedValue(existingProgress);
      (prisma.userProgress.update as jest.Mock).mockResolvedValue({
        ...existingProgress,
        masteryLevel: 2,
        reviewCount: 11,
        interval: 1,
      });

      await submitReview(req as Request, res as Response);

      expect(prisma.userProgress.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            interval: expect.any(Number),
          }),
        })
      );
    });
  });

  describe('startSession', () => {
    it('should create a new learning session', async () => {
      const req = mockRequest({
        user: { id: 'userId' },
        body: {
          type: 'REVIEW',
          targetWords: 10,
        },
      });
      const res = mockResponse();

      const newSession = {
        id: 'sessionId',
        userId: 'userId',
        type: 'REVIEW',
        startTime: new Date(),
        wordsReviewed: 0,
        correctAnswers: 0,
      };

      (prisma.learningSession.create as jest.Mock).mockResolvedValue(newSession);

      await startSession(req as Request, res as Response);

      expect(prisma.learningSession.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'userId',
          type: 'REVIEW',
        }),
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(newSession);
    });
  });

  describe('endSession', () => {
    it('should end a learning session', async () => {
      const req = mockRequest({
        user: { id: 'userId' },
        params: { sessionId: 'sessionId' },
        body: {
          wordsReviewed: 10,
          correctAnswers: 8,
        },
      });
      const res = mockResponse();

      const existingSession = {
        id: 'sessionId',
        userId: 'userId',
        startTime: new Date(Date.now() - 600000), // 10 minutes ago
      };

      const updatedSession = {
        ...existingSession,
        endTime: new Date(),
        wordsReviewed: 10,
        correctAnswers: 8,
        duration: 600,
      };

      (prisma.learningSession.findFirst as jest.Mock).mockResolvedValue(existingSession);
      (prisma.learningSession.update as jest.Mock).mockResolvedValue(updatedSession);
      (prisma.user.update as jest.Mock).mockResolvedValue({});

      await endSession(req as Request, res as Response);

      expect(prisma.learningSession.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'sessionId' },
          data: expect.objectContaining({
            endTime: expect.any(Date),
            wordsReviewed: 10,
            correctAnswers: 8,
          }),
        })
      );
      expect(res.json).toHaveBeenCalledWith(updatedSession);
    });

    it('should return 404 if session not found', async () => {
      const req = mockRequest({
        user: { id: 'userId' },
        params: { sessionId: 'nonexistent' },
        body: {},
      });
      const res = mockResponse();

      (prisma.learningSession.findFirst as jest.Mock).mockResolvedValue(null);

      await endSession(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getProgressHistory', () => {
    it('should return progress history for specified period', async () => {
      const req = mockRequest({
        user: { id: 'userId' },
        query: { days: '7' },
      });
      const res = mockResponse();

      const mockSessions = [
        {
          id: 'session1',
          startTime: new Date(),
          wordsReviewed: 15,
          correctAnswers: 12,
          duration: 900,
        },
        {
          id: 'session2',
          startTime: new Date(Date.now() - 86400000),
          wordsReviewed: 20,
          correctAnswers: 18,
          duration: 1200,
        },
      ];

      (prisma.learningSession.findMany as jest.Mock).mockResolvedValue(mockSessions);

      await getProgressHistory(req as Request, res as Response);

      expect(prisma.learningSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'userId',
            startTime: expect.objectContaining({
              gte: expect.any(Date),
            }),
          }),
        })
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          sessions: expect.any(Array),
        })
      );
    });
  });
});
