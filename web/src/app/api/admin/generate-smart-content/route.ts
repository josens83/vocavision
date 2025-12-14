/**
 * Admin Smart Content Generation API
 *
 * POST /api/admin/generate-smart-content
 * Uses Claude API to generate intelligent prompts and captions for word visuals
 */

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// Configuration
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

// Lazy-init Claude client
let anthropic: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropic) {
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }
    anthropic = new Anthropic({
      apiKey: ANTHROPIC_API_KEY,
    });
  }
  return anthropic;
}

interface WordData {
  word: string;
  definitionEn?: string;
  definitionKo?: string;
  mnemonic?: string;
  mnemonicKorean?: string;
  rhymingWords?: string[];
}

interface SmartContentRequest {
  wordData: WordData;
  types: ('MNEMONIC_PROMPT' | 'MNEMONIC_CAPTION' | 'RHYME_CAPTION' | 'CONCEPT_CAPTION')[];
}

interface SmartContentResponse {
  mnemonicPrompt?: string;
  mnemonicVisualElements?: string;
  mnemonicCaption?: { ko: string; en: string };
  rhymeCaption?: { ko: string; en: string };
  conceptCaption?: { ko: string; en: string };
}

/**
 * Generate smart MNEMONIC prompt by extracting visual elements from mnemonic text
 */
async function generateMnemonicPrompt(wordData: WordData): Promise<{ prompt: string; visualElements: string }> {
  const client = getAnthropicClient();

  const systemPrompt = `You are an expert at extracting visual elements from mnemonic/memory techniques for vocabulary learning.
Your task is to identify the key visual elements that can be illustrated in an image.
Always respond in the exact JSON format requested.`;

  const userPrompt = `Analyze this mnemonic and extract visual elements for image generation.

Word: ${wordData.word}
Definition: ${wordData.definitionEn || 'unknown'}
Mnemonic (English): ${wordData.mnemonic || 'none'}
Mnemonic (Korean): ${wordData.mnemonicKorean || 'none'}

Extract the key visual elements that can be drawn in a cartoon illustration.
Focus on concrete objects, actions, and scenes mentioned or implied in the mnemonic.

Respond in this exact JSON format:
{
  "visualElements": "comma-separated list of visual elements in English, e.g., 'hair falling, pages flying away, worried expression'",
  "imagePrompt": "A 1:1 square cartoon illustration of [specific scene description based on visual elements]. Style: cute cartoon, memorable, colorful, exaggerated expressions. CRITICAL: Absolutely NO text, NO letters, NO words anywhere in the image."
}`;

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [
        { role: 'user', content: userPrompt }
      ],
      system: systemPrompt,
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        visualElements: parsed.visualElements || '',
        prompt: parsed.imagePrompt || '',
      };
    }

    throw new Error('Failed to parse Claude response');
  } catch (error) {
    console.error('[Smart Content] Mnemonic prompt generation failed:', error);
    // Fallback to simple template
    return {
      visualElements: wordData.mnemonic?.substring(0, 100) || '',
      prompt: `A 1:1 square cartoon illustration visualizing: ${wordData.mnemonic || wordData.word}. Style: cute cartoon, memorable, colorful. CRITICAL: NO text in image.`,
    };
  }
}

/**
 * Generate creative RHYME caption using rhyming words
 */
async function generateRhymeCaption(wordData: WordData): Promise<{ ko: string; en: string }> {
  const client = getAnthropicClient();

  if (!wordData.rhymingWords || wordData.rhymingWords.length === 0) {
    return {
      ko: wordData.definitionKo || `${wordData.word}의 의미`,
      en: wordData.definitionEn || `The meaning of ${wordData.word}`,
    };
  }

  const systemPrompt = `You are a creative writer helping Korean students learn English vocabulary through rhymes.
Create memorable sentences that naturally incorporate the target word and its rhyming words.
Always respond in the exact JSON format requested.`;

  const userPrompt = `Create a memorable sentence using this word and its rhymes.

Word: ${wordData.word}
Definition (English): ${wordData.definitionEn || 'unknown'}
Definition (Korean): ${wordData.definitionKo || '알 수 없음'}
Rhyming words: ${wordData.rhymingWords.slice(0, 4).join(', ')}

Create ONE meaningful English sentence that:
1. Uses the target word "${wordData.word}"
2. Incorporates at least one rhyming word naturally
3. Relates to the word's meaning
4. Is memorable and slightly fun

Then provide a natural Korean translation.

Respond in this exact JSON format:
{
  "captionEn": "English sentence here",
  "captionKo": "한국어 번역 여기"
}`;

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [
        { role: 'user', content: userPrompt }
      ],
      system: systemPrompt,
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        ko: parsed.captionKo || `${wordData.word}는 ${wordData.rhymingWords.slice(0, 3).join(', ')}와 라임!`,
        en: parsed.captionEn || `${wordData.word} rhymes with ${wordData.rhymingWords.slice(0, 3).join(', ')}`,
      };
    }

    throw new Error('Failed to parse Claude response');
  } catch (error) {
    console.error('[Smart Content] Rhyme caption generation failed:', error);
    return {
      ko: `${wordData.word}는 ${wordData.rhymingWords.slice(0, 3).join(', ')}와 라임! (${wordData.definitionKo || '의미'})`,
      en: `${wordData.word} rhymes with ${wordData.rhymingWords.slice(0, 3).join(', ')}`,
    };
  }
}

