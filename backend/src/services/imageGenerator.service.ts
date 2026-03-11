// ============================================
// VocaVision - AI Image Generation Service
// Stability AI + Supabase Storage 이미지 생성
// ============================================

import logger from '../utils/logger';
import { getSupabaseClient, checkSupabaseConfig } from '../lib/supabase';

// Configuration
const STABILITY_API_KEY = process.env.STABILITY_API_KEY || '';
const STABILITY_API_URL = 'https://api.stability.ai/v1/generation';

// Storage bucket name
const STORAGE_BUCKET = 'word-images';

// Visual type configurations (2D cartoon style - same as batch generation)
const VISUAL_CONFIGS = {
  CONCEPT: {
    style: 'cartoon illustration, soft pastel colors, clean simple composition, white background',
    negativePrompt: 'text, words, letters, alphabet, typography, writing, captions, labels, watermark, signature, blurry, numbers, characters, font, handwriting, title, subtitle, 3D, realistic, photograph, dark, scary, cluttered',
  },
  MNEMONIC: {
    style: 'cartoon illustration, cute, memorable, colorful, white background',
    negativePrompt: 'text, words, letters, alphabet, typography, writing, captions, labels, watermark, signature, realistic, photograph, numbers, characters, font, handwriting, title, subtitle, 3D',
  },
  RHYME: {
    style: 'playful cartoon, humorous, bright colors, white background',
    negativePrompt: 'text, words, letters, alphabet, typography, writing, captions, labels, watermark, signature, realistic, photograph, numbers, characters, font, handwriting, title, subtitle, 3D',
  },
};

export type VisualType = 'CONCEPT' | 'MNEMONIC' | 'RHYME';

export interface ImageGenerationResult {
  imageUrl: string;
  publicId: string;
  seed: number;
}

// ============================================
// 동시 이미지 생성 제한 (메모리 관리)
// ============================================

class Semaphore {
  private permits: number;
  private queue: (() => void)[] = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }
    return new Promise((resolve) => {
      this.queue.push(resolve);
    });
  }

  release(): void {
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      if (next) next();
    } else {
      this.permits++;
    }
  }
}

// 동시에 최대 2개의 이미지만 생성 (메모리 ~3MB 제한)
const imageGenerationSemaphore = new Semaphore(2);

// ---------------------------------------------
// Stability AI Image Generation
// ---------------------------------------------

