/**
 * VocaVision Word Seeder
 * CSV 파일에서 단어를 읽어 Word 테이블에 생성합니다.
 *
 * 사용법:
 *   npx ts-node prisma/seed-words.ts [CSV_PATH]
 *
 * 예시:
 *   npx ts-node prisma/seed-words.ts ../data/csat-test-10.csv
 *   npx ts-node prisma/seed-words.ts ../data/teps-words.csv
 */

import { PrismaClient, ExamCategory, CEFRLevel, DifficultyLevel, PartOfSpeech } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// ============================================
// Types
// ============================================

interface WordRow {
  word: string;
  examCategory: string;
  cefrLevel?: string;
  difficulty?: string;
  partOfSpeech: string;
  level?: string;
  tags?: string;
}

interface SeedResult {
  created: number;
  skipped: number;
  failed: number;
  errors: string[];
}

// ============================================
// CSV Parser
// ============================================

function parseCSV(filePath: string): WordRow[] {
  if (!fs.existsSync(filePath)) {
    throw new Error(`CSV file not found: ${filePath}`);
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');

  if (lines.length < 2) {
    throw new Error('CSV file must have at least a header row and one data row');
  }

  const headers = lines[0].split(',').map(h => h.trim());

  // 필수 필드 확인
  const requiredFields = ['word', 'examCategory', 'partOfSpeech'];
  for (const field of requiredFields) {
    if (!headers.includes(field)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  return lines.slice(1).map((line, index) => {
    // CSV 파싱 (쌍따옴표 안의 콤마 처리)
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const row: any = {};
    headers.forEach((header, i) => {
      row[header] = values[i]?.replace(/"/g, '') || '';
    });

    return row as WordRow;
  });
}

// ============================================
// Validators
// ============================================

const VALID_EXAM_CATEGORIES = ['CSAT', 'TEPS', 'TOEIC', 'TOEFL', 'SAT'];
const VALID_CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const VALID_DIFFICULTIES = ['BASIC', 'INTERMEDIATE', 'ADVANCED'];
const VALID_POS = ['NOUN', 'VERB', 'ADJECTIVE', 'ADVERB', 'PRONOUN', 'PREPOSITION', 'CONJUNCTION', 'INTERJECTION'];

function validateRow(row: WordRow): string | null {
  if (!row.word || row.word.length === 0) {
    return 'word is required';
  }

  if (!VALID_EXAM_CATEGORIES.includes(row.examCategory)) {
    return `Invalid examCategory: ${row.examCategory}. Valid values: ${VALID_EXAM_CATEGORIES.join(', ')}`;
  }

  if (row.cefrLevel && !VALID_CEFR_LEVELS.includes(row.cefrLevel)) {
    return `Invalid cefrLevel: ${row.cefrLevel}. Valid values: ${VALID_CEFR_LEVELS.join(', ')}`;
  }

  if (row.difficulty && !VALID_DIFFICULTIES.includes(row.difficulty)) {
    return `Invalid difficulty: ${row.difficulty}. Valid values: ${VALID_DIFFICULTIES.join(', ')}`;
  }

  if (!VALID_POS.includes(row.partOfSpeech)) {
    return `Invalid partOfSpeech: ${row.partOfSpeech}. Valid values: ${VALID_POS.join(', ')}`;
  }

  return null;
}

// ============================================
// Seeder
// ============================================

async function seedWords(csvPath: string): Promise<SeedResult> {
  console.log('\n========================================');
  console.log('🌱 VocaVision Word Seeder');
  console.log('========================================\n');

  console.log(`📂 Reading CSV from: ${csvPath}`);
  const words = parseCSV(csvPath);
  console.log(`📝 Found ${words.length} words to process\n`);

  const result: SeedResult = {
    created: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  for (let i = 0; i < words.length; i++) {
    const row = words[i];
    const wordLower = row.word.toLowerCase().trim();

    // 유효성 검사
    const validationError = validateRow(row);
    if (validationError) {
      console.log(`❌ [${i + 1}] ${row.word}: ${validationError}`);
      result.failed++;
      result.errors.push(`Row ${i + 2}: ${validationError}`);
      continue;
    }

    try {
      // 이미 존재하는지 확인
      const existing = await prisma.word.findFirst({
        where: { word: wordLower },
      });

      if (existing) {
        console.log(`⏭️  [${i + 1}] ${wordLower}: already exists (skipped)`);
        result.skipped++;
        continue;
      }

      // 새 단어 생성
      await prisma.word.create({
        data: {
          word: wordLower,
          definition: '',  // Claude가 생성 예정
          definitionKo: '',
          examCategory: row.examCategory as ExamCategory,
          cefrLevel: (row.cefrLevel || 'B1') as CEFRLevel,
          difficulty: (row.difficulty || 'INTERMEDIATE') as DifficultyLevel,
          partOfSpeech: row.partOfSpeech as PartOfSpeech,
          level: row.level || null,
          tags: row.tags ? row.tags.split(',').map(t => t.trim()) : [],
          status: 'DRAFT',
        },
      });

      console.log(`✅ [${i + 1}] ${wordLower}: created`);
      result.created++;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.log(`❌ [${i + 1}] ${wordLower}: ${errorMsg}`);
      result.failed++;
      result.errors.push(`Row ${i + 2} (${row.word}): ${errorMsg}`);
    }
  }

  // 결과 출력
  console.log('\n========================================');
  console.log('📊 Seed Results');
  console.log('========================================');
  console.log(`✅ Created: ${result.created}`);
  console.log(`⏭️  Skipped: ${result.skipped}`);
  console.log(`❌ Failed:  ${result.failed}`);
  console.log(`📊 Total:   ${words.length}`);
  console.log('========================================\n');

  if (result.errors.length > 0) {
    console.log('⚠️  Errors:');
    result.errors.forEach(err => console.log(`   - ${err}`));
    console.log('');
  }

  return result;
}

// ============================================
// Main
// ============================================

async function main() {
  const csvPath = process.argv[2];

  if (!csvPath) {
    console.error('Usage: npx ts-node prisma/seed-words.ts <CSV_PATH>');
    console.error('Example: npx ts-node prisma/seed-words.ts ../data/csat-test-10.csv');
    process.exit(1);
  }

  const absolutePath = path.isAbsolute(csvPath)
    ? csvPath
    : path.resolve(__dirname, csvPath);

  try {
    const result = await seedWords(absolutePath);

    if (result.failed > 0) {
      console.log('⚠️  Some words failed to seed. Check errors above.\n');
      process.exit(1);
    }

    console.log('🎉 Seeding completed successfully!\n');
    console.log('Next steps:');
    console.log('  1. Run content batch generation:');
    console.log('     POST /api/content/batch');
    console.log('  2. Generate images for mnemonics:');
    console.log('     POST /api/admin/images/generate-batch');
    console.log('  3. Review and publish in Admin UI');
    console.log('');
  } catch (error) {
    console.error('❌ Seeding failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
