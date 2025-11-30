// ============================================
// VocaVision WHISK Integration - Types & Config
// ============================================

// ---------------------------------------------
// WHISK API Types
// ---------------------------------------------

/**
 * WHISK는 Google의 이미지 생성 AI로, 텍스트 프롬프트와 참조 이미지를 기반으로
 * 스타일화된 이미지를 생성합니다.
 *
 * 현재 WHISK는 Google Labs에서 실험적으로 제공되며,
 * 공식 API가 없으므로 Puppeteer를 통한 자동화 또는
 * 대안 API (Stability AI, DALL-E, Midjourney API)를 사용합니다.
 */

export interface WhiskConfig {
  // Primary: Stability AI (SDXL)
  stabilityApiKey: string;
  stabilityApiUrl: string;

  // Alternative: OpenAI DALL-E
  openaiApiKey?: string;

  // Alternative: Replicate (for various models)
  replicateApiKey?: string;

  // Cloudinary for storage
  cloudinaryCloudName: string;
  cloudinaryApiKey: string;
  cloudinaryApiSecret: string;
  cloudinaryFolder: string;
}

export interface ImageGenerationRequest {
  wordId: string;
  word: string;
  mnemonic: string;
  mnemonicKorean?: string;
  style?: ImageStyle;
  format?: 'gif' | 'png' | 'webp';
  size?: ImageSize;
}

export interface ImageGenerationResult {
  success: boolean;
  wordId: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  whiskPrompt?: string;
  style?: string;
  generatedAt?: string;
  error?: string;
  metadata?: {
    model: string;
    seed?: number;
    steps?: number;
    cfgScale?: number;
  };
}

export interface BatchImageGenerationResult {
  total: number;
  successful: number;
  failed: number;
  results: ImageGenerationResult[];
}

// ---------------------------------------------
// Image Style Presets
// ---------------------------------------------

export type ImageStyle =
  | 'cartoon'        // 귀여운 카툰 스타일
  | 'anime'          // 애니메이션 스타일
  | 'watercolor'     // 수채화 스타일
  | 'pixel'          // 픽셀아트 스타일
  | 'sketch'         // 스케치 스타일
  | '3d-render'      // 3D 렌더링
  | 'comic'          // 만화 스타일
  | 'minimalist'     // 미니멀리스트
  | 'vintage'        // 빈티지/레트로
  | 'pop-art';       // 팝아트

export type ImageSize = '512x512' | '768x768' | '1024x1024';

// ---------------------------------------------
// Style Configurations
// ---------------------------------------------

export interface StyleConfig {
  name: string;
  nameKo: string;
  promptSuffix: string;
  negativePrompt: string;
  cfgScale: number;
  steps: number;
  sampler: string;
}

export const STYLE_CONFIGS: Record<ImageStyle, StyleConfig> = {
  cartoon: {
    name: 'Cartoon',
    nameKo: '카툰',
    promptSuffix: 'cute cartoon style, vibrant colors, simple shapes, friendly characters, children\'s book illustration',
    negativePrompt: 'realistic, photographic, scary, dark, violent, complex details',
    cfgScale: 7,
    steps: 30,
    sampler: 'K_EULER_ANCESTRAL',
  },
  anime: {
    name: 'Anime',
    nameKo: '애니메이션',
    promptSuffix: 'anime style, japanese animation, colorful, expressive, studio ghibli inspired',
    negativePrompt: 'realistic, photographic, western cartoon, 3d render',
    cfgScale: 7,
    steps: 30,
    sampler: 'K_EULER_ANCESTRAL',
  },
  watercolor: {
    name: 'Watercolor',
    nameKo: '수채화',
    promptSuffix: 'watercolor painting, soft edges, artistic, pastel colors, hand-painted, artistic illustration',
    negativePrompt: 'digital art, sharp edges, photographic, 3d render',
    cfgScale: 8,
    steps: 35,
    sampler: 'K_DPM_2_ANCESTRAL',
  },
  pixel: {
    name: 'Pixel Art',
    nameKo: '픽셀아트',
    promptSuffix: 'pixel art style, 16-bit, retro game, colorful pixels, nostalgic, game sprite',
    negativePrompt: 'realistic, photographic, smooth, high resolution, 3d',
    cfgScale: 7,
    steps: 25,
    sampler: 'K_EULER',
  },
  sketch: {
    name: 'Sketch',
    nameKo: '스케치',
    promptSuffix: 'pencil sketch, hand-drawn, artistic, line art, illustration, notebook doodle',
    negativePrompt: 'colored, photographic, 3d render, digital art',
    cfgScale: 7,
    steps: 30,
    sampler: 'K_EULER_ANCESTRAL',
  },
  '3d-render': {
    name: '3D Render',
    nameKo: '3D 렌더링',
    promptSuffix: '3d render, Pixar style, cute 3d character, soft lighting, clay render, octane render',
    negativePrompt: '2d, flat, sketch, photographic, realistic human',
    cfgScale: 7,
    steps: 35,
    sampler: 'K_DPM_2_ANCESTRAL',
  },
  comic: {
    name: 'Comic',
    nameKo: '만화',
    promptSuffix: 'comic book style, bold outlines, halftone dots, dynamic, action comic, Marvel style',
    negativePrompt: 'realistic, photographic, anime, watercolor',
    cfgScale: 7,
    steps: 30,
    sampler: 'K_EULER_ANCESTRAL',
  },
  minimalist: {
    name: 'Minimalist',
    nameKo: '미니멀',
    promptSuffix: 'minimalist illustration, simple shapes, flat design, clean lines, modern, vector art',
    negativePrompt: 'detailed, complex, photographic, 3d, textured',
    cfgScale: 8,
    steps: 25,
    sampler: 'K_EULER',
  },
  vintage: {
    name: 'Vintage',
    nameKo: '빈티지',
    promptSuffix: 'vintage illustration, retro style, 1950s advertisement, nostalgic, warm colors, aged paper',
    negativePrompt: 'modern, digital, neon, futuristic',
    cfgScale: 7,
    steps: 30,
    sampler: 'K_DPM_2_ANCESTRAL',
  },
  'pop-art': {
    name: 'Pop Art',
    nameKo: '팝아트',
    promptSuffix: 'pop art style, Andy Warhol inspired, bold colors, graphic, iconic, screen print',
    negativePrompt: 'realistic, photographic, muted colors, detailed',
    cfgScale: 7,
    steps: 30,
    sampler: 'K_EULER_ANCESTRAL',
  },
};

