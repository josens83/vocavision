// ============================================
// VocaVision - WHISK Image Generation Types
// AI 이미지 생성 타입 정의 & 스타일 설정
// ============================================

// ---------------------------------------------
// Configuration Types
// ---------------------------------------------

export interface WhiskConfig {
  stabilityApiKey: string;
  stabilityApiUrl: string;
  openaiApiKey?: string;
  replicateApiKey?: string;
  cloudinaryCloudName: string;
  cloudinaryApiKey: string;
  cloudinaryApiSecret: string;
  cloudinaryFolder: string;
}

// ---------------------------------------------
// Image Style Types
// ---------------------------------------------

export type ImageStyle =
  | 'cartoon'
  | 'anime'
  | 'watercolor'
  | 'pixel'
  | 'sketch'
  | '3d-render'
  | 'comic'
  | 'minimalist'
  | 'vintage'
  | 'pop-art';

export interface StyleConfig {
  name: string;
  nameKo: string;
  promptSuffix: string;
  negativePrompt: string;
  cfgScale: number;
  steps: number;
  sampler: string;
}

// ---------------------------------------------
// Style Configurations (10 Styles)
// ---------------------------------------------

export const STYLE_CONFIGS: Record<ImageStyle, StyleConfig> = {
  cartoon: {
    name: 'Cartoon',
    nameKo: '카툰',
    promptSuffix: 'cute cartoon style, vibrant colors, simple shapes, friendly characters, children\'s book illustration, clean lines, bright palette',
    negativePrompt: 'realistic, photographic, dark, scary, complex details',
    cfgScale: 7,
    steps: 30,
    sampler: 'K_DPM_2_ANCESTRAL',
  },
  anime: {
    name: 'Anime',
    nameKo: '애니메이션',
    promptSuffix: 'anime style, japanese animation, colorful, expressive, studio ghibli inspired, cel shaded, soft lighting',
    negativePrompt: 'realistic, western cartoon, 3d render, photographic',
    cfgScale: 7,
    steps: 30,
    sampler: 'K_DPM_2_ANCESTRAL',
  },
  watercolor: {
    name: 'Watercolor',
    nameKo: '수채화',
    promptSuffix: 'watercolor painting style, soft washes, gentle colors, artistic brushstrokes, dreamy atmosphere, paper texture',
    negativePrompt: 'digital art, sharp edges, photographic, neon colors',
    cfgScale: 8,
    steps: 35,
    sampler: 'K_EULER_ANCESTRAL',
  },
  pixel: {
    name: 'Pixel Art',
    nameKo: '픽셀아트',
    promptSuffix: 'pixel art style, retro video game graphics, 16-bit, limited color palette, nostalgic, crisp pixels, sprite art',
    negativePrompt: 'realistic, smooth gradients, high resolution, photographic',
    cfgScale: 7,
    steps: 25,
    sampler: 'K_DPM_2_ANCESTRAL',
  },
  sketch: {
    name: 'Sketch',
    nameKo: '스케치',
    promptSuffix: 'pencil sketch style, hand-drawn, artistic linework, shading, illustration, educational diagram style',
    negativePrompt: 'color, photographic, 3d, digital painting',
    cfgScale: 7,
    steps: 30,
    sampler: 'K_EULER_ANCESTRAL',
  },
  '3d-render': {
    name: '3D Render',
    nameKo: '3D 렌더링',
    promptSuffix: '3d render, Pixar style, cute 3d character, soft lighting, clay render, octane render, smooth surfaces, vibrant',
    negativePrompt: '2d, flat, sketch, anime, photographic',
    cfgScale: 8,
    steps: 35,
    sampler: 'K_DPM_2_ANCESTRAL',
  },
  comic: {
    name: 'Comic',
    nameKo: '만화',
    promptSuffix: 'comic book style, American comics, bold outlines, dynamic composition, halftone dots, superhero comic aesthetic',
    negativePrompt: 'realistic, anime, 3d, photographic, soft',
    cfgScale: 7,
    steps: 30,
    sampler: 'K_DPM_2_ANCESTRAL',
  },
  minimalist: {
    name: 'Minimalist',
    nameKo: '미니멀',
    promptSuffix: 'minimalist vector illustration, simple shapes, flat design, clean aesthetic, limited colors, modern graphic design',
    negativePrompt: 'detailed, complex, realistic, 3d, textured',
    cfgScale: 7,
    steps: 25,
    sampler: 'K_EULER',
  },
  vintage: {
    name: 'Vintage',
    nameKo: '빈티지',
    promptSuffix: 'vintage illustration style, 1950s retro, mid-century modern, warm colors, nostalgic, classic advertising art',
    negativePrompt: 'modern, digital, neon, photographic, 3d',
    cfgScale: 8,
    steps: 30,
    sampler: 'K_EULER_ANCESTRAL',
  },
  'pop-art': {
    name: 'Pop Art',
    nameKo: '팝아트',
    promptSuffix: 'pop art style, Andy Warhol inspired, bold colors, Ben-Day dots, high contrast, contemporary art, vibrant',
    negativePrompt: 'realistic, muted colors, photographic, 3d render',
    cfgScale: 7,
    steps: 30,
    sampler: 'K_DPM_2_ANCESTRAL',
  },
};

