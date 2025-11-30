// ============================================
// VocaVision - Prompt Optimizer
// Claude AI를 사용한 이미지 프롬프트 최적화
// ============================================

import Anthropic from '@anthropic-ai/sdk';
import { ImageStyle, STYLE_CONFIGS } from '../types/whisk.types';

// ---------------------------------------------
// Configuration
// ---------------------------------------------

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ---------------------------------------------
// Types
// ---------------------------------------------

interface OptimizedPrompt {
  prompt: string;
  negativePrompt: string;
  visualElements: string[];
  colorSuggestions: string[];
  compositionNotes: string;
}

interface MnemonicImageRequest {
  word: string;
  mnemonic: string;
  mnemonicKorean?: string;
  definition?: string;
  style: ImageStyle;
  targetAudience?: 'adult' | 'teen' | 'child';
}

// ---------------------------------------------
// Prompt Optimization System Prompt
// ---------------------------------------------

const SYSTEM_PROMPT = `You are an expert at creating image generation prompts for educational vocabulary learning.

Your task is to transform mnemonic descriptions into optimized prompts for AI image generation (Stable Diffusion/DALL-E).

Guidelines:
1. Create vivid, memorable visual scenes that help learners remember the English word
2. Use concrete objects and actions, not abstract concepts
3. Include specific details about composition, lighting, and style
4. Keep scenes appropriate for all ages (educational context)
5. Avoid text in images
6. Consider the artistic style requested
7. Make the connection between the visual and the word meaning clear

Output format (JSON):
{
  "prompt": "Main image generation prompt",
  "negativePrompt": "Elements to avoid",
  "visualElements": ["Key visual element 1", "Element 2", ...],
  "colorSuggestions": ["Primary color", "Accent color"],
  "compositionNotes": "Brief composition advice"
}`;

// ---------------------------------------------
// Optimize Prompt Function
// ---------------------------------------------

export async function optimizeMnemonicPrompt(
  request: MnemonicImageRequest
): Promise<OptimizedPrompt> {
  const styleConfig = STYLE_CONFIGS[request.style];

  const userPrompt = `
Create an optimized image generation prompt for:

**English Word:** ${request.word}
**Mnemonic Description:** ${request.mnemonic}
${request.mnemonicKorean ? `**Korean Association:** ${request.mnemonicKorean}` : ''}
${request.definition ? `**Definition:** ${request.definition}` : ''}
**Art Style:** ${styleConfig.name} (${styleConfig.nameKo})
**Style Description:** ${styleConfig.promptSuffix}
**Target Audience:** ${request.targetAudience || 'adult'} learners

Create a memorable, educational image prompt that will help learners remember this word.
The image should clearly visualize the mnemonic association.
`.trim();

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: userPrompt }
      ],
    });

    // Extract text content
    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    // Parse JSON response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const optimized: OptimizedPrompt = JSON.parse(jsonMatch[0]);

    // Enhance prompt with style suffix
    optimized.prompt = `${optimized.prompt}, ${styleConfig.promptSuffix}`;
    optimized.negativePrompt = `${optimized.negativePrompt}, ${styleConfig.negativePrompt}, text, watermark, signature, blurry, low quality`;

    return optimized;
  } catch (error) {
    console.error('Prompt optimization failed:', error);

    // Fallback to basic prompt
    return {
      prompt: `A memorable illustration for learning "${request.word}": ${request.mnemonic}. ${styleConfig.promptSuffix}`,
      negativePrompt: `text, watermark, signature, blurry, low quality, ${styleConfig.negativePrompt}`,
      visualElements: [request.word],
      colorSuggestions: ['vibrant', 'educational'],
      compositionNotes: 'Center composition with clear subject',
    };
  }
}

// ---------------------------------------------
// Batch Optimize Prompts
// ---------------------------------------------

export async function optimizeMnemonicPromptsBatch(
  requests: MnemonicImageRequest[],
  options: {
    maxConcurrent?: number;
    delayBetween?: number;
  } = {}
): Promise<Map<string, OptimizedPrompt>> {
  const maxConcurrent = options.maxConcurrent || 3;
  const delayBetween = options.delayBetween || 500;

  const results = new Map<string, OptimizedPrompt>();

  for (let i = 0; i < requests.length; i += maxConcurrent) {
    const batch = requests.slice(i, i + maxConcurrent);

    const batchResults = await Promise.all(
      batch.map(async (request, index) => {
        if (index > 0) {
          await new Promise((resolve) => setTimeout(resolve, delayBetween * index));
        }

        const optimized = await optimizeMnemonicPrompt(request);
        return { word: request.word, optimized };
      })
    );

    batchResults.forEach(({ word, optimized }) => {
      results.set(word, optimized);
    });

    // Delay between batches
    if (i + maxConcurrent < requests.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return results;
}

// ---------------------------------------------
// Generate WHISK-Style Prompt
// ---------------------------------------------

export function generateWhiskPrompt(
  word: string,
  mnemonic: string,
  style: ImageStyle,
  optimized?: OptimizedPrompt
): string {
  if (optimized) {
    return optimized.prompt;
  }

  const styleConfig = STYLE_CONFIGS[style];

  return `
A memorable educational illustration for the English word "${word}".
Scene: ${mnemonic}
The image should help language learners remember this vocabulary word.
Style: ${styleConfig.promptSuffix}
Composition: Clear central focus, educational and memorable visual.
`.trim();
}

// ---------------------------------------------
// Export
// ---------------------------------------------

export const PromptOptimizer = {
  optimize: optimizeMnemonicPrompt,
  optimizeBatch: optimizeMnemonicPromptsBatch,
  generateWhiskPrompt,
};

export default PromptOptimizer;
