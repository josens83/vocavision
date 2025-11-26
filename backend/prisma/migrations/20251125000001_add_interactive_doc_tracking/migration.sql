-- ============================================
-- Interactive Documentation Tracking Migration
-- ============================================
-- Adds support for n8n-style interactive word documentation
-- with step-by-step progress tracking and completion analytics
--
-- Phase 10-1: Interactive Word Documentation System
-- ============================================

-- Add INTERACTIVE_DOC to LearningMethod enum
ALTER TYPE "LearningMethod" ADD VALUE IF NOT EXISTS 'INTERACTIVE_DOC';

-- ============================================
-- Interactive Documentation Progress Table
-- ============================================
-- Tracks individual step progress for each user-word combination

CREATE TABLE IF NOT EXISTS "InteractiveDocProgress" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  "wordId" TEXT NOT NULL,
  "stepId" TEXT NOT NULL,
  "stepNumber" INTEGER NOT NULL,

  -- Progress tracking
  "started" BOOLEAN NOT NULL DEFAULT false,
  "completed" BOOLEAN NOT NULL DEFAULT false,
  "timeSpent" INTEGER NOT NULL DEFAULT 0,
  "interactions" INTEGER NOT NULL DEFAULT 0,
  "score" DOUBLE PRECISION,

  -- Timestamps
  "startedAt" TIMESTAMP,
  "completedAt" TIMESTAMP,
  "lastInteraction" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Constraints
  UNIQUE("userId", "wordId", "stepId")
);

-- Create indexes for InteractiveDocProgress
CREATE INDEX IF NOT EXISTS "InteractiveDocProgress_userId_idx"
  ON "InteractiveDocProgress"("userId");

CREATE INDEX IF NOT EXISTS "InteractiveDocProgress_wordId_idx"
  ON "InteractiveDocProgress"("wordId");

CREATE INDEX IF NOT EXISTS "InteractiveDocProgress_userId_wordId_idx"
  ON "InteractiveDocProgress"("userId", "wordId");

CREATE INDEX IF NOT EXISTS "InteractiveDocProgress_completed_idx"
  ON "InteractiveDocProgress"("completed");

-- Composite index for queries filtering by user and completion status
CREATE INDEX IF NOT EXISTS "InteractiveDocProgress_userId_completed_idx"
  ON "InteractiveDocProgress"("userId", "completed");

-- ============================================
-- Interactive Documentation Completion Table
-- ============================================
-- Tracks overall completion stats for each user-word combination

CREATE TABLE IF NOT EXISTS "InteractiveDocCompletion" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  "wordId" TEXT NOT NULL,

  -- Completion stats
  "stepsCompleted" INTEGER NOT NULL DEFAULT 0,
  "totalSteps" INTEGER NOT NULL DEFAULT 5,
  "totalTimeSpent" INTEGER NOT NULL DEFAULT 0,
  "averageScore" DOUBLE PRECISION,
  "completionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,

  -- Status
  "isCompleted" BOOLEAN NOT NULL DEFAULT false,
  "completedAt" TIMESTAMP,
  "lastAccessedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Constraints
  UNIQUE("userId", "wordId")
);

-- Create indexes for InteractiveDocCompletion
CREATE INDEX IF NOT EXISTS "InteractiveDocCompletion_userId_idx"
  ON "InteractiveDocCompletion"("userId");

CREATE INDEX IF NOT EXISTS "InteractiveDocCompletion_wordId_idx"
  ON "InteractiveDocCompletion"("wordId");

CREATE INDEX IF NOT EXISTS "InteractiveDocCompletion_isCompleted_idx"
  ON "InteractiveDocCompletion"("isCompleted");

-- Composite index for analytics queries
CREATE INDEX IF NOT EXISTS "InteractiveDocCompletion_userId_isCompleted_idx"
  ON "InteractiveDocCompletion"("userId", "isCompleted");

-- Partial index for completed documents only (for leaderboards)
CREATE INDEX IF NOT EXISTS "InteractiveDocCompletion_completed_stats_idx"
  ON "InteractiveDocCompletion"("userId", "totalTimeSpent", "averageScore")
  WHERE "isCompleted" = true;

-- ============================================
-- Functions for Auto-updating Completion Stats
-- ============================================

