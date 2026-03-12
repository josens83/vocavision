-- AlterTable: Add isRestart flag to LearningSession
ALTER TABLE "LearningSession" ADD COLUMN IF NOT EXISTS "isRestart" BOOLEAN NOT NULL DEFAULT false;
