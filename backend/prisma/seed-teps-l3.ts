/**
 * TEPS L3 (고급 500-600점) Words Seed Script
 *
 * Run with: npx tsx prisma/seed-teps-l3.ts
 */

import { PrismaClient, ExamCategory } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface TepsData {
  exam: string;
  totalWords: number;
  levels: {
    L3: {
      count: number;
      description: string;
      words: string[];
    };
  };
}

async function main() {
  console.log('Starting TEPS L3 word seed...');

  // Load words from JSON file
  const dataPath = path.join(__dirname, '../data/teps-words.json');
  const jsonData = JSON.parse(fs.readFileSync(dataPath, 'utf-8')) as TepsData;
  const TEPS_L3_WORDS = jsonData.levels.L3.words;

  console.log(`Total words to process: ${TEPS_L3_WORDS.length}`);

  const examCategory: ExamCategory = 'TEPS';
  const level = 'L3';
  const difficulty = 'ADVANCED';

  // Get existing words
  const existingWords = await prisma.word.findMany({
    where: { word: { in: TEPS_L3_WORDS } },
    select: {
      id: true,
      word: true,
      aiGeneratedAt: true,
      examLevels: { select: { examCategory: true } },
    },
  });

  const existingMap = new Map(existingWords.map(w => [w.word.toLowerCase(), w]));
  console.log(`Found ${existingWords.length} existing words`);

  const newWordTexts: string[] = [];
  const mappingsToAdd: { wordId: string; word: string }[] = [];
  const alreadyMapped: string[] = [];

  for (const wordText of TEPS_L3_WORDS) {
    const normalized = wordText.toLowerCase().trim();
    const existing = existingMap.get(normalized);

    if (!existing) {
      newWordTexts.push(normalized);
    } else {
      const hasMapping = existing.examLevels.some(el => el.examCategory === examCategory);
      if (hasMapping) {
        alreadyMapped.push(normalized);
      } else {
        mappingsToAdd.push({ wordId: existing.id, word: normalized });
      }
    }
  }

  console.log(`\nAnalysis:`);
  console.log(`- New words to create: ${newWordTexts.length}`);
  console.log(`- Existing words to add mapping: ${mappingsToAdd.length}`);
  console.log(`- Already mapped (skip): ${alreadyMapped.length}`);

  // Create new words in batches of 100
  if (newWordTexts.length > 0) {
    console.log(`\nCreating ${newWordTexts.length} new words...`);

    const batchSize = 100;
    for (let i = 0; i < newWordTexts.length; i += batchSize) {
      const batch = newWordTexts.slice(i, i + batchSize);

      await prisma.word.createMany({
        data: batch.map(word => ({
          word,
          definition: '',
          partOfSpeech: 'NOUN',
          examCategory,
          difficulty,
          level,
          frequency: 100,
          status: 'DRAFT',
        })),
        skipDuplicates: true,
      });

      console.log(`  Created batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(newWordTexts.length / batchSize)}`);
    }

    // Get newly created words for exam level mapping
    const newlyCreated = await prisma.word.findMany({
      where: { word: { in: newWordTexts } },
      select: { id: true, word: true },
    });

    // Create WordExamLevel mappings for new words
    if (newlyCreated.length > 0) {
      console.log(`Creating ${newlyCreated.length} exam mappings for new words...`);

      for (let i = 0; i < newlyCreated.length; i += batchSize) {
        const batch = newlyCreated.slice(i, i + batchSize);

        await prisma.wordExamLevel.createMany({
          data: batch.map(w => ({
            wordId: w.id,
            examCategory,
            level,
            frequency: 0,
          })),
          skipDuplicates: true,
        });
      }
    }
  }

  // Add exam mappings for existing words
  if (mappingsToAdd.length > 0) {
    console.log(`\nAdding ${mappingsToAdd.length} exam mappings to existing words...`);

    const batchSize = 100;
    for (let i = 0; i < mappingsToAdd.length; i += batchSize) {
      const batch = mappingsToAdd.slice(i, i + batchSize);

      await prisma.wordExamLevel.createMany({
        data: batch.map(m => ({
          wordId: m.wordId,
          examCategory,
          level,
          frequency: 0,
        })),
        skipDuplicates: true,
      });
    }
  }

  // Final count
  const finalCount = await prisma.word.count({
    where: {
      examLevels: {
        some: { examCategory, level },
      },
    },
  });

  console.log(`\n=== Seed Complete ===`);
  console.log(`Total TEPS-L3 words in database: ${finalCount}`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
