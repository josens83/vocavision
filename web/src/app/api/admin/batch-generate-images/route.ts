/**
 * Admin Batch Image Generation API
 *
 * POST /api/admin/batch-generate-images
 * Generates images for multiple words using Stability AI + Claude API
 */

import { NextRequest, NextResponse } from 'next/server';

// Configuration
const STABILITY_API_KEY = process.env.STABILITY_API_KEY || '';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || '';
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || '';
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface WordData {
  id: string;
  word: string;
  definitionEn?: string;
  definitionKo?: string;
  mnemonic?: string;
  mnemonicKorean?: string;
  rhymingWords?: string[];
}

interface BatchGenerateRequest {
  wordIds: string[];
  options?: {
    skipExisting?: boolean;
    types?: ('CONCEPT' | 'MNEMONIC' | 'RHYME')[];
  };
}

// In-memory job store (in production, use Redis or a database)
const jobs: Map<string, {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalWords: number;
  processedWords: number;
  currentWord?: string;
  currentType?: string;
  results: Array<{
    wordId: string;
    word: string;
    success: boolean;
    imagesGenerated: number;
    error?: string;
  }>;
  startedAt: string;
  completedAt?: string;
}> = new Map();

/**
 * Fetch word data from backend
 */
async function fetchWordData(wordId: string): Promise<WordData | null> {
  try {
    const response = await fetch(`${API_BASE}/admin/words/${wordId}`, {
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': process.env.NEXT_PUBLIC_ADMIN_KEY || '',
      },
    });

    if (!response.ok) return null;

    const data = await response.json();
    const word = data.word;
    const content = word.content;

    return {
      id: word.id,
      word: word.word,
      definitionEn: content?.definitions?.[0]?.definitionEn,
      definitionKo: content?.definitions?.[0]?.definitionKo,
      mnemonic: content?.mnemonic,
      mnemonicKorean: content?.mnemonicKorean,
      rhymingWords: content?.rhymingWords,
    };
  } catch (error) {
    console.error(`Failed to fetch word ${wordId}:`, error);
    return null;
  }
}

/**
 * Generate smart content using Claude API
 */
async function generateSmartContent(wordData: WordData): Promise<{
  mnemonicPrompt?: string;
  mnemonicCaption?: { ko: string; en: string };
  rhymeCaption?: { ko: string; en: string };
} | null> {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/admin/generate-smart-content`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wordData: {
          word: wordData.word,
          definitionEn: wordData.definitionEn,
          definitionKo: wordData.definitionKo,
          mnemonic: wordData.mnemonic,
          mnemonicKorean: wordData.mnemonicKorean,
          rhymingWords: wordData.rhymingWords,
        },
        types: ['MNEMONIC_PROMPT', 'MNEMONIC_CAPTION', 'RHYME_CAPTION'],
      }),
    });

    const result = await response.json();
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

/**
 * Generate image using the existing generate-image API
 */
async function generateImage(
  prompt: string,
  visualType: string,
  word: string,
  wordId: string
): Promise<{ imageUrl: string } | null> {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/admin/generate-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, visualType, word, wordId }),
    });

    const result = await response.json();
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

/**
 * Save visuals to backend
 */
async function saveVisuals(wordId: string, visuals: Array<{
  type: string;
  imageUrl: string;
  captionKo?: string;
  captionEn?: string;
  promptEn?: string;
}>): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/admin/words/${wordId}/visuals`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': process.env.NEXT_PUBLIC_ADMIN_KEY || '',
      },
      body: JSON.stringify({ visuals }),
    });

    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Process a single word
 */