// ---------------------------------------------
// Default Configuration
// ---------------------------------------------

export const DEFAULT_IMAGE_CONFIG = {
  style: 'cartoon' as ImageStyle,
  size: '512x512' as ImageSize,
  format: 'png' as const,
  defaultNegativePrompt: 'text, watermark, signature, blurry, low quality, deformed, ugly, nsfw, violence',
};

// ---------------------------------------------
// Prompt Templates
// ---------------------------------------------

export const PROMPT_TEMPLATES = {
  // 기본 연상 기억법 이미지 생성 템플릿
  mnemonic: (word: string, mnemonic: string, style: StyleConfig) => `
A memorable illustration for learning the English word "${word}".
Scene: ${mnemonic}
Style: ${style.promptSuffix}
The image should be educational, memorable, and help visualize the meaning of the word.
`.trim(),

  // 한국어 연상 기억법 포함 템플릿
  mnemonicWithKorean: (word: string, mnemonic: string, mnemonicKorean: string, style: StyleConfig) => `
A memorable illustration for learning the English word "${word}".
Scene: ${mnemonic}
Korean association: ${mnemonicKorean}
Style: ${style.promptSuffix}
The image should be educational, memorable, and help Korean learners visualize the meaning.
`.trim(),

  // 단순 단어 의미 시각화
  wordMeaning: (word: string, definition: string, style: StyleConfig) => `
An illustration representing the meaning of "${word}": ${definition}
Style: ${style.promptSuffix}
Clear, educational, and visually memorable.
`.trim(),
};

// ---------------------------------------------
// Cloudinary Transformations
// ---------------------------------------------

export const CLOUDINARY_TRANSFORMATIONS = {
  // 메인 이미지 (학습 카드용)
  main: {
    width: 512,
    height: 512,
    crop: 'fill',
    quality: 'auto:good',
    format: 'auto',
  },

  // 썸네일 (목록용)
  thumbnail: {
    width: 128,
    height: 128,
    crop: 'fill',
    quality: 'auto:low',
    format: 'webp',
  },

  // GIF 애니메이션용
  gif: {
    width: 512,
    height: 512,
    format: 'gif',
    flags: 'animated',
  },

  // 모바일 최적화
  mobile: {
    width: 320,
    height: 320,
    crop: 'fill',
    quality: 'auto:eco',
    format: 'webp',
  },
};

// ---------------------------------------------
// Rate Limiting
// ---------------------------------------------

export const RATE_LIMITS = {
  // Stability AI: 150 requests/10 seconds (paid tier)
  stabilityAi: {
    maxRequests: 50,
    windowMs: 10000,
    delayBetweenRequests: 200, // ms
  },

  // Cloudinary: 500 uploads/hour (free tier)
  cloudinary: {
    maxRequests: 400,
    windowMs: 3600000, // 1 hour
    delayBetweenRequests: 100,
  },

  // Batch processing
  batch: {
    maxConcurrent: 3,
    delayBetweenBatches: 2000,
  },
};
