import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Running startup script...');

  // Check if database has any words
  try {
    const wordCount = await prisma.word.count();
    console.log(`📊 Current word count: ${wordCount}`);

    if (wordCount === 0) {
      console.log('📭 Database is empty. Running seed...');

      // Run the seed script
      execSync('npx tsx prisma/seed.ts', {
        stdio: 'inherit',
        cwd: process.cwd()
      });

      console.log('✅ Seed completed!');
    } else {
      console.log('✅ Database already has data. Skipping seed.');
    }
  } catch (error) {
    console.error('❌ Startup error:', error);
    // Don't exit with error - let the server start anyway
    // The tables might not exist yet on first run after db push
  } finally {
    await prisma.$disconnect();
  }
}

main();
