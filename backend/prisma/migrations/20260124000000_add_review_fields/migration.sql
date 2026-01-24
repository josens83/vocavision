-- AlterTable: Add review tracking fields to UserProgress
ALTER TABLE "UserProgress" ADD COLUMN IF NOT EXISTS "needsReview" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "UserProgress" ADD COLUMN IF NOT EXISTS "reviewCorrectCount" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex for UserProgress.needsReview
CREATE INDEX IF NOT EXISTS "UserProgress_needsReview_idx" ON "UserProgress"("needsReview");

-- CreateEnum: LearningSessionStatus
DO $$ BEGIN
    CREATE TYPE "LearningSessionStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable: LearningSession
CREATE TABLE IF NOT EXISTS "LearningSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "examCategory" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "wordOrder" TEXT NOT NULL,
    "totalWords" INTEGER NOT NULL,
    "currentSet" INTEGER NOT NULL DEFAULT 0,
    "currentIndex" INTEGER NOT NULL DEFAULT 0,
    "status" "LearningSessionStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "completedSets" INTEGER NOT NULL DEFAULT 0,
    "totalReviewed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: LearningSession indexes
CREATE INDEX IF NOT EXISTS "LearningSession_userId_idx" ON "LearningSession"("userId");
CREATE INDEX IF NOT EXISTS "LearningSession_examCategory_level_idx" ON "LearningSession"("examCategory", "level");
CREATE INDEX IF NOT EXISTS "LearningSession_status_idx" ON "LearningSession"("status");
CREATE UNIQUE INDEX IF NOT EXISTS "LearningSession_userId_examCategory_level_status_key" ON "LearningSession"("userId", "examCategory", "level", "status");
