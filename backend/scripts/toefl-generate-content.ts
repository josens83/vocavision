import Anthropic from "@anthropic-ai/sdk";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();
const anthropic = new Anthropic(); // ANTHROPIC_API_KEY 환경변수 필요

const BATCH_SIZE = 20; // 한 번에 처리할 단어 수
const DELAY_MS = 3000; // API 호출 간 딜레이 (rate limit 방지)

// ============================================================
// 1. DRAFT 단어 조회
// ============================================================
async function getDraftWords() {
  return prisma.word.findMany({
    where: {
      examCategory: "TOEFL",
      status: "DRAFT",
    },
    select: {
      id: true,
      word: true,
      partOfSpeech: true,
    },
    orderBy: { word: "asc" },
  });
}

// ============================================================
// 2. Claude API 호출 — 배치 단위
// ============================================================
async function generateBatchContent(words: { id: string; word: string; partOfSpeech: string }[]) {
  const wordList = words.map((w) => w.word).join(", ");

  const prompt = `You are a professional English vocabulary content creator for VocaVision AI, a visual English learning platform for TOEFL students.

Generate complete learning content for these ${words.length} TOEFL words: [${wordList}]

For EACH word, return a JSON object with ALL fields below.

{
  "word": "the word",

  // === Word Table ===
  "definition": "Clear English definition. 1-2 sentences. Academic but accessible.",
  "definitionKo": "한국어 뜻 (간결, 핵심만)",
  "partOfSpeech": "NOUN|VERB|ADJECTIVE|ADVERB",
  "pronunciation": "한국어 발음 가이드 (예: 퍼-씨브 (강세: 씨))",
  "ipaUs": "IPA 미국식 (예: /pɚˈsiːv/)",
  "root": "어근 or null",
  "prefix": "접두사 or null",
  "suffix": "접미사 or null",
  "morphologyNote": "어원 분석 한국어 (예: per-(완전히) + ceive(잡다) = 감각으로 완전히 잡아내다)",
  "synonymList": ["synonym1", "synonym2", "synonym3", "synonym4", "synonym5"],
  "antonymList": ["antonym1", "antonym2"],
  "rhymingWords": ["rhyme1", "rhyme2", "rhyme3"],
  "tags": ["TOEFL", "분야태그"],

  // === Rhyme ===
  "rhymeCaptionEn": "English rhyme sentence (under 20 words, natural rhythm)",
  "rhymeCaptionKo": "한국어 번역",

  // === Collocations (tips 컬럼에 저장) ===
  "collocations": [
    {"en": "collocation phrase", "ko": "한국어 뜻"},
    {"en": "collocation phrase", "ko": "한국어 뜻"},
    {"en": "collocation phrase", "ko": "한국어 뜻"},
    {"en": "collocation phrase", "ko": "한국어 뜻"}
  ],

  // === CONCEPT Image ===
  "conceptCaptionEn": "10-15 word English caption describing what the image shows",
  "conceptCaptionKo": "한국어 캡션",
  "conceptPrompt": "DETAILED image generation prompt (see rules below)",

  // === RHYME Image ===
  "rhymePrompt": "DETAILED image generation prompt illustrating the rhyme scene"
}

=== IMAGE PROMPT RULES (CRITICAL — FOLLOW EXACTLY) ===

Every conceptPrompt and rhymePrompt MUST:

1. Start with: "Cartoon illustration style, vibrant colors, highly expressive."
2. Include camera/framing: "Extreme close-up wide-angle framing." or "Dynamic composition."
3. Include: "Foreground, midground, and background filled edge to edge. No empty space."
4. Describe SPECIFIC setting (WHERE — e.g., "A crowded rooftop party at sunset")
5. Describe SPECIFIC character action (WHO + WHAT — e.g., "one person stands animatedly telling a story, arms wide open")
6. Describe character POSE and FACIAL EXPRESSION
7. Describe surrounding ENVIRONMENT details (props, objects, atmosphere)
8. End with: "Square composition (1:1). No text. No words. No letters. No numbers. No symbols. No labels. No captions. No watermarks."
9. Must be AT LEAST 10 lines long — SHORT PROMPTS ARE FORBIDDEN
10. NEVER write "A simple scene showing the meaning of X" — THIS IS BANNED
11. NEVER write "plain white background" — THIS IS BANNED
12. Use METAPHOR for abstract concepts (e.g., ambiguous → foggy crossroads with two doors)

CATEGORY TONE GUIDE:
- 감정/심리: Warm palette. Expressive faces and body language.
- 학술/과학: Cool blue tones. Lab/classroom. Equations and instruments.
- 사회/정치: Dramatic lighting. Public settings.
- 자연/환경: Natural light, panoramic. Earth, water, sky.
- 추상: Concrete METAPHOR. Make the invisible visible.
- 변화: Show BEFORE/AFTER in one frame.

Return ONLY a valid JSON array: [{word1_data}, {word2_data}, ...]
Do NOT include any text outside the JSON array.`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 16000,
    messages: [{ role: "user", content: prompt }],
  });

  // 응답에서 JSON 추출
  const text = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  // JSON 파싱 (```json 블록이 있을 수 있음)
  const jsonStr = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(jsonStr);
}

