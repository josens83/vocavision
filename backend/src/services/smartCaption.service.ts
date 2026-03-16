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

export interface MnemonicSceneResult {
  scene: string;
  prompt: string;
  captionKo: string;
  captionEn: string;
}

export interface RhymeSceneResult {
  scene: string;
  prompt: string;
  captionKo: string;
  captionEn: string;
}

/**
 * Extract a concrete, memorable scene from mnemonic text
 * Transforms abstract mnemonic tips into visual scenes for image generation
 */
export async function extractMnemonicScene(
  word: string,
  definition: string,
  mnemonic: string,
  mnemonicKorean: string
): Promise<MnemonicSceneResult> {
  const defaultResult: MnemonicSceneResult = {
    scene: mnemonic,
    prompt: `A cartoon illustration of ${mnemonic}`,
    captionKo: mnemonicKorean,
    captionEn: `Memory tip: ${mnemonic}`,
  };

  const anthropic = getAnthropicClient();

  if (!anthropic || !mnemonic) {
    return defaultResult;
  }

  try {
    const prompt = `당신은 영어 단어 암기를 위한 이미지 장면을 설계하는 전문가입니다.

## 단어 정보
- 단어: ${word}
- 의미: ${definition}
- 연상법 (영어): ${mnemonic}
- 연상법 (한국어): ${mnemonicKorean}

## 작업
한국어 연상법을 기반으로 **구체적이고 기억에 남는 장면**을 설계해주세요.

## 규칙
1. 한국어 발음 유사성을 시각적 요소로 변환
2. 과장되고 유머러스한 장면 (한국 학생이 웃을 수 있도록)
3. 단어의 의미와 연결되어야 함
4. 구체적인 인물, 동작, 배경 포함

## 예시

### 예시 1: warily (조심스럽게)
- 연상법: "웨어(where) + 릴리(lily) = 어디에 백합이?"
- 장면: "숲속에서 조심스럽게 두리번거리며 백합꽃을 찾는 탐험가. 발밑을 조심하며 천천히 걷고, 눈을 크게 뜨고 주변을 살핀다."
- 캡션: "어디(where)에 백합(lily)이 있을까? 조심조심!"

### 예시 2: ephemeral (일시적인, 덧없는)
- 연상법: "이 페이지 머리털처럼 빠지고 사라진다"
- 장면: "책 페이지에서 머리카락들이 후두둑 빠져나와 공중으로 흩날리며 사라지는 장면. 당황한 표정의 사람이 빠지는 머리카락을 잡으려 한다."
- 캡션: "이 페이지의 머리털처럼 순식간에 사라진다!"

### 예시 3: xenophobia (외국인 혐오)
- 연상법: "지네(xeno)야 포비아(phobia) = 외국인을 지네처럼 무서워한다"
- 장면: "외국인을 보자마자 마치 지네를 본 것처럼 기겁하며 뒤로 물러나는 사람. 외국인은 평범하게 서있고, 반응하는 사람만 과장되게 무서워한다."
- 캡션: "지네야! 포비아! 외국인이 무서워!"

## 출력 형식 (JSON)
{
  "scene": "구체적인 장면 설명 (영어, 50-100 단어)",
  "captionKo": "한국어 캡션 (연상법 강조, 자연스럽게)",
  "captionEn": "영어 캡션 (연상법 해석)"
}

JSON만 출력하세요:`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type === 'text') {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        // Format the prompt for Stability AI (design spec v1)
        const finalPrompt = `Flat 2D editorial cartoon illustration, vector illustration style, clean bold outlines, solid color fills, minimal shading.
NOT 3D, NOT clay render, NOT pixar style, NOT realistic rendering.

Scene: ${parsed.scene}

Camera angle: medium-close cinematic framing, 1:1 square ratio.
Style: cute cartoon, bright colors, humorous, exaggerated expressions, memorable for Korean students.
Everyday setting with ONE absurd or unusual action.

STRICT NO TEXT RULE — no text, no letters, no numbers, no symbols, no labels, no captions, no titles, no speech bubbles, no signs, no watermarks anywhere in the image.
Replace text areas with blank surfaces.`;

        logger.info('[SmartCaption] Extracted mnemonic scene for', word, ':', {
          captionKo: parsed.captionKo,
        });

        return {
          scene: parsed.scene,
          prompt: finalPrompt,
          captionKo: parsed.captionKo || defaultResult.captionKo,
          captionEn: parsed.captionEn || defaultResult.captionEn,
        };
      }
    }
    return defaultResult;
  } catch (error) {
    logger.error('[SmartCaption] extractMnemonicScene error:', error);
    return defaultResult;
  }
}

