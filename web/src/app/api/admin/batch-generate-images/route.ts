/**
 * Admin Batch Image Generation API
 *
 * Uses backend database for job persistence (solves serverless memory issue)
 *
 * POST /api/admin/batch-generate-images - Create job & start processing
 * GET /api/admin/batch-generate-images?jobId=xxx - Get job status
 */

import { NextRequest, NextResponse } from 'next/server';

// Configuration
const STABILITY_API_KEY = process.env.STABILITY_API_KEY || '';
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';
const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_KEY || '';

// Debug: Log configuration on module load
console.log('[BatchGen] Module loaded with config:', {
  hasStabilityKey: !!STABILITY_API_KEY,
  stabilityKeyLength: STABILITY_API_KEY.length,
  apiBase: API_BASE,
  hasAdminKey: !!ADMIN_KEY,
});

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

/**
 * Fetch word data from backend
 */
async function fetchWordData(wordId: string): Promise<WordData | null> {
  console.log('[FetchWord] Fetching word:', wordId);
  console.log('[FetchWord] URL:', `${API_BASE}/admin/words/${wordId}`);

  try {
    const response = await fetch(`${API_BASE}/admin/words/${wordId}`, {
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': ADMIN_KEY,
      },
    });

    console.log('[FetchWord] Response status:', response.status);

    if (!response.ok) {
      console.error('[FetchWord] Failed with status:', response.status);
      return null;
    }

    const data = await response.json();
    console.log('[FetchWord] Got data for:', data.word?.word);

    const word = data.word;
    const content = word.content;

    return {
      id: word.id,
      word: word.word,
      definitionEn: content?.definitions?.[0]?.definitionEn || word.definition,
      definitionKo: content?.definitions?.[0]?.definitionKo || word.definitionKo,
      mnemonic: content?.mnemonic,
      mnemonicKorean: content?.mnemonicKorean,
      rhymingWords: content?.rhymingWords || word.rhymingWords,
    };
  } catch (error) {
    console.error('[FetchWord] Error:', error);
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
  console.log('[SmartContent] Generating for:', wordData.word);

  try {
    const url = `${process.env.NEXTAUTH_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/admin/generate-smart-content`;
    console.log('[SmartContent] URL:', url);

    const response = await fetch(url, {
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

    console.log('[SmartContent] Response status:', response.status);

    const result = await response.json();
    console.log('[SmartContent] Result success:', result.success);

    return result.success ? result.data : null;
  } catch (error) {
    console.error('[SmartContent] Error:', error);
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
  console.log('[GenerateImage] Starting for:', word, visualType);
  console.log('[GenerateImage] Prompt length:', prompt.length);

  try {
    const url = `${process.env.NEXTAUTH_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/admin/generate-image`;
    console.log('[GenerateImage] URL:', url);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, visualType, word, wordId }),
    });

    console.log('[GenerateImage] Response status:', response.status);

    const result = await response.json();
    console.log('[GenerateImage] Result:', {
      success: result.success,
      hasImageUrl: !!result.data?.imageUrl,
      error: result.error,
    });

    if (!result.success) {
      console.error('[GenerateImage] Failed:', result.error);
    }

    return result.success ? result.data : null;
  } catch (error) {
    console.error('[GenerateImage] Error:', error);
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
  console.log('[SaveVisuals] Saving', visuals.length, 'visuals for word:', wordId);

  try {
    const response = await fetch(`${API_BASE}/admin/words/${wordId}/visuals`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': ADMIN_KEY,
      },
      body: JSON.stringify({ visuals }),
    });

    console.log('[SaveVisuals] Response status:', response.status);
    return response.ok;
  } catch (error) {
    console.error('[SaveVisuals] Error:', error);
    return false;
  }
}

/**
 * Update job in backend database
 */
async function updateJobInDB(jobId: string, updateData: {
  status?: string;
  progress?: number;
  result?: Record<string, unknown>;
  error?: string;
}): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/admin/image-jobs/${jobId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': ADMIN_KEY,
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      console.error('[UpdateJob] Failed with status:', response.status);
    }
  } catch (error) {
    console.error('[UpdateJob] Error:', error);
  }
}

/**
 * Process a single word
 */
