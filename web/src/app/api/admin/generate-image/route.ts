/**
 * Admin AI Image Generation API
 *
 * POST /api/admin/generate-image
 * Generates an image using Stability AI and uploads to Supabase Storage
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Configuration
const STABILITY_API_KEY = process.env.STABILITY_API_KEY || '';
const STABILITY_API_URL = 'https://api.stability.ai/v1/generation';

// Supabase configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'vocavision-images';

// Visual type configurations for prompt templates
// Strong negative prompts to prevent text rendering issues
const VISUAL_CONFIGS = {
  CONCEPT: {
    style: 'cute 3D cartoon illustration, bright vibrant colors, soft lighting, friendly and approachable, educational',
    negativePrompt: 'text, words, letters, alphabet, typography, writing, captions, labels, watermark, signature, blurry, numbers, characters, font, handwriting, title, subtitle, realistic, photograph, dark, scary',
  },
  MNEMONIC: {
    style: 'cartoon illustration, cute, memorable, colorful',
    negativePrompt: 'text, words, letters, alphabet, typography, writing, captions, labels, watermark, signature, realistic, photograph, numbers, characters, font, handwriting, title, subtitle',
  },
  RHYME: {
    style: 'playful cartoon, humorous, bright colors',
    negativePrompt: 'text, words, letters, alphabet, typography, writing, captions, labels, watermark, signature, realistic, photograph, numbers, characters, font, handwriting, title, subtitle',
  },
};

// Caption templates (not exported - Next.js API routes only allow HTTP method exports)
const CAPTION_TEMPLATES = {
  CONCEPT: {
    ko: (definitionKo: string) => definitionKo,
    en: (definitionEn: string) => definitionEn,
  },
  MNEMONIC: {
    ko: (koreanHint: string) => koreanHint || '연상 기억법',
    en: (word: string, mnemonic: string) => `Memory tip: ${mnemonic.slice(0, 50)}...`,
  },
  RHYME: {
    ko: (word: string, rhyme: string) => `${word}와 ${rhyme}의 연결`,
    en: (word: string, rhyme: string) => `${word} rhymes with ${rhyme}`,
  },
};

interface GenerateImageRequest {
  prompt: string;
  visualType: 'CONCEPT' | 'MNEMONIC' | 'RHYME';
  word: string;
  wordId?: string;
}

interface StabilityResponse {
  artifacts: Array<{
    base64: string;
    seed: number;
    finishReason: string;
  }>;
}

/**
 * Generate image with Stability AI
 */
async function generateWithStabilityAI(
  prompt: string,
  visualType: keyof typeof VISUAL_CONFIGS
): Promise<{ base64: string; seed: number } | null> {
  const config = VISUAL_CONFIGS[visualType];
  const engineId = 'stable-diffusion-xl-1024-v1-0';
  const url = `${STABILITY_API_URL}/${engineId}/text-to-image`;

  const requestBody = {
    text_prompts: [
      { text: prompt, weight: 1 },
      { text: config.negativePrompt, weight: -1 },
    ],
    cfg_scale: 7,
    height: 1024,
    width: 1024,
    steps: 30,
    samples: 1,
    sampler: 'K_DPM_2_ANCESTRAL',
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${STABILITY_API_KEY}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Stability AI error: ${error.message || response.statusText}`);
  }

  const data: StabilityResponse = await response.json();

  if (data.artifacts && data.artifacts.length > 0) {
    return {
      base64: data.artifacts[0].base64,
      seed: data.artifacts[0].seed,
    };
  }

  return null;
}

/**
 * Upload image to Supabase Storage
 */
async function uploadToSupabase(
  base64Data: string,
  word: string,
  visualType: string
): Promise<{ url: string; publicId: string }> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Convert base64 to buffer
  const buffer = Buffer.from(base64Data, 'base64');

  // Generate filename
  const sanitizedWord = word.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const fileName = `${sanitizedWord}-${visualType.toLowerCase()}-${Date.now()}.png`;
  const filePath = `visuals/${fileName}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, buffer, {
      contentType: 'image/png',
      cacheControl: '31536000',
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Supabase upload error: ${uploadError.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(filePath);

  return {
    url: urlData.publicUrl,
    publicId: filePath,
  };
}

/**
 * POST handler - Generate AI image
 */
export async function POST(request: NextRequest) {
  try {
    // Check for required API keys
    if (!STABILITY_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Stability API key not configured' },
        { status: 500 }
      );
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return NextResponse.json(
        { success: false, error: 'Supabase not configured' },
        { status: 500 }
      );
    }

    const body: GenerateImageRequest = await request.json();
    const { prompt, visualType, word, wordId } = body;

    if (!prompt || !visualType || !word) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: prompt, visualType, word' },
        { status: 400 }
      );
    }

    console.log(`[AI Image Gen] Starting generation for "${word}" (${visualType})`);
    console.log(`[AI Image Gen] Prompt: ${prompt.substring(0, 100)}...`);

    // Generate image with Stability AI
    const imageResult = await generateWithStabilityAI(prompt, visualType);

    if (!imageResult) {
      throw new Error('Failed to generate image');
    }

    console.log(`[AI Image Gen] Image generated, uploading to Supabase Storage...`);

    // Upload to Supabase Storage
    const uploadResult = await uploadToSupabase(imageResult.base64, word, visualType);

    console.log(`[AI Image Gen] Success! URL: ${uploadResult.url}`);

    return NextResponse.json({
      success: true,
      data: {
        imageUrl: uploadResult.url,
        publicId: uploadResult.publicId,
        seed: imageResult.seed,
        prompt,
        visualType,
        word,
        wordId,
      },
    });
  } catch (error) {
    console.error('[AI Image Gen] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate image',
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler - Get prompt templates
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    templates: {
      CONCEPT: 'A 1:1 square flat illustration showing the concept of "{word}" which means "{definitionEn}"...',
      MNEMONIC: 'A 1:1 square cartoon illustration visualizing this memory tip: {mnemonic}...',
      RHYME: 'A 1:1 square humorous illustration of "{word}" with rhyming words...',
    },
    captions: CAPTION_TEMPLATES,
  });
}