/**
 * Generate a creative scene and captions using rhyming words
 * Creates meaningful sentences that incorporate both the word and its rhymes
 */
export async function generateRhymeScene(
  word: string,
  definition: string,
  rhymingWords: string[]
): Promise<RhymeSceneResult> {
  const defaultResult: RhymeSceneResult = {
    scene: `${word} with ${rhymingWords.slice(0, 3).join(', ')}`,
    prompt: `A cartoon illustration showing ${word}`,
    captionKo: `${word}는 ${rhymingWords.slice(0, 3).join(', ')}와 라임!`,
    captionEn: `${word} rhymes with ${rhymingWords.slice(0, 3).join(', ')}`,
  };

  const anthropic = getAnthropicClient();

  if (!anthropic || rhymingWords.length === 0) {
    return defaultResult;
  }

  try {
    const prompt = `당신은 영어 단어의 발음(라임)을 활용한 창의적인 장면과 문장을 만드는 전문가입니다.

## 단어 정보
- 단어: ${word}
- 의미: ${definition}
- 라임 단어들: ${rhymingWords.slice(0, 5).join(', ')}

## 작업
1. 라임 단어 중 1-2개를 선택하여 **의미 있는 문장** 생성
2. 그 문장을 **시각화할 장면** 설계

## 규칙
1. 원래 단어(${word})의 의미와 연결되어야 함
2. 라임 단어를 자연스럽게 포함
3. 한국어 캡션은 운율이 있으면 더 좋음
4. 구체적인 장면 (인물, 동작, 배경)

## 예시

### 예시 1: warily (조심스럽게) + merrily (즐겁게)
- 문장: "Walk warily, then run merrily!"
- 장면: "처음엔 조심조심 걷던 사람이 안전한 곳에 도착하자 즐겁게 뛰어다니는 장면. 표정이 긴장에서 환한 웃음으로 변한다."
- 캡션 KO: "조심조심 걷다가, 즐겁게 뛰어!"
- 캡션 EN: "Walk warily, then run merrily!"

### 예시 2: zap (전기 충격) + gap (틈)
- 문장: "One zap can close the gap!"
- 장면: "번개 같은 전기가 두 물체 사이의 틈을 연결하는 장면. 틈이 전기로 이어지며 스파크가 튄다."
- 캡션 KO: "한 번의 잽으로 격차가 끝난다!"
- 캡션 EN: "One zap can close the gap!"

### 예시 3: ephemeral (일시적인) + general (일반적인)
- 문장: "Even general power is ephemeral."
- 장면: "장군의 훈장이 바람에 날아가 사라지는 장면. 권위의 상징이 덧없이 흩어진다."
- 캡션 KO: "장군의 권위도 덧없이 사라진다."
- 캡션 EN: "Even a general's glory is ephemeral."

## 출력 형식 (JSON)
{
  "selectedRhymes": ["선택한 라임 단어 1-2개"],
  "scene": "구체적인 장면 설명 (영어, 50-80 단어)",
  "captionKo": "한국어 캡션 (운율 있게)",
  "captionEn": "영어 캡션 (라임 단어 포함)"
}

JSON만 출력하세요:`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type === 'text') {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        const finalPrompt = `Flat 2D editorial cartoon illustration, vector illustration style, clean bold outlines, solid color fills, minimal shading.
NOT 3D, NOT clay render, NOT pixar style, NOT realistic rendering.

Scene: ${parsed.scene}

Camera angle: medium-close cinematic framing, 1:1 square ratio.
Style: clean cartoon, soft colors, calm composition, focus on meaning.

STRICT NO TEXT RULE — no text, no letters, no numbers, no symbols, no labels, no captions, no titles, no speech bubbles, no signs, no watermarks anywhere in the image.
Replace text areas with blank surfaces.`;

        logger.info('[SmartCaption] Generated rhyme scene for', word, ':', {
          selectedRhymes: parsed.selectedRhymes,
          captionKo: parsed.captionKo,
        });

        return {
          scene: parsed.scene,
          prompt: finalPrompt,
          captionKo: parsed.captionKo || defaultResult.captionKo,
          captionEn: parsed.captionEn || defaultResult.captionEn,
        };
      }
    }
    return defaultResult;
  } catch (error) {
    logger.error('[SmartCaption] generateRhymeScene error:', error);
    return defaultResult;
  }
}

