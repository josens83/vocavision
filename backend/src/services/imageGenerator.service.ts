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

  // Generate unique file path: word-images/word-type-timestamp.png
  const sanitizedWord = word.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const fileName = `${sanitizedWord}-${visualType.toLowerCase()}-${Date.now()}.png`;
  const filePath = `visuals/${fileName}`;

  // Convert base64 to Buffer
  const buffer = Buffer.from(base64Data, 'base64');

  logger.info('[Supabase] Uploading file:', filePath);

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, buffer, {
      contentType: 'image/png',
      cacheControl: '31536000', // 1 year cache
      upsert: false,
    });

  if (error) {
    logger.error('[Supabase] Upload error:', error);
    throw new Error(`Supabase upload error: ${error.message}`);
  }

  logger.info('[Supabase] Upload successful:', data.path);

  // Get public URL
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
  try {
    // Generate image
    const imageResult = await generateImageWithStabilityAI(prompt, visualType);
    if (!imageResult) {
      return null;
    }

    // Upload to Supabase Storage
    const uploadResult = await uploadToSupabase(imageResult.base64, word, visualType);

    return {
      imageUrl: uploadResult.url,
      publicId: uploadResult.publicId,
      seed: imageResult.seed,
    };
  } catch (error) {
    logger.error('[ImageGen] Error:', error);
    throw error;
  }
}

// ---------------------------------------------
// Prompt Generation Helpers
// ---------------------------------------------

export function generateConceptPrompt(definitionEn: string, word: string): string {
  // 2D cartoon style for intuitive understanding (consistent with batch generation)
  return `Cartoon style illustration. A simple scene showing the meaning of "${word}" (${definitionEn || word}). Soft pastel colors with gentle lighting. Clean and simple composition. Plain white background. No text. No words. No letters. No numbers. No symbols. No labels. No captions. No titles. No icons. No speech bubbles. No signs. No watermarks. Square composition.`;
}

export function generateMnemonicPrompt(mnemonic: string, word: string): string {
  // If mnemonic is just the word itself or empty, create a more descriptive prompt
  if (!mnemonic || mnemonic === word || mnemonic.length < 5) {
    return `A 1:1 square cartoon illustration showing the action or concept of "${word}" in a funny, exaggerated, memorable way. The image should help students remember this vocabulary word. Style: cute cartoon, bright colors, humorous, memorable, dynamic poses or expressions. CRITICAL: Absolutely NO text, NO letters, NO words in the image.`;
  }

  return `A 1:1 square cartoon illustration visualizing this memory technique: "${mnemonic}". This helps remember the English word "${word}". Style: cute cartoon, memorable, colorful, exaggerated for humor. CRITICAL: Absolutely NO text, NO letters, NO words in the image.`;
}

export function generateRhymePrompt(definitionEn: string, word: string): string {
  return `A 1:1 square humorous cartoon illustration showing: "${definitionEn || word}". Style: playful cartoon, bright colors. CRITICAL: NO text in image.`;
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
