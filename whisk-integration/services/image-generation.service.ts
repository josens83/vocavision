// ============================================
// VocaVision - Image Generation Service
// Stability AI (SDXL) + Cloudinary 연동
// ============================================

import {
  WhiskConfig,
  ImageGenerationRequest,
  ImageGenerationResult,
  BatchImageGenerationResult,
  ImageStyle,
  StyleConfig,
  STYLE_CONFIGS,
  DEFAULT_IMAGE_CONFIG,
  PROMPT_TEMPLATES,
  RATE_LIMITS,
} from '../types/whisk.types';

// ---------------------------------------------
// Configuration
// ---------------------------------------------

const config: WhiskConfig = {
  stabilityApiKey: process.env.STABILITY_API_KEY || '',
  stabilityApiUrl: 'https://api.stability.ai/v1/generation',
  openaiApiKey: process.env.OPENAI_API_KEY,
  replicateApiKey: process.env.REPLICATE_API_KEY,
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || '',
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || '',
  cloudinaryFolder: 'vocavision/mnemonics',
};

// ---------------------------------------------
// Stability AI Service
// ---------------------------------------------

interface StabilityRequest {
  text_prompts: Array<{
    text: string;
    weight: number;
  }>;
  cfg_scale: number;
  height: number;
  width: number;
  steps: number;
  samples: number;
  sampler?: string;
}

interface StabilityResponse {
  artifacts: Array<{
    base64: string;
    seed: number;
    finishReason: string;
  }>;
}

async function generateWithStabilityAI(
  prompt: string,
  negativePrompt: string,
  styleConfig: StyleConfig,
  size: string = '512x512'
): Promise<{ base64: string; seed: number } | null> {
  const [width, height] = size.split('x').map(Number);

  const engineId = 'stable-diffusion-xl-1024-v1-0'; // SDXL
  const url = `${config.stabilityApiUrl}/${engineId}/text-to-image`;

  const requestBody: StabilityRequest = {
    text_prompts: [
      { text: prompt, weight: 1 },
      { text: negativePrompt, weight: -1 },
    ],
    cfg_scale: styleConfig.cfgScale,
    height: Math.min(height, 1024),
    width: Math.min(width, 1024),
    steps: styleConfig.steps,
    samples: 1,
    sampler: styleConfig.sampler,
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${config.stabilityApiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Stability AI error:', error);
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
  } catch (error) {
    console.error('Stability AI generation failed:', error);
    throw error;
  }
}

// ---------------------------------------------
// OpenAI DALL-E Service (Fallback)
// ---------------------------------------------

async function generateWithDALLE(
  prompt: string,
  size: string = '512x512'
): Promise<{ url: string } | null> {
  if (!config.openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  // DALL-E 3 sizes: 1024x1024, 1024x1792, 1792x1024
  const dalleSize = '1024x1024';

  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: dalleSize,
        quality: 'standard',
        response_format: 'url',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`DALL-E error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();

    if (data.data && data.data.length > 0) {
      return { url: data.data[0].url };
    }

    return null;
  } catch (error) {
    console.error('DALL-E generation failed:', error);
    throw error;
  }
}

// ---------------------------------------------
// Cloudinary Upload Service
// ---------------------------------------------

interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  url: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
}

async function uploadToCloudinary(
  imageData: string | Buffer,
  options: {
    publicId?: string;
    folder?: string;
    format?: string;
    transformation?: object;
  } = {}
): Promise<CloudinaryUploadResult> {
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = options.folder || config.cloudinaryFolder;

  // Generate signature
  const signatureString = `folder=${folder}&timestamp=${timestamp}${config.cloudinaryApiSecret}`;
  const crypto = await import('crypto');
  const signature = crypto.createHash('sha1').update(signatureString).digest('hex');

  // Prepare form data
  const formData = new FormData();

  if (typeof imageData === 'string') {
    // Base64 data
    if (imageData.startsWith('http')) {
      formData.append('file', imageData);
    } else {
      formData.append('file', `data:image/png;base64,${imageData}`);
    }
  } else {
    // Buffer
    const blob = new Blob([imageData], { type: 'image/png' });
    formData.append('file', blob);
  }

  formData.append('api_key', config.cloudinaryApiKey);
  formData.append('timestamp', String(timestamp));
  formData.append('signature', signature);
  formData.append('folder', folder);

  if (options.publicId) {
    formData.append('public_id', options.publicId);
  }

  if (options.transformation) {
    formData.append('transformation', JSON.stringify(options.transformation));
  }

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${config.cloudinaryCloudName}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Cloudinary upload error: ${error.error?.message || response.statusText}`);
  }

  return response.json();
}

/**
 * Cloudinary URL에 변환 적용
 */
function getTransformedUrl(
  publicId: string,
  transformation: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string;
    format?: string;
  }
): string {
  const transforms: string[] = [];

  if (transformation.width) transforms.push(`w_${transformation.width}`);
  if (transformation.height) transforms.push(`h_${transformation.height}`);
  if (transformation.crop) transforms.push(`c_${transformation.crop}`);
  if (transformation.quality) transforms.push(`q_${transformation.quality}`);
  if (transformation.format) transforms.push(`f_${transformation.format}`);

  const transformString = transforms.join(',');

  return `https://res.cloudinary.com/${config.cloudinaryCloudName}/image/upload/${transformString}/${publicId}`;
}

// ---------------------------------------------
// Prompt Builder
// ---------------------------------------------