export async function generateImageWithStabilityAI(
  prompt: string,
  visualType: VisualType
): Promise<{ base64: string; seed: number } | null> {
  logger.info('[Stability] Starting image generation...', { visualType, promptLength: prompt.length });

  if (!STABILITY_API_KEY) {
    logger.error('[Stability] API key not configured');
    throw new Error('STABILITY_API_KEY not configured');
  }

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

  logger.info('[Stability] Sending request to:', url);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${STABILITY_API_KEY}`,
    },
    body: JSON.stringify(requestBody),
  });

  logger.info('[Stability] Response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('[Stability] Error response:', errorText);
    throw new Error(`Stability AI error: ${response.status} - ${errorText}`);
  }

  const data = await response.json() as { artifacts?: Array<{ base64: string; seed: number }> };

  if (data.artifacts && data.artifacts.length > 0) {
    logger.info('[Stability] Image generated successfully');
    return {
      base64: data.artifacts[0].base64,
      seed: data.artifacts[0].seed,
    };
  }

  logger.error('[Stability] No artifacts in response');
  return null;
}

// ---------------------------------------------
// Supabase Storage Upload
// ---------------------------------------------

export async function uploadToSupabase(
  base64Data: string,
  word: string,
  visualType: string
): Promise<{ url: string; publicId: string }> {
  logger.info('[Supabase] Starting upload...', { word, visualType });

  if (!checkSupabaseConfig()) {
    logger.error('[Supabase] Configuration missing');
    throw new Error('Supabase not configured');
  }

  const supabase = getSupabaseClient();

  const sanitizedWord = word.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const fileName = `${sanitizedWord}-${visualType.toLowerCase()}-${Date.now()}.png`;
  const filePath = `visuals/${fileName}`;

  // Convert base64 to Buffer
  let buffer: Buffer | null = Buffer.from(base64Data, 'base64');

  logger.info('[Supabase] Uploading file:', filePath);

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, buffer, {
      contentType: 'image/png',
      cacheControl: '31536000',
      upsert: false,
    });

  // 명시적 메모리 해제
  buffer = null;

  if (error) {
    logger.error('[Supabase] Upload error:', error);
    throw new Error(`Supabase upload error: ${error.message}`);
  }

  logger.info('[Supabase] Upload successful:', data.path);

  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(filePath);

  const publicUrl = urlData.publicUrl;
  logger.info('[Supabase] Public URL:', publicUrl);

  return {
    url: publicUrl,
    publicId: filePath,
  };
}

// ---------------------------------------------
// Combined: Generate and Upload
// ---------------------------------------------

export async function generateAndUploadImage(
  prompt: string,
  visualType: VisualType,
  word: string
): Promise<ImageGenerationResult | null> {
  // 동시 생성 제한 - 세마포어 획득
  await imageGenerationSemaphore.acquire();

  try {
    // Generate image
    let imageResult = await generateImageWithStabilityAI(prompt, visualType);
    if (!imageResult) {
      return null;
    }

    // Upload to Supabase Storage
    const uploadResult = await uploadToSupabase(imageResult.base64, word, visualType);

    const result = {
      imageUrl: uploadResult.url,
      publicId: uploadResult.publicId,
      seed: imageResult.seed,
    };

    // 명시적 메모리 해제
    imageResult = null as any;

    // GC 힌트
    if (global.gc) {
      global.gc();
    }

    return result;
  } catch (error) {
    logger.error('[ImageGen] Error:', error);
    throw error;
  } finally {
    // 세마포어 해제 (성공/실패 무관하게 항상 실행)
    imageGenerationSemaphore.release();
  }
}

// ---------------------------------------------
// Prompt Generation Helpers
// ---------------------------------------------

export function generateConceptPrompt(definitionEn: string, word: string): string {
  return `Flat 2D editorial cartoon illustration vector illustration style clean bold outlines simple shapes soft flat colors educational illustration

NOT 3D NOT clay render NOT pixar style NOT realistic rendering

Scene: a clear situation showing the meaning of "${word}".

Camera angle: medium-close cinematic framing focused on the interaction.

In the center of the frame, a person or character demonstrates the action or state of "${word}" (${definitionEn || word}).

The surrounding elements reinforce the meaning of the word through context and objects.

The moment clearly shows the concept of "${word}" through action and result.

High resolution 1:1 square composition

The main subject must fill most of the frame. Avoid empty background areas. Foreground elements dominate the composition.

STRICT NO TEXT RULE

Absolutely no text anywhere. No letters. No numbers. No logos. No labels. No signage.

If any text appears, remove it completely. Replace text areas with blank surfaces.`;
}

export function generateMnemonicPrompt(mnemonic: string, word: string): string {
  const scene = (!mnemonic || mnemonic === word || mnemonic.length < 5)
    ? `a funny, exaggerated scene that helps remember the word "${word}"`
    : `a memorable scene visualizing: "${mnemonic}" to remember "${word}"`;

  return `Flat 2D editorial cartoon illustration vector illustration style clean bold outlines simple shapes soft flat colors educational illustration

NOT 3D NOT clay render NOT pixar style NOT realistic rendering

Scene: ${scene}.

Camera angle: medium-close cinematic framing.

In the center of the frame, a character acts out an exaggerated, humorous situation that makes "${word}" unforgettable.

The image uses visual humor and clear action to create a strong memory hook.

High resolution 1:1 square composition

The main subject must fill most of the frame. Avoid empty background areas. Foreground elements dominate the composition.

STRICT NO TEXT RULE

Absolutely no text anywhere. No letters. No numbers. No logos. No labels. No signage.

If any text appears, remove it completely. Replace text areas with blank surfaces.`;
}

export function generateRhymePrompt(definitionEn: string, word: string): string {
  return `Flat 2D editorial cartoon illustration vector illustration style clean bold outlines simple shapes soft flat colors educational illustration

NOT 3D NOT clay render NOT pixar style NOT realistic rendering

Scene: a vivid situation connected to the meaning of "${word}" (${definitionEn || word}).

Camera angle: medium-close cinematic framing.

In the center of the frame, a character is actively engaged in a situation that represents "${word}".

Nearby objects and environment reinforce the word's meaning and emotional tone.

The moment conveys the core meaning of "${word}" through a memorable scene.

High resolution 1:1 square composition

The main subject must fill most of the frame. Avoid empty background areas. Foreground elements dominate the composition.

STRICT NO TEXT RULE

Absolutely no text anywhere. No letters. No numbers. No logos. No labels. No signage.

If any text appears, remove it completely. Replace text areas with blank surfaces.`;
}

// ---------------------------------------------
// Check Configuration
// ---------------------------------------------

export function checkImageServiceConfig(): {
  stabilityConfigured: boolean;
  storageConfigured: boolean;
} {
  const storageConfigured = checkSupabaseConfig();
  return {
    stabilityConfigured: !!STABILITY_API_KEY,
    storageConfigured,
  };
}

logger.info('[ImageGenService] Module loaded with config:', checkImageServiceConfig());
