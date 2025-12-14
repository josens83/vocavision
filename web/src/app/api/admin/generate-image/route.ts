/**
 * Admin AI Image Generation API
 *
 * POST /api/admin/generate-image
 * Generates an image using Stability AI and uploads to Cloudinary
 */

import { NextRequest, NextResponse } from 'next/server';

// Configuration
const STABILITY_API_KEY = process.env.STABILITY_API_KEY || '';
const STABILITY_API_URL = 'https://api.stability.ai/v1/generation';
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || '';
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || '';

// Visual type configurations for prompt templates
// Strong negative prompts to prevent text rendering issues
const VISUAL_CONFIGS = {
  CONCEPT: {
    style: 'flat illustration, educational, clean design',
    negativePrompt: 'text, words, letters, alphabet, typography, writing, captions, labels, watermark, signature, blurry, numbers, characters, font, handwriting, title, subtitle',
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

// Prompt templates (not exported - Next.js API routes only allow HTTP method exports)
// CRITICAL: Strong emphasis on NO TEXT to prevent AI text rendering issues
const PROMPT_TEMPLATES = {
  CONCEPT: (word: string, definitionEn: string) =>
    `A 1:1 square flat vector illustration showing the concept: "${definitionEn}". Style: clean flat design, bright educational colors, minimal, high quality. CRITICAL: Absolutely NO text, NO letters, NO words, NO writing anywhere in the image. Pure visual illustration only.`,

  MNEMONIC: (word: string, mnemonic: string, koreanHint?: string) =>
    `A 1:1 square cartoon illustration visualizing this memory scene: ${mnemonic}. Style: cute cartoon, memorable, colorful, exaggerated expressions, whimsical. CRITICAL: Absolutely NO text, NO letters, NO words, NO writing anywhere in the image. Pure visual illustration only.`,

  RHYME: (word: string, rhymingWords: string[], definitionEn?: string) =>
    `A 1:1 square humorous cartoon illustration showing a funny scene that represents "${definitionEn || word}". Style: playful cartoon, bright colors, fun expressions, dynamic composition. CRITICAL: Absolutely NO text, NO letters, NO words, NO writing anywhere in the image. Pure visual illustration only.`,
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
 * Upload image to Cloudinary
 */
async function uploadToCloudinary(
  base64Data: string,
  word: string,
  visualType: string
): Promise<{ url: string; publicId: string }> {
  const crypto = await import('crypto');
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = 'vocavision/visuals';
  const publicId = `${word.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${visualType.toLowerCase()}-${Date.now()}`;

  // Generate signature
  const signatureString = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
  const signature = crypto.createHash('sha1').update(signatureString).digest('hex');

  // Prepare form data
  const formData = new FormData();
  formData.append('file', `data:image/png;base64,${base64Data}`);
  formData.append('api_key', CLOUDINARY_API_KEY);
  formData.append('timestamp', String(timestamp));
  formData.append('signature', signature);
  formData.append('folder', folder);
  formData.append('public_id', publicId);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Cloudinary upload error: ${error.error?.message || response.statusText}`);
  }

  const result = await response.json();
  return {
    url: result.secure_url,
    publicId: result.public_id,
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

    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
      return NextResponse.json(
        { success: false, error: 'Cloudinary not configured' },
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

    console.log(`[AI Image Gen] Image generated, uploading to Cloudinary...`);

    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(imageResult.base64, word, visualType);

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