export function buildMnemonicPrompt(
  word: string,
  mnemonic: string,
  mnemonicKorean: string | undefined,
  style: ImageStyle = 'cartoon'
): { prompt: string; negativePrompt: string; styleConfig: StyleConfig } {
  const styleConfig = STYLE_CONFIGS[style];

  let prompt: string;

  if (mnemonicKorean) {
    prompt = PROMPT_TEMPLATES.mnemonicWithKorean(word, mnemonic, mnemonicKorean, styleConfig);
  } else {
    prompt = PROMPT_TEMPLATES.mnemonic(word, mnemonic, styleConfig);
  }

  const negativePrompt = `${DEFAULT_IMAGE_CONFIG.defaultNegativePrompt}, ${styleConfig.negativePrompt}`;

  return { prompt, negativePrompt, styleConfig };
}

// ---------------------------------------------
// Main Image Generation Function
// ---------------------------------------------

export async function generateMnemonicImage(
  request: ImageGenerationRequest
): Promise<ImageGenerationResult> {
  const startTime = Date.now();
  const style = request.style || DEFAULT_IMAGE_CONFIG.style;
  const size = request.size || DEFAULT_IMAGE_CONFIG.size;

  try {
    // 1. Build prompt
    const { prompt, negativePrompt, styleConfig } = buildMnemonicPrompt(
      request.word,
      request.mnemonic,
      request.mnemonicKorean,
      style
    );

    console.log(`[ImageGen] Generating image for "${request.word}" with style "${style}"`);
    console.log(`[ImageGen] Prompt: ${prompt.substring(0, 100)}...`);

    // 2. Generate with Stability AI
    let imageData: { base64?: string; url?: string; seed?: number } | null = null;
    let model = 'stability-sdxl';

    try {
      const result = await generateWithStabilityAI(prompt, negativePrompt, styleConfig, size);
      if (result) {
        imageData = result;
      }
    } catch (stabilityError) {
      console.warn('[ImageGen] Stability AI failed, trying DALL-E fallback:', stabilityError);

      // Fallback to DALL-E
      if (config.openaiApiKey) {
        const dalleResult = await generateWithDALLE(prompt, size);
        if (dalleResult) {
          imageData = dalleResult;
          model = 'dall-e-3';
        }
      }
    }

    if (!imageData) {
      throw new Error('All image generation providers failed');
    }

    // 3. Upload to Cloudinary
    const publicId = `${request.word.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;

    let uploadResult: CloudinaryUploadResult;

    if (imageData.base64) {
      uploadResult = await uploadToCloudinary(imageData.base64, {
        publicId,
        folder: config.cloudinaryFolder,
      });
    } else if (imageData.url) {
      uploadResult = await uploadToCloudinary(imageData.url, {
        publicId,
        folder: config.cloudinaryFolder,
      });
    } else {
      throw new Error('No image data to upload');
    }

    // 4. Generate thumbnail URL
    const thumbnailUrl = getTransformedUrl(uploadResult.public_id, {
      width: 128,
      height: 128,
      crop: 'fill',
      quality: 'auto',
      format: 'webp',
    });

    const duration = Date.now() - startTime;
    console.log(`[ImageGen] Success for "${request.word}" in ${duration}ms`);

    return {
      success: true,
      wordId: request.wordId,
      imageUrl: uploadResult.secure_url,
      thumbnailUrl,
      whiskPrompt: prompt,
      style,
      generatedAt: new Date().toISOString(),
      metadata: {
        model,
        seed: imageData.seed,
        steps: styleConfig.steps,
        cfgScale: styleConfig.cfgScale,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[ImageGen] Failed for "${request.word}":`, errorMessage);

    return {
      success: false,
      wordId: request.wordId,
      error: errorMessage,
    };
  }
}

// ---------------------------------------------
// Batch Image Generation
// ---------------------------------------------

export async function generateMnemonicImagesBatch(
  requests: ImageGenerationRequest[],
  options: {
    maxConcurrent?: number;
    delayBetween?: number;
    onProgress?: (completed: number, total: number, result: ImageGenerationResult) => void;
  } = {}
): Promise<BatchImageGenerationResult> {
  const maxConcurrent = options.maxConcurrent || RATE_LIMITS.batch.maxConcurrent;
  const delayBetween = options.delayBetween || RATE_LIMITS.stabilityAi.delayBetweenRequests;

  const results: ImageGenerationResult[] = [];
  let successful = 0;
  let failed = 0;

  // Process in batches
  for (let i = 0; i < requests.length; i += maxConcurrent) {
    const batch = requests.slice(i, i + maxConcurrent);

    const batchResults = await Promise.all(
      batch.map(async (request, index) => {
        // Stagger requests within batch
        if (index > 0) {
          await sleep(delayBetween * index);
        }

        const result = await generateMnemonicImage(request);

        if (result.success) {
          successful++;
        } else {
          failed++;
        }

        // Report progress
        if (options.onProgress) {
          options.onProgress(results.length + index + 1, requests.length, result);
        }

        return result;
      })
    );

    results.push(...batchResults);

    // Delay between batches
    if (i + maxConcurrent < requests.length) {
      await sleep(RATE_LIMITS.batch.delayBetweenBatches);
    }
  }

  return {
    total: requests.length,
    successful,
    failed,
    results,
  };
}

// ---------------------------------------------
// Helper Functions
// ---------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------
// Export Service Instance
// ---------------------------------------------

export const ImageGenerationService = {
  generate: generateMnemonicImage,
  generateBatch: generateMnemonicImagesBatch,
  buildPrompt: buildMnemonicPrompt,
  getTransformedUrl,

  // Style helpers
  getStyleConfig: (style: ImageStyle) => STYLE_CONFIGS[style],
  getAvailableStyles: () => Object.keys(STYLE_CONFIGS) as ImageStyle[],
  getStyleLabels: () => Object.entries(STYLE_CONFIGS).map(([key, config]) => ({
    value: key,
    label: config.name,
    labelKo: config.nameKo,
  })),
};

export default ImageGenerationService;