/**
 * Generate enhanced MNEMONIC caption
 */
async function generateMnemonicCaption(wordData: WordData): Promise<{ ko: string; en: string }> {
  const client = getAnthropicClient();

  const systemPrompt = `You are helping Korean students memorize English vocabulary.
Create short, punchy captions that capture the essence of a mnemonic in one line.
Always respond in the exact JSON format requested.`;

  const userPrompt = `Create a short caption summarizing this mnemonic.

Word: ${wordData.word}
Definition: ${wordData.definitionEn || 'unknown'}
Mnemonic: ${wordData.mnemonic || 'none'}
Korean hint: ${wordData.mnemonicKorean || 'none'}

Create a very short (under 30 characters if possible) Korean caption that captures the key association.
Also create a short English caption.

Respond in this exact JSON format:
{
  "captionKo": "짧은 한국어 연상 캡션",
  "captionEn": "Short English memory caption"
}`;

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      messages: [
        { role: 'user', content: userPrompt }
      ],
      system: systemPrompt,
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        ko: parsed.captionKo || wordData.mnemonicKorean || `${wordData.word} 연상법`,
        en: parsed.captionEn || wordData.mnemonic?.substring(0, 50) || `Memory tip for ${wordData.word}`,
      };
    }

    throw new Error('Failed to parse Claude response');
  } catch (error) {
    console.error('[Smart Content] Mnemonic caption generation failed:', error);
    return {
      ko: wordData.mnemonicKorean || `${wordData.word} 연상법`,
      en: wordData.mnemonic?.substring(0, 50) || `Memory tip for ${wordData.word}`,
    };
  }
}

/**
 * Generate enhanced CONCEPT caption with visual description
 */
async function generateConceptCaption(wordData: WordData): Promise<{ ko: string; en: string }> {
  // For concept, we mainly use the definition but can enhance it
  return {
    ko: wordData.definitionKo || `${wordData.word}의 의미`,
    en: wordData.definitionEn || `The meaning of ${wordData.word}`,
  };
}

/**
 * POST handler - Generate smart content using Claude API
 */
export async function POST(request: NextRequest) {
  try {
    // Check for API key
    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Claude API not configured' },
        { status: 500 }
      );
    }

    const body: SmartContentRequest = await request.json();
    const { wordData, types } = body;

    if (!wordData || !wordData.word) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: wordData.word' },
        { status: 400 }
      );
    }

    console.log(`[Smart Content] Generating for "${wordData.word}", types:`, types);

    const result: SmartContentResponse = {};

    // Process each requested type
    for (const type of types) {
      switch (type) {
        case 'MNEMONIC_PROMPT': {
          const { prompt, visualElements } = await generateMnemonicPrompt(wordData);
          result.mnemonicPrompt = prompt;
          result.mnemonicVisualElements = visualElements;
          break;
        }
        case 'MNEMONIC_CAPTION': {
          result.mnemonicCaption = await generateMnemonicCaption(wordData);
          break;
        }
        case 'RHYME_CAPTION': {
          result.rhymeCaption = await generateRhymeCaption(wordData);
          break;
        }
        case 'CONCEPT_CAPTION': {
          result.conceptCaption = await generateConceptCaption(wordData);
          break;
        }
      }
    }

    console.log(`[Smart Content] Generated for "${wordData.word}":`, Object.keys(result));

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[Smart Content] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate smart content',
      },
      { status: 500 }
    );
  }
}
