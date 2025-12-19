/**
 * Background Image Generation Script
 *
 * Generates images for words without visuals using:
 * - Claude API for smart prompts/captions
 * - Stability AI for image generation
 * - Cloudinary for image storage
 *
 * Usage:
 *   npm run generate-images -- --limit=100
 *   npm run generate-images -- --limit=50 --exam-type=TEPS --level=L2
 *   npm run generate-images -- --dry-run --limit=10
 */

import { PrismaClient } from '@prisma/client';

// Type definitions (matches Prisma schema)
type VisualType = 'CONCEPT' | 'MNEMONIC' | 'RHYME';
type ExamCategory = 'CSAT' | 'TEPS' | 'TOEIC' | 'TOEFL' | 'SAT';
import Anthropic from '@anthropic-ai/sdk';
import * as crypto from 'crypto';
import 'dotenv/config';

const prisma = new PrismaClient();

// Configuration
const STABILITY_API_KEY = process.env.STABILITY_API_KEY || '';
const STABILITY_API_URL = 'https://api.stability.ai/v1/generation';
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || '';
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || '';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

// Rate limiting
const IMAGE_DELAY_MS = 2000; // 2 seconds between images
const WORD_DELAY_MS = 1000; // 1 second between words

// Visual type configurations
const VISUAL_CONFIGS = {
  CONCEPT: {
    style: 'cute cartoon illustration, Pixar style, bright vibrant colors, friendly, educational',
    negativePrompt: 'text, words, letters, alphabet, typography, writing, captions, labels, watermark, signature, blurry, numbers, characters, font, handwriting, title, subtitle, realistic, photograph, dark, scary',
    labelEn: 'Concept',
    labelKo: '의미',
  },
  MNEMONIC: {
    style: 'cartoon illustration, cute, memorable, colorful',
    negativePrompt: 'text, words, letters, alphabet, typography, writing, captions, labels, watermark, signature, realistic, photograph, numbers, characters, font, handwriting, title, subtitle',
    labelEn: 'Mnemonic',
    labelKo: '연상',
  },
  RHYME: {
    style: 'playful cartoon, humorous, bright colors',
    negativePrompt: 'text, words, letters, alphabet, typography, writing, captions, labels, watermark, signature, realistic, photograph, numbers, characters, font, handwriting, title, subtitle',
    labelEn: 'Rhyme',
    labelKo: '라이밍',
  },
};

interface CLIOptions {
  limit: number;
  skipExisting: boolean;
  dryRun: boolean;
  examType?: ExamCategory;
  level?: string;
  types: VisualType[];
}

interface WordData {
  id: string;
  word: string;
  definition: string;
  definitionKo?: string | null;
  rhymingWords: string[];
  mnemonics: Array<{ content: string; koreanHint?: string | null }>;
}

interface GenerationResult {
  wordId: string;
  word: string;
  success: boolean;
  types: {
    type: VisualType;
    success: boolean;
    error?: string;
    imageUrl?: string;
  }[];
}

// Parse CLI arguments
function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);
  const options: CLIOptions = {
    limit: 100,
    skipExisting: true,
    dryRun: false,
    types: ['CONCEPT', 'MNEMONIC', 'RHYME'] as VisualType[],
  };

  for (const arg of args) {
    if (arg.startsWith('--limit=')) {
      options.limit = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--exam-type=')) {
      options.examType = arg.split('=')[1] as ExamCategory;
    } else if (arg.startsWith('--level=')) {
      options.level = arg.split('=')[1];
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--no-skip-existing') {
      options.skipExisting = false;
    } else if (arg.startsWith('--types=')) {
      options.types = arg.split('=')[1].split(',') as VisualType[];
    }
  }

  return options;
}

// Initialize Anthropic client
let anthropic: Anthropic | null = null;
function getAnthropicClient(): Anthropic {
  if (!anthropic) {
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not set');
    }
    anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  }
  return anthropic;
}