// ============================================
// Concept Image Scene Generator
// ============================================

export interface ConceptSceneResult {
  scene: string;
  prompt: string;
  captionKo: string;
  captionEn: string;
}

/**
 * Generate a concrete visual scene for CONCEPT image
 * Transforms abstract definitions into specific, memorable visual scenarios
 */
// Prompt v2: Whisk-validated 9-section structure (2026-03-16)
export async function generateConceptScene(
  word: string,
  definitionEn: string,
  definitionKo?: string
): Promise<ConceptSceneResult> {
  const defaultResult: ConceptSceneResult = {
    scene: definitionEn || word,
    prompt: `A high-quality 2D cartoon illustration centered on the concept of "${word}" (${definitionEn || word}). Scene: A clear, everyday situation showing the meaning. Camera angle: medium-close cinematic framing focused on the main subject. In the center of the frame, a character clearly demonstrates the meaning of "${word}" through action and expression. The moment clearly shows: ${definitionEn || word}. Style: High-quality 2D vector cartoon illustration with bold outlines and expressive details. Color palette: vibrant colors with strong contrast between subject and environment. High resolution 1:1 square composition The main subject must fill most of the frame Avoid empty background areas STRICT NO TEXT RULE Absolutely no text anywhere No letters No numbers No logos No labels No signage Replace any text areas with blank surfaces`,
    captionKo: definitionKo || word,
    captionEn: definitionEn || word,
  };

  const anthropic = getAnthropicClient();

  if (!anthropic || !definitionEn) {
    return defaultResult;
  }

  try {
    const claudePrompt = `You are an expert Stability AI prompt engineer specializing in vocabulary learning images.

## Word Information
- Word: ${word}
- Meaning: ${definitionEn}
${definitionKo ? `- Korean meaning: ${definitionKo}` : ''}

## Task
Create a complete, ready-to-use Stability AI image generation prompt for this vocabulary word. The prompt must vividly illustrate the word's meaning through a concrete scene.

## Required Output Structure (follow EXACTLY)

Line 1: "A [adjective] 2D cartoon illustration centered on [core concept of the word]."
Line 2: "Scene: [specific, concrete, real-world location]."
Line 3: "Camera angle: medium-close cinematic framing focused on [main subject]."
Line 4: "In the center of the frame,"
Lines 5-11: 5 to 7 sentences describing the scene in this order:
  - Main character's action (2 sentences)
  - Cause-effect or before-after chain (2 sentences)
  - Supporting characters or environment reaction (1-2 sentences)
  - "The moment clearly shows [explicit restatement of the word's meaning]."
Line 12: "Style: High-quality 2D vector cartoon illustration with bold outlines and [choose one: expressive reactions / strong action / dramatic tension / warm emotional detail]."
Line 13: "Color palette: [primary color theme] contrasted with [contrasting secondary color]."
Line 14: "High resolution"
Line 15: "1:1 square composition"
Line 16: "The main subject must fill most of the frame"
Line 17: "Avoid empty background areas"
Line 18: "STRICT NO TEXT RULE"
Line 19: "Absolutely no text anywhere"
Line 20: "No letters"
Line 21: "No numbers"
Line 22: "No logos"
Line 23: "No labels"
Line 24: "No signage"
Line 25: "Replace any text areas with blank surfaces"

## Good Examples (follow this quality level)

### Example 1: suppress (to put an end to; to prevent from being known)
A high-impact 2D cartoon illustration centered on suppressing a dangerous situation. Scene: a burning building during an active firefighting effort. Camera angle: medium-close cinematic framing focused on the firefighter and flames. In the center of the frame, a firefighter sprays a powerful stream of water toward growing flames. The water pushes back the fire as smoke rises upward. Parts of the fire begin shrinking where the water hits. Other firefighters move equipment nearby to control the situation. The moment clearly shows the fire being suppressed before it spreads further. Style: High-quality 2D vector cartoon illustration with bold outlines and strong action. Color palette: bright orange flames contrasted with cool blue water spray and dark smoke. High resolution 1:1 square composition The main subject must fill most of the frame Avoid empty background areas STRICT NO TEXT RULE Absolutely no text anywhere No letters No numbers No logos No labels No signage Replace any text areas with blank surfaces

### Example 2: astound (to shock or greatly surprise)
A dramatic 2D cartoon illustration centered on a moment of complete surprise. Scene: a lively street magic performance in a busy city square. Camera angle: medium-close cinematic framing focused on the magician and the crowd. In the center of the frame, a magician dramatically pulls a large colorful scarf out of a small empty hat. The scarf keeps coming out longer and longer in an impossible way. The crowd surrounding the magician reacts with wide eyes and open mouths. Some people clap while others lean forward in disbelief. The moment clearly shows people being completely astounded by the unexpected spectacle. Style: High-quality 2D vector cartoon illustration with bold outlines and expressive reactions. Color palette: bright festive colors contrasted with strong spotlight lighting on the magician. High resolution 1:1 square composition The main subject must fill most of the frame Avoid empty background areas STRICT NO TEXT RULE Absolutely no text anywhere No letters No numbers No logos No labels No signage Replace any text areas with blank surfaces

## Additional Rules
- NEVER use white or plain background — always use a real, contextual environment
- ALWAYS include at least 2 characters interacting
- The word "${word}" must NEVER appear visually in the image
- Avoid abstract or metaphorical scenes — everything must be physically visible
- The scene must work WITHOUT any text to convey the word's meaning

## Output
Output the prompt text ONLY. No JSON. No explanation. No preamble. No word labels. Start directly with "A [adjective] 2D cartoon illustration..."`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 700,
      messages: [{ role: 'user', content: claudePrompt }],
    });

    const content = message.content[0];
    if (content.type === 'text') {
      const generatedPrompt = content.text.trim();

      // Validate: must start with "A " and be long enough
      if (generatedPrompt.startsWith('A ') && generatedPrompt.length > 300) {
        // Extract scene description (lines 4-11) for caption use
        const lines = generatedPrompt.split('\n').filter(l => l.trim());
        const sceneLines = lines.slice(3, 11).join(' ');

        // Generate captions from Claude output
        const captionEn = lines.find(l => l.includes('clearly shows'))
          ?.replace('The moment clearly shows', '').trim()
          .replace(/\.$/, '') || definitionEn;

        logger.info('[SmartCaption] Generated concept scene for', word, ':', {
          promptLength: generatedPrompt.length,
          captionEn: captionEn.slice(0, 50),
        });

        return {
          scene: sceneLines,
          prompt: generatedPrompt,
          captionKo: definitionKo || word,
          captionEn: captionEn,
        };
      }
    }

    logger.warn('[SmartCaption] generateConceptScene: invalid output, using default for', word);
    return defaultResult;
  } catch (error) {
    logger.error('[SmartCaption] generateConceptScene error:', error);
    return defaultResult;
  }
}