// ============================================================
// 3. DB 업데이트 — Word 테이블
// ============================================================
async function updateWord(wordId: string, data: any) {
  // collocations → tips 컬럼에 저장
  const tipsText = data.collocations
    ? data.collocations.map((c: any) => `${c.en} — ${c.ko}`).join("\n")
    : null;

  await prisma.word.update({
    where: { id: wordId },
    data: {
      definition: data.definition,
      definitionKo: data.definitionKo,
      partOfSpeech: data.partOfSpeech,
      pronunciation: data.pronunciation,
      ipaUs: data.ipaUs,
      root: data.root || null,
      prefix: data.prefix || null,
      suffix: data.suffix || null,
      morphologyNote: data.morphologyNote || null,
      synonymList: data.synonymList || [],
      antonymList: data.antonymList || [],
      rhymingWords: data.rhymingWords || [],
      tags: data.tags || ["TOEFL"],
      tips: tipsText,
      status: "REVIEW", // DRAFT → REVIEW (생성 완료, 검토 필요)
      aiGeneratedAt: new Date(),
      aiModel: "claude-sonnet-4-20250514",
      updatedAt: new Date(),
    },
  });
}

// ============================================================
// 4. DB INSERT — WordVisual (CONCEPT + RHYME)
// ============================================================
async function createVisuals(wordId: string, data: any) {
  // CONCEPT
  await prisma.wordVisual.create({
    data: {
      id: randomUUID(),
      wordId,
      type: "CONCEPT",
      captionEn: data.conceptCaptionEn,
      captionKo: data.conceptCaptionKo,
      promptEn: data.conceptPrompt,
      imageUrl: null, // 이미지는 나중에 생성
      order: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // RHYME
  await prisma.wordVisual.create({
    data: {
      id: randomUUID(),
      wordId,
      type: "RHYME",
      captionEn: data.rhymeCaptionEn,
      captionKo: data.rhymeCaptionKo,
      promptEn: data.rhymePrompt,
      imageUrl: null, // 이미지는 나중에 생성
      order: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

// ============================================================
// 5. 메인 실행
// ============================================================
async function main() {
  console.log("🚀 TOEFL 콘텐츠 생성 시작\n");

  // DRAFT 단어 조회
  const draftWords = await getDraftWords();
  console.log(`📋 DRAFT 단어: ${draftWords.length}개\n`);

  if (draftWords.length === 0) {
    console.log("✅ 처리할 DRAFT 단어 없음!");
    return;
  }

  // 배치 분할
  const batches: typeof draftWords[] = [];
  for (let i = 0; i < draftWords.length; i += BATCH_SIZE) {
    batches.push(draftWords.slice(i, i + BATCH_SIZE));
  }
  console.log(`📦 배치 수: ${batches.length}개 (${BATCH_SIZE}개/배치)\n`);

  let successCount = 0;
  let errorCount = 0;
  const errors: { word: string; error: string }[] = [];

  for (let bi = 0; bi < batches.length; bi++) {
    const batch = batches[bi];
    const wordNames = batch.map((w) => w.word).join(", ");
    console.log(`\n📦 배치 ${bi + 1}/${batches.length}: [${wordNames}]`);

    try {
      // Claude API 호출
      const results = await generateBatchContent(batch);
      console.log(`   ✅ API 응답: ${results.length}개`);

      // 각 단어별 DB 업데이트
      for (const result of results) {
        const matchedWord = batch.find(
          (w) => w.word.toLowerCase() === result.word.toLowerCase()
        );

        if (!matchedWord) {
          console.log(`   ⚠️ 매칭 실패: ${result.word}`);
          errors.push({ word: result.word, error: "no match in batch" });
          errorCount++;
          continue;
        }

        try {
          await updateWord(matchedWord.id, result);
          await createVisuals(matchedWord.id, result);
          successCount++;
          console.log(`   ✅ ${result.word} — 완료`);
        } catch (dbErr: any) {
          errorCount++;
          errors.push({ word: result.word, error: dbErr.message });
          console.log(`   ❌ ${result.word} — DB 오류: ${dbErr.message}`);
        }
      }
    } catch (apiErr: any) {
      errorCount += batch.length;
      batch.forEach((w) => errors.push({ word: w.word, error: apiErr.message }));
      console.log(`   ❌ 배치 실패: ${apiErr.message}`);
    }

    // Rate limit 방지 딜레이
    if (bi < batches.length - 1) {
      console.log(`   ⏳ ${DELAY_MS / 1000}초 대기...`);
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  }

  // 최종 결과
  console.log("\n" + "=".repeat(50));
  console.log("📊 최종 결과");
  console.log("=".repeat(50));
  console.log(`✅ 성공: ${successCount}개`);
  console.log(`❌ 실패: ${errorCount}개`);

  if (errors.length > 0) {
    console.log("\n❌ 에러 목록:");
    errors.forEach((e) => console.log(`   ${e.word}: ${e.error}`));
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("Fatal error:", e);
  await prisma.$disconnect();
  process.exit(1);
});