async function processWord(
  wordData: WordData,
  types: ('CONCEPT' | 'MNEMONIC' | 'RHYME')[],
  jobId: string,
  currentJobResult: {
    processedWords: number;
    totalWords: number;
    currentWord?: string;
    currentType?: string;
    results: Array<{
      wordId: string;
      word: string;
      success: boolean;
      imagesGenerated: number;
      error?: string;
    }>;
  }
): Promise<{ success: boolean; imagesGenerated: number; error?: string }> {
  console.log('[ProcessWord] Starting:', wordData.word, 'types:', types);

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
    console.log('[ProcessWord] Processing type:', type, 'for', wordData.word);

    // Update job status
    currentJobResult.currentType = type;
    await updateJobInDB(jobId, { result: currentJobResult });

    let prompt: string;
    let captionKo: string;
    let captionEn: string;

    // Generate prompts and captions based on type
    switch (type) {
      case 'CONCEPT':
        prompt = `A 1:1 square cute cartoon illustration showing the meaning of "${wordData.word}" which means "${wordData.definitionEn || wordData.word}". Style: Pixar-like 3D cartoon, bright vibrant colors, friendly character design, simple clean composition, educational and memorable. The image should help language learners instantly understand and remember the word meaning. CRITICAL: Absolutely NO text, NO letters, NO words, NO writing anywhere in the image. Pure visual illustration only.`;
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
    console.log('[ProcessWord] Calling generateImage for', wordData.word, type);
    const imageResult = await generateImage(prompt, type, wordData.word, wordData.id);

    if (imageResult?.imageUrl) {
      console.log('[ProcessWord] Image generated successfully for', wordData.word, type);
      generatedVisuals.push({
        type,
        imageUrl: imageResult.imageUrl,
        captionKo,
        captionEn,
        promptEn: prompt,
      });
    } else {
      console.error('[ProcessWord] Image generation failed for', wordData.word, type);
    }

    // Rate limit delay
    console.log('[ProcessWord] Waiting 2 seconds before next...');
    await new Promise((r) => setTimeout(r, 2000));
  }

  // Save visuals to backend
  if (generatedVisuals.length > 0) {
    console.log('[ProcessWord] Saving', generatedVisuals.length, 'visuals');
    await saveVisuals(wordData.id, generatedVisuals);
  }

  console.log('[ProcessWord] Completed:', wordData.word, 'generated:', generatedVisuals.length);

  return {
    success: generatedVisuals.length > 0,
    imagesGenerated: generatedVisuals.length,
  };
}

/**
 * Background job processor
 */
async function processJob(jobId: string, wordIds: string[], options: BatchGenerateRequest['options']) {
  console.log('[ProcessJob] ========== STARTING JOB ==========');
  console.log('[ProcessJob] Job ID:', jobId);
  console.log('[ProcessJob] Word IDs:', wordIds);
  console.log('[ProcessJob] Options:', options);

  const types = options?.types || ['CONCEPT', 'MNEMONIC', 'RHYME'];

  const jobResult = {
    totalWords: wordIds.length,
    processedWords: 0,
    currentWord: undefined as string | undefined,
    currentType: undefined as string | undefined,
    results: [] as Array<{
      wordId: string;
      word: string;
      success: boolean;
      imagesGenerated: number;
      error?: string;
    }>,
  };

  // Update job status to processing
  console.log('[ProcessJob] Updating job status to processing');
  await updateJobInDB(jobId, {
    status: 'processing',
    progress: 0,
    result: jobResult,
  });

  for (let i = 0; i < wordIds.length; i++) {
    const wordId = wordIds[i];
    console.log(`[ProcessJob] Processing word ${i + 1}/${wordIds.length}:`, wordId);

    // Fetch word data
    const wordData = await fetchWordData(wordId);
    if (!wordData) {
      console.error('[ProcessJob] Failed to fetch word data for:', wordId);
      jobResult.results.push({
        wordId,
        word: 'Unknown',
        success: false,
        imagesGenerated: 0,
        error: 'Failed to fetch word data',
      });
      jobResult.processedWords++;

      const progress = Math.round((jobResult.processedWords / jobResult.totalWords) * 100);
      await updateJobInDB(jobId, { progress, result: jobResult });
      continue;
    }

    console.log('[ProcessJob] Got word data:', wordData.word);
    jobResult.currentWord = wordData.word;
    await updateJobInDB(jobId, { result: jobResult });

    // Process word
    const result = await processWord(wordData, types, jobId, jobResult);

    console.log('[ProcessJob] Word result:', {
      word: wordData.word,
      success: result.success,
      imagesGenerated: result.imagesGenerated,
    });

    jobResult.results.push({
      wordId: wordData.id,
      word: wordData.word,
      success: result.success,
      imagesGenerated: result.imagesGenerated,
      error: result.error,
    });
    jobResult.processedWords++;

    const progress = Math.round((jobResult.processedWords / jobResult.totalWords) * 100);
    console.log('[ProcessJob] Progress:', progress + '%');
    await updateJobInDB(jobId, { progress, result: jobResult });
  }

  // Mark job as completed
  console.log('[ProcessJob] ========== JOB COMPLETED ==========');
  console.log('[ProcessJob] Final results:', jobResult.results);
  jobResult.currentWord = undefined;
  jobResult.currentType = undefined;
  await updateJobInDB(jobId, {
    status: 'completed',
    progress: 100,
    result: jobResult,
  });
}