// Generate smart content using Claude
async function generateSmartContent(
  wordData: WordData,
  type: VisualType
): Promise<{ prompt: string; captionKo: string; captionEn: string }> {
  const client = getAnthropicClient();

  if (type === 'CONCEPT') {
    return {
      prompt: `A 1:1 square cute cartoon illustration showing the meaning of "${wordData.word}" which means "${wordData.definition}". Style: Pixar-like 3D cartoon, bright vibrant colors, friendly character design, simple clean composition, educational and memorable. The image should help language learners instantly understand and remember the word meaning. CRITICAL: Absolutely NO text, NO letters, NO words, NO writing anywhere in the image. Pure visual illustration only.`,
      captionKo: wordData.definitionKo || `${wordData.word}의 의미`,
      captionEn: wordData.definition,
    };
  }

  if (type === 'MNEMONIC') {
    const mnemonic = wordData.mnemonics[0];
    if (!mnemonic) {
      return {
        prompt: `A 1:1 square cartoon illustration of something memorable related to "${wordData.word}". Style: cute cartoon, memorable, colorful. CRITICAL: NO text in image.`,
        captionKo: `${wordData.word} 연상법`,
        captionEn: `Memory tip for ${wordData.word}`,
      };
    }

    // Use Claude to extract visual elements
    try {
      const message = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        system: 'You extract visual elements from mnemonic text for image generation. Always respond in JSON format.',
        messages: [{
          role: 'user',
          content: `Extract visual elements from this mnemonic for "${wordData.word}":
${mnemonic.content}
${mnemonic.koreanHint ? `Korean hint: ${mnemonic.koreanHint}` : ''}

Respond in JSON:
{
  "imagePrompt": "A 1:1 square cartoon illustration of [specific scene]. Style: cute cartoon, memorable, colorful. CRITICAL: NO text.",
  "captionKo": "짧은 한국어 캡션",
  "captionEn": "Short English caption"
}`
        }],
      });

      const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          prompt: parsed.imagePrompt || `A 1:1 square cartoon illustration visualizing: ${mnemonic.content.substring(0, 100)}. Style: cute cartoon. NO text.`,
          captionKo: parsed.captionKo || mnemonic.koreanHint || `${wordData.word} 연상법`,
          captionEn: parsed.captionEn || mnemonic.content.substring(0, 50),
        };
      }
    } catch (error) {
      console.error(`    [Claude] Error for MNEMONIC:`, error);
    }

    return {
      prompt: `A 1:1 square cartoon illustration visualizing: ${mnemonic.content.substring(0, 100)}. Style: cute cartoon, memorable, colorful. CRITICAL: NO text.`,
      captionKo: mnemonic.koreanHint || `${wordData.word} 연상법`,
      captionEn: mnemonic.content.substring(0, 50),
    };
  }

  // RHYME type
  if (!wordData.rhymingWords || wordData.rhymingWords.length === 0) {
    return {
      prompt: `A 1:1 square humorous cartoon illustration showing a funny scene that represents "${wordData.definition}". Style: playful cartoon, bright colors. CRITICAL: NO text.`,
      captionKo: wordData.definitionKo || `${wordData.word}의 의미`,
      captionEn: wordData.definition,
    };
  }

  // Use Claude for rhyme caption
  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      system: 'You create memorable rhyme-based sentences for vocabulary learning. Always respond in JSON format.',
      messages: [{
        role: 'user',
        content: `Create a memorable sentence using "${wordData.word}" (meaning: ${wordData.definition}) and rhyming words: ${wordData.rhymingWords.slice(0, 4).join(', ')}.

Respond in JSON:
{
  "captionEn": "English sentence using the word and a rhyme",
  "captionKo": "한국어 번역"
}`
      }],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        prompt: `A 1:1 square humorous cartoon illustration showing: ${parsed.captionEn}. Style: playful cartoon, bright colors, fun expressions. CRITICAL: NO text.`,
        captionKo: parsed.captionKo || `${wordData.word}는 ${wordData.rhymingWords[0]}와 라임!`,
        captionEn: parsed.captionEn || `${wordData.word} rhymes with ${wordData.rhymingWords[0]}`,
      };
    }
  } catch (error) {
    console.error(`    [Claude] Error for RHYME:`, error);
  }

  return {
    prompt: `A 1:1 square humorous cartoon illustration showing a funny scene about "${wordData.word}". Style: playful cartoon, bright colors. CRITICAL: NO text.`,
    captionKo: `${wordData.word}는 ${wordData.rhymingWords[0]}와 라임!`,
    captionEn: `${wordData.word} rhymes with ${wordData.rhymingWords[0]}`,
  };
}

