/**
 * Smart Caption Service
 * Uses Claude API to generate creative captions for vocabulary learning images
 */

import Anthropic from '@anthropic-ai/sdk';
import logger from '../utils/logger';

// Initialize Anthropic client
const getAnthropicClient = () => {
  if (!process.env.ANTHROPIC_API_KEY) {
    return null;
  }
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
};

export interface RhymeCaptions {
  captionKo: string;
  captionEn: string;
}

export interface MnemonicVisualElements {
  visualElements: string;
  improvedPrompt: string;
}

/**
 * Generate creative rhyme captions using Claude API
 * Creates memorable sentences using rhyming words
 */
export async function generateRhymeCaptions(
  word: string,
  definition: string,
  rhymingWords: string[]
): Promise<RhymeCaptions> {
  const defaultCaptions: RhymeCaptions = {
    captionKo:
      rhymingWords.length > 0
        ? `${word}는 ${rhymingWords.slice(0, 3).join(', ')}와 라임!`
        : definition || word,
    captionEn:
      rhymingWords.length > 0
        ? `${word} rhymes with ${rhymingWords.slice(0, 3).join(', ')}`
        : definition || word,
  };

  const anthropic = getAnthropicClient();

  // If no API key or no rhyming words, return defaults
  if (!anthropic) {
    logger.warn('[SmartCaption] ANTHROPIC_API_KEY not set, using default captions');
    return defaultCaptions;
  }

  if (rhymingWords.length === 0) {
    return defaultCaptions;
  }

  try {
    const prompt = `당신은 영어 어휘 학습 앱을 위한 창의적인 캡션을 작성하는 전문가입니다.

단어: ${word}
의미: ${definition || '(정의 없음)'}
라임 단어들: ${rhymingWords.slice(0, 5).join(', ')}

위 라임 단어들 중 1-2개를 활용해서 기억에 남는 짧은 문장을 만들어주세요.

규칙:
1. 한국어 문장: 10-25자 이내, 자연스러운 한국어
2. 영어 문장: 5-12 단어 이내, 운율이 있으면 좋음
3. 단어의 의미와 연결되면 더 좋음
4. 유머러스하거나 기억에 남는 표현

예시:
단어: zap, 라임: tap, map, cap, gap
한국어: "한 번의 잽으로 격차가 끝난다."
영어: "One zap can end the gap."

JSON 형식으로만 응답하세요:
{
  "captionKo": "한국어 문장",
  "captionEn": "English sentence"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      logger.error('[SmartCaption] Unexpected response type:', content.type);
      return defaultCaptions;
    }

    // Parse JSON from response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      logger.error('[SmartCaption] Failed to parse JSON from response:', content.text);
      return defaultCaptions;
    }

    const parsed = JSON.parse(jsonMatch[0]) as RhymeCaptions;

    logger.info('[SmartCaption] Generated rhyme captions for', word, ':', parsed);

    return {
      captionKo: parsed.captionKo || defaultCaptions.captionKo,
      captionEn: parsed.captionEn || defaultCaptions.captionEn,
    };
  } catch (error) {
    logger.error('[SmartCaption] Error generating rhyme captions:', error);
    return defaultCaptions;
  }
}

/**
 * Extract visual elements from mnemonic text for better image generation
 */
export async function extractMnemonicVisualElements(
  word: string,
  mnemonic: string,
  mnemonicKorean?: string
): Promise<MnemonicVisualElements> {
  const defaultResult: MnemonicVisualElements = {
    visualElements: word,
    improvedPrompt: `A cartoon illustration of "${word}" in a funny, memorable way`,
  };

  const anthropic = getAnthropicClient();

  if (!anthropic || !mnemonic) {
    return defaultResult;
  }

  try {
    const prompt = `영어 단어 암기법에서 이미지로 표현할 핵심 시각 요소를 추출하세요.

단어: ${word}
연상법 (영어): ${mnemonic}
${mnemonicKorean ? `연상법 (한국어): ${mnemonicKorean}` : ''}

다음 형식으로 응답하세요:
{
  "visualElements": "핵심 시각 요소를 영어로 설명 (예: falling hair, flying pages, angry cat)",
  "improvedPrompt": "Stability AI에서 사용할 상세한 이미지 프롬프트 (영어, 50-100 단어)"
}

프롬프트 작성 규칙:
1. 구체적인 장면 묘사 포함
2. 만화 스타일, 밝은 색상
3. 텍스트 금지 강조
4. 기억에 남는 시각적 요소 포함
5. 1:1 정사각형 형식`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      return defaultResult;
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return defaultResult;
    }

    const parsed = JSON.parse(jsonMatch[0]) as MnemonicVisualElements;

    logger.info('[SmartCaption] Extracted mnemonic visual elements for', word, ':', {
      visualElements: parsed.visualElements?.substring(0, 50),
    });

    return {
      visualElements: parsed.visualElements || defaultResult.visualElements,
      improvedPrompt: parsed.improvedPrompt || defaultResult.improvedPrompt,
    };
  } catch (error) {
    logger.error('[SmartCaption] Error extracting mnemonic visual elements:', error);
    return defaultResult;
  }
}

/**
 * Translate Korean mnemonic to English
 * For MNEMONIC image captions: captionKo = Korean mnemonic, captionEn = English translation
 */
export async function translateMnemonicToEnglish(
  word: string,
  mnemonicKorean: string
): Promise<string> {
  const defaultTranslation = `Memory tip for ${word}`;

  const anthropic = getAnthropicClient();

  if (!anthropic || !mnemonicKorean) {
    return defaultTranslation;
  }

  try {
    const prompt = `다음은 영어 단어 "${word}"를 암기하기 위한 한국어 연상법입니다.
이 연상법을 자연스러운 영어로 번역해주세요.

한국어 연상법: "${mnemonicKorean}"

규칙:
1. 직역이 아닌 의미 전달에 집중
2. 한국어 발음 유희가 있다면 영어로 설명하거나 비슷한 표현 사용
3. 1-2문장으로 간결하게
4. 학습자가 이해할 수 있도록 명확하게

예시:
- "왜인(wane)지 모르게 체중이 빠지네" → "Why am I losing weight?"
- "외국인을 지네처럼 보는 감정" → "Seeing foreigners as centipedes, not as humans"
- "지네야 포비야 = 외국인 무서워" → "Xeno-phobia: fear of foreigners"

영어 번역만 출력하세요 (따옴표 없이):`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 100,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type === 'text') {
      const translation = content.text.trim().replace(/^["']|["']$/g, '');
      logger.info('[SmartCaption] Translated mnemonic for', word, ':', translation);
      return translation;
    }
    return defaultTranslation;
  } catch (error) {
    logger.error('[SmartCaption] Translation error for', word, ':', error);
    return defaultTranslation;
  }
}
