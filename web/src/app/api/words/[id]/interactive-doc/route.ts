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
        // In production, this would fetch from Prisma
        // For now, return mock data based on wordId
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
 * TODO: Replace with actual Prisma query in production
 */
async function fetchWordDataFromDatabase(wordId: string): Promise<WordData | null> {
  // Mock implementation - replace with actual database query
  // Example Prisma query:
  /*
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
    pronunciation: word.pronunciation,
    phonetic: word.phonetic,
    partOfSpeech: word.partOfSpeech,
    difficulty: word.difficulty,
    examples: word.examples.map(e => ({
      sentence: e.sentence,
      translation: e.translation,
    })),
    images: word.images.map(i => ({
      imageUrl: i.imageUrl,
      description: i.description,
    })),
    videos: word.videos?.map(v => ({
      videoUrl: v.videoUrl,
      caption: v.caption,
    })),
    etymology: word.etymology ? {
      origin: word.etymology.origin,
      rootWords: word.etymology.rootWords,
      evolution: word.etymology.evolution,
      relatedWords: word.etymology.relatedWords,
    } : undefined,
    synonyms: word.synonyms.map(s => ({
      synonym: s.synonym,
      nuance: s.nuance,
    })),
    antonyms: word.antonyms.map(a => ({
      antonym: a.antonym,
      explanation: a.explanation,
    })),
    mnemonics: word.mnemonics.map(m => ({
      title: m.title,
      content: m.content,
      koreanHint: m.koreanHint,
    })),
  };
  */

  // Mock data for development
  const mockWords: Record<string, WordData> = {
    default: {
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
        {
          sentence: 'Their meeting was a moment of serendipity that changed both their lives.',
          translation: '그들의 만남은 두 사람의 삶을 바꾼 우연한 행운의 순간이었습니다.',
        },
      ],
      images: [
        {
          imageUrl: 'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=800',
          description: 'A fortunate discovery - the essence of serendipity',
        },
      ],
      etymology: {
        origin: 'Coined by Horace Walpole in 1754, based on a Persian fairy tale "The Three Princes of Serendip"',
        rootWords: ['Serendip (old name for Sri Lanka)'],
        evolution: 'Originally meant making fortunate discoveries by accident',
        relatedWords: ['serendipitous', 'serendipitously'],
      },
      synonyms: [
        { synonym: 'coincidence', nuance: 'Emphasizes chance occurrence' },
        { synonym: 'fortuity', nuance: 'Focuses on luck factor' },
        { synonym: 'luck', nuance: 'General good fortune' },
      ],
      antonyms: [
        { antonym: 'misfortune', explanation: 'Bad luck or unfortunate events' },
        { antonym: 'design', explanation: 'Planned or intentional outcome' },
      ],
      mnemonics: [
        {
          title: 'Seren-DIP-ity = Dip into Happiness',
          content: 'Imagine "dipping" your hand into a bag and finding something wonderful by accident. That\'s serendipity!',
          koreanHint: '"세렌디피티"를 "행운에 담그다"로 연상: 우연히 행운을 발견하는 것',
        },
      ],
    },
  };

  return mockWords[wordId] || mockWords.default;
}

/**
 * Track user progress on interactive documentation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const wordId = params.id;
    const body = await request.json();

    const {
      stepId,
      timeSpent,
      interactions,
      score,
      completed,
    }: {
      stepId: string;
      timeSpent: number;
      interactions: number;
      score?: number;
      completed: boolean;
    } = body;

    // Validate input
    if (!stepId || timeSpent === undefined || interactions === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
        },
        { status: 400 }
      );
    }

    // TODO: Save progress to database
    /*
    await prisma.interactiveDocProgress.create({
      data: {
        userId: currentUser.id,
        wordId,
        stepId,
        timeSpent,
        interactions,
        score,
        completed,
        completedAt: completed ? new Date() : null,
      },
    });
    */

    // For now, just return success
    console.log('Interactive doc progress:', {
      wordId,
      stepId,
      timeSpent,
      interactions,
      score,
      completed,
    });

    return NextResponse.json({
      success: true,
      message: 'Progress saved',
    });
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