// ---------------------------------------------
// Default Configuration
// ---------------------------------------------

export const DEFAULT_IMAGE_CONFIG = {
  style: 'cartoon' as ImageStyle,
  size: '512x512',
  defaultNegativePrompt: 'text, watermark, signature, blurry, low quality, deformed, ugly, nsfw, violence, gore, disturbing',
};

// ---------------------------------------------
// Rate Limits
// ---------------------------------------------

export const RATE_LIMITS = {
  stabilityAi: {
    maxRequests: 50,
    windowMs: 10000, // 10초당 50개
    delayBetweenRequests: 200,
  },
  openai: {
    maxRequests: 5,
    windowMs: 60000, // 분당 5개
    delayBetweenRequests: 12000,
  },
  batch: {
    maxConcurrent: 3, // 동시 3개
    delayBetweenBatches: 2000,
  },
};

// ---------------------------------------------
// Prompt Templates
// ---------------------------------------------

export const PROMPT_TEMPLATES = {
  mnemonic: (word: string, mnemonic: string, styleConfig: StyleConfig): string => {
    return `A memorable educational illustration for learning the English word "${word}".
Scene: ${mnemonic}
The image should be educational, memorable, and help visualize the meaning.
Style: ${styleConfig.promptSuffix}`;
  },

  mnemonicWithKorean: (
    word: string,
    mnemonic: string,
    mnemonicKorean: string,
    styleConfig: StyleConfig
  ): string => {
    return `A memorable educational illustration for learning the English word "${word}".
Scene: ${mnemonic}
Korean association context: ${mnemonicKorean}
The image should be educational, memorable, and help visualize the meaning.
Style: ${styleConfig.promptSuffix}`;
  },

  simple: (description: string, styleConfig: StyleConfig): string => {
    return `${description}. ${styleConfig.promptSuffix}`;
  },
};

// ---------------------------------------------
// Request/Response Types
// ---------------------------------------------

export interface ImageGenerationRequest {
  wordId: string;
  word: string;
  mnemonic: string;
  mnemonicKorean?: string;
  definition?: string;
  style?: ImageStyle;
  size?: string;
  regenerate?: boolean;
}

export interface ImageGenerationResult {
  success: boolean;
  wordId: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  whiskPrompt?: string;
  style?: ImageStyle;
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
// API Request/Response Types
// ---------------------------------------------

export interface GenerateImageApiRequest {
  wordId: string;
  style?: ImageStyle;
  size?: string;
  regenerate?: boolean;
}

export interface GenerateBatchApiRequest {
  wordIds: string[];
  style?: ImageStyle;
  regenerate?: boolean;
}

export interface PreviewPromptApiRequest {
  word: string;
  mnemonic: string;
  mnemonicKorean?: string;
  style?: ImageStyle;
}

export interface ImageStatsResponse {
  totalGenerated: number;
  totalPending: number;
  byStyle: Record<ImageStyle, number>;
  recentGenerations: Array<{
    wordId: string;
    word: string;
    imageUrl: string;
    generatedAt: string;
  }>;
}

// ---------------------------------------------
// Database Model Extension Types
// ---------------------------------------------

export interface WordImageData {
  id: string;
  wordId: string;
  imageUrl: string;
  thumbnailUrl?: string;
  style: ImageStyle;
  whiskPrompt: string;
  generatedAt: Date;
  model: string;
  seed?: number;
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------
// UI Component Types
// ---------------------------------------------

export interface StyleOption {
  value: ImageStyle;
  label: string;
  labelKo: string;
}

export interface ImageGenerationState {
  isGenerating: boolean;
  progress: number;
  currentWord?: string;
  error?: string;
  results: ImageGenerationResult[];
}

export interface ImagePreviewProps {
  imageUrl: string;
  thumbnailUrl?: string;
  word: string;
  style: ImageStyle;
  onRegenerate?: () => void;
  onDelete?: () => void;
}
