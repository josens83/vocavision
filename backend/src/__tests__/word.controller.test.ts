import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { mockRequest, mockResponse } from './setup';

const { getWords, getWordById, getRandomWords, createWord } = require('../controllers/word.controller');

const prisma = new PrismaClient();

describe('Word Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getWords', () => {
    it('should return a list of words', async () => {
      const req = mockRequest({
        query: {
          page: '1',
          limit: '10',
        },
      });
      const res = mockResponse();

      const mockWords = [
        {
          id: 'word1',
          word: 'ephemeral',
          definition: 'lasting for a very short time',
          difficulty: 'ADVANCED',
          examples: ['The ephemeral nature of cherry blossoms'],
        },
        {
          id: 'word2',
          word: 'ubiquitous',
          definition: 'present everywhere',
          difficulty: 'ADVANCED',
          examples: ['Smartphones have become ubiquitous'],
        },
      ];

      (prisma.word.findMany as jest.Mock).mockResolvedValue(mockWords);
      (prisma.word.count as jest.Mock).mockResolvedValue(100);

      await getWords(req as Request, res as Response);

      expect(prisma.word.findMany).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          words: expect.arrayContaining([
            expect.objectContaining({ word: 'ephemeral' }),
          ]),
        })
      );
    });

    it('should filter words by difficulty', async () => {
      const req = mockRequest({
        query: {
          difficulty: 'BEGINNER',
        },
      });
      const res = mockResponse();

      (prisma.word.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.word.count as jest.Mock).mockResolvedValue(0);

      await getWords(req as Request, res as Response);

      expect(prisma.word.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            difficulty: 'BEGINNER',
          }),
        })
      );
    });

    it('should search words by keyword', async () => {
      const req = mockRequest({
        query: {
          search: 'time',
        },
      });
      const res = mockResponse();

      (prisma.word.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.word.count as jest.Mock).mockResolvedValue(0);

      await getWords(req as Request, res as Response);

      expect(prisma.word.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        })
      );
    });
  });

  describe('getWordById', () => {
    it('should return a word by ID', async () => {
      const req = mockRequest({
        params: { id: 'word1' },
      });
      const res = mockResponse();

      const mockWord = {
        id: 'word1',
        word: 'ephemeral',
        definition: 'lasting for a very short time',
        pronunciation: '/ɪˈfem(ə)rəl/',
        difficulty: 'ADVANCED',
        examples: ['The ephemeral nature of cherry blossoms'],
        synonyms: ['transient', 'fleeting'],
        antonyms: ['permanent', 'lasting'],
      };

      (prisma.word.findUnique as jest.Mock).mockResolvedValue(mockWord);

      await getWordById(req as Request, res as Response);

      expect(prisma.word.findUnique).toHaveBeenCalledWith({
        where: { id: 'word1' },
        include: expect.any(Object),
      });
      expect(res.json).toHaveBeenCalledWith(mockWord);
    });

    it('should return 404 if word not found', async () => {
      const req = mockRequest({
        params: { id: 'nonexistent' },
      });
      const res = mockResponse();

      (prisma.word.findUnique as jest.Mock).mockResolvedValue(null);

      await getWordById(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
        })
      );
    });
  });

  describe('getRandomWords', () => {
    it('should return random words', async () => {
      const req = mockRequest({
        query: {
          count: '5',
        },
      });
      const res = mockResponse();

      const mockWords = [
        { id: 'word1', word: 'ephemeral' },
        { id: 'word2', word: 'ubiquitous' },
        { id: 'word3', word: 'serendipity' },
      ];

      (prisma.word.count as jest.Mock).mockResolvedValue(100);
      (prisma.word.findMany as jest.Mock).mockResolvedValue(mockWords);

      await getRandomWords(req as Request, res as Response);

      expect(prisma.word.findMany).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.any(Array));
    });

    it('should filter random words by difficulty', async () => {
      const req = mockRequest({
        query: {
          count: '3',
          difficulty: 'INTERMEDIATE',
        },
      });
      const res = mockResponse();

      (prisma.word.count as jest.Mock).mockResolvedValue(50);
      (prisma.word.findMany as jest.Mock).mockResolvedValue([]);

      await getRandomWords(req as Request, res as Response);

      expect(prisma.word.count).toHaveBeenCalledWith({
        where: { difficulty: 'INTERMEDIATE' },
      });
    });
  });

  describe('createWord', () => {
    it('should create a new word', async () => {
      const req = mockRequest({
        body: {
          word: 'pulchritudinous',
          definition: 'beautiful',
          pronunciation: '/ˌpəlkrəˈt(y)o͞odənəs/',
          difficulty: 'EXPERT',
          examples: ['The pulchritudinous sunset'],
          synonyms: ['beautiful', 'gorgeous'],
          antonyms: ['ugly'],
        },
      });
      const res = mockResponse();

      const createdWord = {
        id: 'newWordId',
        ...req.body,
        createdAt: new Date(),
      };

      (prisma.word.create as jest.Mock).mockResolvedValue(createdWord);

      await createWord(req as Request, res as Response);

      expect(prisma.word.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          word: 'pulchritudinous',
          definition: 'beautiful',
        }),
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(createdWord);
    });

    it('should return 400 if required fields are missing', async () => {
      const req = mockRequest({
        body: {
          word: 'test',
          // missing definition
        },
      });
      const res = mockResponse();

      await createWord(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
