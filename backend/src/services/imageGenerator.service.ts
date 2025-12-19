// ============================================
// VocaVision - AI Image Generation Service
// Stability AI + Cloudinary 이미지 생성
// ============================================

import crypto from 'crypto';
import logger from '../utils/logger';

// Configuration
const STABILITY_API_KEY = process.env.STABILITY_API_KEY || '';
const STABILITY_API_URL = 'https://api.stability.ai/v1/generation';
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || '';
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || '';
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || '';

// Visual type configurations
const VISUAL_CONFIGS = {
  CONCEPT: {
    style: 'cute cartoon illustration, Pixar style, bright vibrant colors, friendly, educational',
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
// Cloudinary Upload
// ---------------------------------------------

export async function uploadToCloudinary(
  base64Data: string,
  word: string,
  visualType: string
): Promise<{ url: string; publicId: string }> {
  logger.info('[Cloudinary] Starting upload...', { word, visualType });

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    logger.error('[Cloudinary] Configuration missing');
    throw new Error('Cloudinary not configured');
  }

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

  logger.info('[Cloudinary] Sending upload request...');

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  logger.info('[Cloudinary] Response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('[Cloudinary] Error response:', errorText);
    throw new Error(`Cloudinary upload error: ${response.status} - ${errorText}`);
  }

  const result = await response.json() as { secure_url: string; public_id: string };
  logger.info('[Cloudinary] Upload successful:', result.secure_url);

  return {
    url: result.secure_url,
    publicId: result.public_id,
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

    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(imageResult.base64, word, visualType);

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
  // Pixar/Disney cartoon style for intuitive understanding
  return `A 1:1 square cute cartoon illustration showing the meaning of "${word}" which means "${definitionEn || word}".
Style: Pixar-like 3D cartoon, bright vibrant colors, friendly character design, simple clean composition, educational and memorable.
The image should help language learners instantly understand and remember the word meaning through clear visual storytelling.
CRITICAL: Absolutely NO text, NO letters, NO words, NO writing anywhere in the image. Pure visual illustration only.`;
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
  cloudinaryConfigured: boolean;
} {
  return {
    stabilityConfigured: !!STABILITY_API_KEY,
    cloudinaryConfigured: !!(CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET),
  };
}

logger.info('[ImageGenService] Module loaded with config:', checkImageServiceConfig());