// Generate image with Stability AI
async function generateImage(prompt: string, visualType: VisualType): Promise<string | null> {
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

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${STABILITY_API_KEY}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.json() as { message?: string };
    throw new Error(`Stability AI error: ${error.message || response.statusText}`);
  }

  const data = await response.json() as { artifacts?: Array<{ base64: string }> };

  if (data.artifacts && data.artifacts.length > 0) {
    return data.artifacts[0].base64;
  }

  return null;
}

// Upload to Cloudinary
async function uploadToCloudinary(base64Data: string, word: string, visualType: string): Promise<string> {
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

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json() as { error?: { message?: string } };
    throw new Error(`Cloudinary error: ${error.error?.message || response.statusText}`);
  }

  const result = await response.json() as { secure_url: string };
  return result.secure_url;
}

// Save visual to database
async function saveVisual(
  wordId: string,
  type: VisualType,
  imageUrl: string,
  prompt: string,
  captionKo: string,
  captionEn: string
): Promise<void> {
  const config = VISUAL_CONFIGS[type];

  await prisma.wordVisual.upsert({
    where: {
      wordId_type: { wordId, type },
    },
    update: {
      imageUrl,
      promptEn: prompt,
      captionKo,
      captionEn,
      labelKo: config.labelKo,
      labelEn: config.labelEn,
      updatedAt: new Date(),
    },
    create: {
      wordId,
      type,
      imageUrl,
      promptEn: prompt,
      captionKo,
      captionEn,
      labelKo: config.labelKo,
      labelEn: config.labelEn,
      order: type === 'CONCEPT' ? 0 : type === 'MNEMONIC' ? 1 : 2,
    },
  });
}