-- Function to update InteractiveDocCompletion when step progress changes
CREATE OR REPLACE FUNCTION update_interactive_doc_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Update or insert completion record
  INSERT INTO "InteractiveDocCompletion" (
    "userId",
    "wordId",
    "stepsCompleted",
    "totalTimeSpent",
    "averageScore",
    "completionRate",
    "isCompleted",
    "completedAt",
    "lastAccessedAt",
    "updatedAt"
  )
  SELECT
    NEW."userId",
    NEW."wordId",
    COUNT(CASE WHEN "completed" = true THEN 1 END) as steps_completed,
    SUM("timeSpent") as total_time,
    AVG("score") FILTER (WHERE "score" IS NOT NULL) as avg_score,
    (COUNT(CASE WHEN "completed" = true THEN 1 END)::FLOAT / 5.0 * 100) as completion_rate,
    (COUNT(CASE WHEN "completed" = true THEN 1 END) = 5) as is_completed,
    CASE
      WHEN COUNT(CASE WHEN "completed" = true THEN 1 END) = 5
      THEN CURRENT_TIMESTAMP
      ELSE NULL
    END as completed_at,
    CURRENT_TIMESTAMP as last_accessed,
    CURRENT_TIMESTAMP as updated
  FROM "InteractiveDocProgress"
  WHERE "userId" = NEW."userId" AND "wordId" = NEW."wordId"
  GROUP BY "userId", "wordId"
  ON CONFLICT ("userId", "wordId") DO UPDATE SET
    "stepsCompleted" = EXCLUDED."stepsCompleted",
    "totalTimeSpent" = EXCLUDED."totalTimeSpent",
    "averageScore" = EXCLUDED."averageScore",
    "completionRate" = EXCLUDED."completionRate",
    "isCompleted" = EXCLUDED."isCompleted",
    "completedAt" = EXCLUDED."completedAt",
    "lastAccessedAt" = EXCLUDED."lastAccessedAt",
    "updatedAt" = EXCLUDED."updatedAt";

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update completion stats
DROP TRIGGER IF EXISTS update_completion_trigger ON "InteractiveDocProgress";
CREATE TRIGGER update_completion_trigger
  AFTER INSERT OR UPDATE ON "InteractiveDocProgress"
  FOR EACH ROW
  EXECUTE FUNCTION update_interactive_doc_completion();

-- ============================================
-- Utility Views
-- ============================================

-- View for user progress summary
CREATE OR REPLACE VIEW interactive_doc_user_summary AS
SELECT
  u."id" as user_id,
  u."email",
  COUNT(DISTINCT idc."wordId") as words_started,
  COUNT(DISTINCT CASE WHEN idc."isCompleted" = true THEN idc."wordId" END) as words_completed,
  COALESCE(SUM(idc."totalTimeSpent"), 0) as total_time_spent,
  COALESCE(AVG(idc."averageScore"), 0) as overall_average_score,
  COALESCE(AVG(idc."completionRate"), 0) as average_completion_rate
FROM "User" u
LEFT JOIN "InteractiveDocCompletion" idc ON u."id" = idc."userId"
GROUP BY u."id", u."email";

-- View for word popularity in interactive docs
CREATE OR REPLACE VIEW interactive_doc_word_stats AS
SELECT
  w."id" as word_id,
  w."word",
  COUNT(DISTINCT idc."userId") as total_users,
  COUNT(DISTINCT CASE WHEN idc."isCompleted" = true THEN idc."userId" END) as completed_users,
  COALESCE(AVG(idc."totalTimeSpent"), 0) as avg_time_spent,
  COALESCE(AVG(idc."averageScore"), 0) as avg_score,
  COALESCE(AVG(idc."completionRate"), 0) as avg_completion_rate
FROM "Word" w
LEFT JOIN "InteractiveDocCompletion" idc ON w."id" = idc."wordId"
GROUP BY w."id", w."word";

-- ============================================
-- Sample Queries for Analytics
-- ============================================

-- Get user's progress for a specific word
/*
SELECT
  p.*,
  s.title as step_title
FROM "InteractiveDocProgress" p
WHERE p."userId" = 'user_id_here'
  AND p."wordId" = 'word_id_here'
ORDER BY p."stepNumber";
*/

-- Get completion stats for a user
/*
SELECT *
FROM "InteractiveDocCompletion"
WHERE "userId" = 'user_id_here'
ORDER BY "lastAccessedAt" DESC;
*/

-- Get leaderboard by completion rate
/*
SELECT
  u."email",
  COUNT(DISTINCT idc."wordId") as words_completed,
  AVG(idc."averageScore") as avg_score,
  SUM(idc."totalTimeSpent") as total_time
FROM "User" u
JOIN "InteractiveDocCompletion" idc ON u."id" = idc."userId"
WHERE idc."isCompleted" = true
GROUP BY u."id", u."email"
ORDER BY words_completed DESC, avg_score DESC
LIMIT 10;
*/

-- Get words with highest completion rates
/*
SELECT
  w."word",
  COUNT(DISTINCT idc."userId") FILTER (WHERE idc."isCompleted" = true)::FLOAT /
    NULLIF(COUNT(DISTINCT idc."userId"), 0) * 100 as completion_percentage,
  AVG(idc."totalTimeSpent") as avg_time,
  AVG(idc."averageScore") as avg_score
FROM "Word" w
LEFT JOIN "InteractiveDocCompletion" idc ON w."id" = idc."wordId"
GROUP BY w."id", w."word"
HAVING COUNT(DISTINCT idc."userId") > 5
ORDER BY completion_percentage DESC
LIMIT 20;
*/

-- ============================================
-- Analyze Tables
-- ============================================

ANALYZE "InteractiveDocProgress";
ANALYZE "InteractiveDocCompletion";

-- ============================================
-- Migration Complete
-- ============================================
-- Interactive documentation tracking is now ready!
-- Users can now track their progress through n8n-style
-- step-by-step word learning experiences.