/**
 * POST handler - Start batch image generation
 */
export async function POST(request: NextRequest) {
  console.log('[POST] ========== BATCH GENERATE REQUEST ==========');

  try {
    // Check for required API keys
    console.log('[POST] Checking STABILITY_API_KEY...');
    if (!STABILITY_API_KEY) {
      console.error('[POST] STABILITY_API_KEY is not configured!');
      return NextResponse.json(
        { success: false, error: 'Stability API not configured' },
        { status: 500 }
      );
    }
    console.log('[POST] STABILITY_API_KEY is configured (length:', STABILITY_API_KEY.length, ')');

    const body: BatchGenerateRequest = await request.json();
    const { wordIds, options } = body;

    console.log('[POST] Request body:', { wordIds, options });

    if (!wordIds || wordIds.length === 0) {
      console.error('[POST] No word IDs provided');
      return NextResponse.json(
        { success: false, error: 'No word IDs provided' },
        { status: 400 }
      );
    }

    if (wordIds.length > 50) {
      console.error('[POST] Too many words:', wordIds.length);
      return NextResponse.json(
        { success: false, error: 'Maximum 50 words per batch' },
        { status: 400 }
      );
    }

    // Create job in backend database
    console.log('[POST] Creating job in backend...');
    console.log('[POST] API_BASE:', API_BASE);

    const createResponse = await fetch(`${API_BASE}/admin/image-jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': ADMIN_KEY,
      },
      body: JSON.stringify({ wordIds, types: options?.types }),
    });

    console.log('[POST] Create job response status:', createResponse.status);

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('[POST] Failed to create job:', errorText);
      return NextResponse.json(
        { success: false, error: 'Failed to create job: ' + errorText },
        { status: 500 }
      );
    }

    const createResult = await createResponse.json();
    console.log('[POST] Create job result:', createResult);

    const jobId = createResult.data?.jobId;

    if (!jobId) {
      console.error('[POST] No jobId in response');
      return NextResponse.json(
        { success: false, error: 'Failed to get job ID' },
        { status: 500 }
      );
    }

    console.log('[POST] Job created with ID:', jobId);

    // Start processing in background (don't await)
    console.log('[POST] Starting background processing...');
    processJob(jobId, wordIds, options).catch(async (error) => {
      console.error('[POST] Background job error:', error);
      await updateJobInDB(jobId, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    });

    console.log('[POST] Returning success response');
    return NextResponse.json({
      success: true,
      data: createResult.data,
    });
  } catch (error) {
    console.error('[POST] Unexpected error:', error);
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
 * GET handler - Get job status from backend database
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

  try {
    // Fetch job status from backend database
    const response = await fetch(`${API_BASE}/admin/image-jobs/${jobId}`, {
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': ADMIN_KEY,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { success: false, error: errorData.error || 'Job not found' },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('[GET] Error fetching job:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch job status' },
      { status: 500 }
    );
  }
}