// Delay helper
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Format duration
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}분 ${secs}초`;
}

// Main function
async function main() {
  const options = parseArgs();
  const startTime = Date.now();

  console.log('\n🚀 이미지 생성 시작');
  console.log('━'.repeat(50));
  console.log(`📋 설정:`);
  console.log(`   - 처리 제한: ${options.limit}개 단어`);
  console.log(`   - 기존 건너뛰기: ${options.skipExisting ? '예' : '아니오'}`);
  console.log(`   - 드라이런: ${options.dryRun ? '예' : '아니오'}`);
  console.log(`   - 타입: ${options.types.join(', ')}`);
  if (options.examType) console.log(`   - 시험: ${options.examType}`);
  if (options.level) console.log(`   - 레벨: ${options.level}`);
  console.log('━'.repeat(50));

  // Check API keys
  if (!options.dryRun) {
    if (!STABILITY_API_KEY) {
      console.error('❌ STABILITY_API_KEY가 설정되지 않았습니다');
      process.exit(1);
    }
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
      console.error('❌ Cloudinary 설정이 완료되지 않았습니다');
      process.exit(1);
    }
    if (!ANTHROPIC_API_KEY) {
      console.error('❌ ANTHROPIC_API_KEY가 설정되지 않았습니다');
      process.exit(1);
    }
  }

  // Build query
  const whereClause: any = {
    status: 'PUBLISHED',
  };

  if (options.examType) {
    whereClause.examCategory = options.examType;
  }

  if (options.level) {
    whereClause.level = options.level;
  }

  // Get words that need images
  const words = await prisma.word.findMany({
    where: whereClause,
    include: {
      visuals: true,
      mnemonics: {
        select: { content: true, koreanHint: true },
        take: 1,
      },
    },
    take: options.limit * 3, // Get more words to filter
    orderBy: { createdAt: 'desc' },
  });

  // Filter words that need images
  const wordsNeedingImages = words.filter(word => {
    if (!options.skipExisting) return true;

    const existingTypes = new Set(word.visuals.map(v => v.type));
    return options.types.some(type => !existingTypes.has(type));
  }).slice(0, options.limit);

  console.log(`\n📊 처리할 단어: ${wordsNeedingImages.length}개`);
  console.log(`   (예상 이미지: 최대 ${wordsNeedingImages.length * options.types.length}개)`);
  console.log('');

  if (wordsNeedingImages.length === 0) {
    console.log('✅ 처리할 단어가 없습니다.');
    await prisma.$disconnect();
    return;
  }

  const results: GenerationResult[] = [];
  let totalSuccess = 0;
  let totalFailed = 0;

  for (let i = 0; i < wordsNeedingImages.length; i++) {
    const word = wordsNeedingImages[i];
    const existingTypes = new Set(word.visuals.map(v => v.type));

    console.log(`[${i + 1}/${wordsNeedingImages.length}] ${word.word}`);

    const wordData: WordData = {
      id: word.id,
      word: word.word,
      definition: word.definition,
      definitionKo: word.definitionKo,
      rhymingWords: word.rhymingWords || [],
      mnemonics: word.mnemonics,
    };

    const result: GenerationResult = {
      wordId: word.id,
      word: word.word,
      success: true,
      types: [],
    };

    for (const type of options.types) {
      // Skip if already exists
      if (options.skipExisting && existingTypes.has(type)) {
        console.log(`  ⏭️  ${type} - 이미 존재`);
        continue;
      }

      try {
        // Generate smart content
        console.log(`  ⏳ ${type} - 프롬프트 생성 중...`);
        const content = await generateSmartContent(wordData, type);

        if (options.dryRun) {
          console.log(`  ✅ ${type} - [DRY RUN] 프롬프트: ${content.prompt.substring(0, 50)}...`);
          result.types.push({ type, success: true });
          totalSuccess++;
          continue;
        }

        // Generate image
        console.log(`  ⏳ ${type} - 이미지 생성 중...`);
        const base64 = await generateImage(content.prompt, type);

        if (!base64) {
          throw new Error('이미지 생성 실패');
        }

        // Upload to Cloudinary
        console.log(`  ⏳ ${type} - 업로드 중...`);
        const imageUrl = await uploadToCloudinary(base64, word.word, type);

        // Save to database
        await saveVisual(word.id, type, imageUrl, content.prompt, content.captionKo, content.captionEn);

        console.log(`  ✅ ${type} 완료`);
        result.types.push({ type, success: true, imageUrl });
        totalSuccess++;

        // Rate limiting
        await delay(IMAGE_DELAY_MS);

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : '알 수 없는 오류';
        console.log(`  ❌ ${type} 실패: ${errorMsg}`);
        result.types.push({ type, success: false, error: errorMsg });
        result.success = false;
        totalFailed++;
      }
    }

    results.push(result);

    // Delay between words
    if (i < wordsNeedingImages.length - 1) {
      await delay(WORD_DELAY_MS);
    }
  }

  // Summary
  const duration = (Date.now() - startTime) / 1000;
  console.log('\n' + '━'.repeat(50));
  console.log('📊 완료 요약');
  console.log('━'.repeat(50));
  console.log(`✅ 성공: ${totalSuccess}개 이미지`);
  console.log(`❌ 실패: ${totalFailed}개 이미지`);
  console.log(`⏱️  소요: ${formatDuration(duration)}`);

  // Show failures
  const failedWords = results.filter(r => !r.success);
  if (failedWords.length > 0) {
    console.log('\n❌ 실패한 단어:');
    for (const fw of failedWords) {
      const failedTypes = fw.types.filter(t => !t.success);
      console.log(`   - ${fw.word}: ${failedTypes.map(t => `${t.type}(${t.error})`).join(', ')}`);
    }
  }

  await prisma.$disconnect();
}

// Run
main().catch(error => {
  console.error('스크립트 오류:', error);
  prisma.$disconnect();
  process.exit(1);
});