async function processWord(
  wordData: WordData,
  types: ('CONCEPT' | 'MNEMONIC' | 'RHYME')[],
  jobId: string
): Promise<{ success: boolean; imagesGenerated: number; error?: string }> {
  const job = jobs.get(jobId);
  if (!job) return { success: false, imagesGenerated: 0, error: 'Job not found' };

  const generatedVisuals: Array<{
    type: string;
    imageUrl: string;
    captionKo?: string;
    captionEn?: string;
    promptEn?: string;
  }> = [];

  // Get smart content if mnemonic exists
  let smartContent: Awaited<ReturnType<typeof generateSmartContent>> = null;
  if (wordData.mnemonic && (types.includes('MNEMONIC') || types.includes('RHYME'))) {
    smartContent = await generateSmartContent(wordData);
  }

  for (const type of types) {
    // Update job status
    job.currentType = type;
    jobs.set(jobId, job);

    let prompt: string;
    let captionKo: string;
    let captionEn: string;

    // Generate prompts and captions based on type
    switch (type) {
      case 'CONCEPT':
        prompt = `A 1:1 square flat vector illustration showing the concept: "${wordData.definitionEn || wordData.word}". Style: clean flat design, bright educational colors, minimal, high quality. CRITICAL: Absolutely NO text, NO letters, NO words, NO writing anywhere in the image. Pure visual illustration only.`;
        captionKo = wordData.definitionKo || `${wordData.word}의 의미`;
        captionEn = wordData.definitionEn || `The meaning of ${wordData.word}`;
        break;

      case 'MNEMONIC':
        if (smartContent?.mnemonicPrompt) {
          prompt = smartContent.mnemonicPrompt;
        } else {
          prompt = `A 1:1 square cartoon illustration visualizing: ${wordData.mnemonic || wordData.word}. Style: cute cartoon, memorable, colorful. CRITICAL: NO text in image.`;
        }
        captionKo = smartContent?.mnemonicCaption?.ko || wordData.mnemonicKorean || `${wordData.word} 연상법`;
        captionEn = smartContent?.mnemonicCaption?.en || wordData.mnemonic?.substring(0, 50) || `Memory tip for ${wordData.word}`;
        break;

      case 'RHYME':
        const rhymes = wordData.rhymingWords?.slice(0, 3).join(', ') || '';
        prompt = `A 1:1 square humorous cartoon illustration showing: "${wordData.definitionEn || wordData.word}". Style: playful cartoon, bright colors. CRITICAL: NO text in image.`;
        if (smartContent?.rhymeCaption) {
          captionKo = smartContent.rhymeCaption.ko;
          captionEn = smartContent.rhymeCaption.en;
        } else {
          captionKo = rhymes ? `${wordData.word}는 ${rhymes}와 라임!` : wordData.definitionKo || '';
          captionEn = rhymes ? `${wordData.word} rhymes with ${rhymes}` : wordData.definitionEn || '';
        }
        break;
    }

    // Generate image
    const imageResult = await generateImage(prompt, type, wordData.word, wordData.id);

    if (imageResult?.imageUrl) {
      generatedVisuals.push({
        type,
        imageUrl: imageResult.imageUrl,
        captionKo,
        captionEn,
        promptEn: prompt,
      });
    }

    // Rate limit delay
    await new Promise((r) => setTimeout(r, 2000));
  }

  // Save visuals to backend
  if (generatedVisuals.length > 0) {
    await saveVisuals(wordData.id, generatedVisuals);
  }

  return {
    success: generatedVisuals.length > 0,
    imagesGenerated: generatedVisuals.length,
  };
}

/**
 * Background job processor
 */
async function processJob(jobId: string, wordIds: string[], options: BatchGenerateRequest['options']) {
  const job = jobs.get(jobId);
  if (!job) return;

  job.status = 'processing';
  jobs.set(jobId, job);

  const types = options?.types || ['CONCEPT', 'MNEMONIC', 'RHYME'];

  for (let i = 0; i < wordIds.length; i++) {
    const wordId = wordIds[i];

    // Fetch word data
    const wordData = await fetchWordData(wordId);
    if (!wordData) {
      job.results.push({
        wordId,
        word: 'Unknown',
        success: false,
        imagesGenerated: 0,
        error: 'Failed to fetch word data',
      });
      job.processedWords++;
      jobs.set(jobId, job);
      continue;
    }

    job.currentWord = wordData.word;
    jobs.set(jobId, job);

    // Process word
    const result = await processWord(wordData, types, jobId);

    job.results.push({
      wordId: wordData.id,
      word: wordData.word,
      success: result.success,
      imagesGenerated: result.imagesGenerated,
      error: result.error,
    });
    job.processedWords++;
    jobs.set(jobId, job);
  }

  job.status = 'completed';
  job.completedAt = new Date().toISOString();
  job.currentWord = undefined;
  job.currentType = undefined;
  jobs.set(jobId, job);
}

/**
 * POST handler - Start batch image generation
 */
export async function POST(request: NextRequest) {
  try {
    // Check for required API keys
    if (!STABILITY_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Stability API not configured' },
        { status: 500 }
      );
    }

    const body: BatchGenerateRequest = await request.json();
    const { wordIds, options } = body;

    if (!wordIds || wordIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No word IDs provided' },
        { status: 400 }
      );
    }

    if (wordIds.length > 50) {
      return NextResponse.json(
        { success: false, error: 'Maximum 50 words per batch' },
        { status: 400 }
      );
    }

    // Create job
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const job = {
      id: jobId,
      status: 'pending' as const,
      totalWords: wordIds.length,
      processedWords: 0,
      results: [],
      startedAt: new Date().toISOString(),
    };

    jobs.set(jobId, job);

    // Start processing in background (don't await)
    processJob(jobId, wordIds, options).catch(console.error);

    // Estimate time (roughly 10 seconds per image, 3 images per word)
    const estimatedMinutes = Math.ceil((wordIds.length * 3 * 10) / 60);

    return NextResponse.json({
      success: true,
      data: {
        jobId,
        totalWords: wordIds.length,
        estimatedTime: `약 ${estimatedMinutes}분`,
      },
    });
  } catch (error) {
    console.error('[Batch Image Gen] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to start batch generation',
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler - Get job status
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');

  if (!jobId) {
    return NextResponse.json(
      { success: false, error: 'Job ID required' },
      { status: 400 }
    );
  }

  const job = jobs.get(jobId);

  if (!job) {
    return NextResponse.json(
      { success: false, error: 'Job not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: job,
  });
}
