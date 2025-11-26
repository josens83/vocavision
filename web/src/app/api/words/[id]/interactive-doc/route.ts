/**
 * Interactive Word Documentation API
 *
 * GET /api/words/[id]/interactive-doc
 *
 * Returns n8n-style interactive learning documentation for a word.
 * Generates 5 structured learning steps with interactive content blocks.
 *
 * @module app/api/words/[id]/interactive-doc/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateInteractiveWordDoc, type WordData } from '@/lib/learning/interactiveDocGenerator';
import { cache } from '@/lib/cache/redisCache';
import { measureQuery } from '@/lib/database/queryOptimization';
import prisma from '@/lib/prisma';

/**
 * GET /api/words/:id/interactive-doc
 *
 * Get interactive documentation for a word
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const wordId = params.id;

    // Try to get from cache first
    const cacheKey = `interactive-doc:${wordId}`;
    const cached = await cache.get(cacheKey);

    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        cached: true,
      });
    }

    // Fetch word data from database
    const wordData = await measureQuery(
      'fetch-word-for-interactive-doc',
      async () => {
        return await fetchWordDataFromDatabase(wordId);
      }
    );

    if (!wordData) {
      return NextResponse.json(
        {
          success: false,
          error: 'Word not found',
        },
        { status: 404 }
      );
    }

    // Generate interactive documentation
    const interactiveDoc = generateInteractiveWordDoc(wordData);

    // Cache the result for 1 hour
    await cache.set(cacheKey, interactiveDoc, 3600);

    return NextResponse.json({
      success: true,
      data: interactiveDoc,
      cached: false,
    });
  } catch (error) {
    console.error('Interactive doc generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate interactive documentation',
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

/**
 * Fetch word data from database
 */
async function fetchWordDataFromDatabase(wordId: string): Promise<WordData | null> {
  try {
    const word = await prisma.word.findUnique({
      where: { id: wordId },
      include: {
        examples: true,
        images: true,
        videos: true,
        etymology: true,
        synonyms: true,
        antonyms: true,
        mnemonics: {
          orderBy: { rating: 'desc' },
          take: 3,
        },
      },
    });

    if (!word) return null;

    return {
      id: word.id,
      word: word.word,
      definition: word.definition,
      pronunciation: word.pronunciation || undefined,
      phonetic: word.phonetic || undefined,
      partOfSpeech: word.partOfSpeech.toLowerCase() as WordData['partOfSpeech'],
      difficulty: word.difficulty,
      examples: word.examples.map(e => ({
        sentence: e.sentence,
        translation: e.translation || undefined,
      })),
      images: word.images.map(i => ({
        imageUrl: i.imageUrl,
        description: i.description || undefined,
      })),
      videos: word.videos?.map(v => ({
        videoUrl: v.videoUrl,
        description: v.description || undefined,
      })),
      etymology: word.etymology ? {
        origin: word.etymology.origin,
        rootWords: word.etymology.rootWords,
        evolution: word.etymology.evolution,
        relatedWords: word.etymology.relatedWords,
      } : undefined,
      synonyms: word.synonyms.map(s => ({
        synonym: s.synonym,
        nuance: s.nuance || undefined,
      })),
      antonyms: word.antonyms.map(a => ({
        antonym: a.antonym,
        explanation: a.explanation || undefined,
      })),
      mnemonics: word.mnemonics.map(m => ({
        title: m.title,
        content: m.content,
        koreanHint: m.koreanHint || undefined,
      })),
    };
  } catch (error) {
    console.error('Database query error:', error);

    // Fallback to mock data if database is not available
    console.warn('Falling back to mock data for word:', wordId);

    const mockWord: WordData = {
      id: wordId,
      word: 'serendipity',
      definition: 'The occurrence of events by chance in a happy or beneficial way',
      pronunciation: '/ˌserənˈdipitē/',
      phonetic: 'ser-uhn-DIP-i-tee',
      partOfSpeech: 'noun',
      difficulty: 'INTERMEDIATE',
      examples: [
        {
          sentence: 'Finding that vintage book was pure serendipity.',
          translation: '그 빈티지 책을 발견한 것은 순전히 우연한 행운이었습니다.',
        },
      ],
      images: [
        {
          imageUrl: 'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=800',
          description: 'A fortunate discovery - the essence of serendipity',
        },
      ],
      etymology: {
        origin: 'Coined by Horace Walpole in 1754',
        rootWords: ['Serendip (old name for Sri Lanka)'],
        evolution: 'Originally meant making fortunate discoveries by accident',
        relatedWords: ['serendipitous', 'serendipitously'],
      },
      synonyms: [
        { synonym: 'coincidence', nuance: 'Emphasizes chance occurrence' },
      ],
      antonyms: [
        { antonym: 'misfortune', explanation: 'Bad luck or unfortunate events' },
      ],
      mnemonics: [
        {
          title: 'Seren-DIP-ity = Dip into Happiness',
          content: 'Imagine "dipping" your hand into a bag and finding something wonderful by accident!',
          koreanHint: '"세렌디피티"를 "행운에 담그다"로 연상',
        },
      ],
    };

    return mockWord;
  }
}

/**
 * Track user progress on interactive documentation
 * POST /api/words/:id/interactive-doc
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const wordId = params.id;
    const body = await request.json();

    const {
      userId,
      stepId,
      stepNumber,
      timeSpent,
      interactions,
      score,
      completed,
    }: {
      userId: string;
      stepId: string;
      stepNumber: number;
      timeSpent: number;
      interactions: number;
      score?: number;
      completed: boolean;
    } = body;

    // Validate input
    if (!userId || !stepId || !stepNumber || timeSpent === undefined || interactions === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
        },
        { status: 400 }
      );
    }

    try {
      // Save progress to database
      const progress = await prisma.interactiveDocProgress.upsert({
        where: {
          userId_wordId_stepId: {
            userId,
            wordId,
            stepId,
          },
        },
        update: {
          timeSpent: {
            increment: timeSpent,
          },
          interactions: {
            increment: interactions,
          },
          score,
          completed,
          completedAt: completed ? new Date() : undefined,
          lastInteraction: new Date(),
          updatedAt: new Date(),
        },
        create: {
          userId,
          wordId,
          stepId,
          stepNumber,
          timeSpent,
          interactions,
          score,
          started: true,
          completed,
          startedAt: new Date(),
          completedAt: completed ? new Date() : undefined,
          lastInteraction: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Progress saved',
        data: progress,
      });
    } catch (dbError) {
      console.error('Database error:', dbError);

      // Fallback: just log and return success (for development)
      console.log('Interactive doc progress (mock):', {
        userId,
        wordId,
        stepId,
        stepNumber,
        timeSpent,
        interactions,
        score,
        completed,
      });

      return NextResponse.json({
        success: true,
        message: 'Progress logged (database unavailable)',
      });
    }
  } catch (error) {
    console.error('Progress tracking error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save progress',
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET user's progress for a word
 * GET /api/words/:id/interactive-doc/progress?userId=xxx
 */
export async function GET_PROGRESS(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const wordId = params.id;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'userId is required',
        },
        { status: 400 }
      );
    }

    const progress = await prisma.interactiveDocProgress.findMany({
      where: {
        userId,
        wordId,
      },
      orderBy: {
        stepNumber: 'asc',
      },
    });

    const completion = await prisma.interactiveDocCompletion.findUnique({
      where: {
        userId_wordId: {
          userId,
          wordId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        progress,
        completion,
      },
    });
  } catch (error) {
    console.error('Progress fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch progress',
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
