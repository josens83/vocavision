-- Database Performance Optimization Indexes
-- This migration adds indexes for common query patterns to improve performance
-- Run this migration during low-traffic periods

-- ============================================
-- User Table Indexes
-- ============================================

-- Index for subscription queries
CREATE INDEX IF NOT EXISTS "User_subscriptionStatus_idx" ON "User"("subscriptionStatus");

-- Index for active users (last 30 days)
CREATE INDEX IF NOT EXISTS "User_lastActiveDate_idx" ON "User"("lastActiveDate" DESC);

-- Composite index for streak queries
CREATE INDEX IF NOT EXISTS "User_currentStreak_longestStreak_idx" ON "User"("currentStreak" DESC, "longestStreak" DESC);

-- Index for daily goal tracking
CREATE INDEX IF NOT EXISTS "User_dailyGoal_dailyProgress_idx" ON "User"("dailyGoal", "dailyProgress");

-- ============================================
-- Word Table Indexes
-- ============================================

-- Composite index for word search by difficulty and frequency
CREATE INDEX IF NOT EXISTS "Word_difficulty_frequency_idx" ON "Word"("difficulty", "frequency" DESC);

-- Full-text search index for word and definition
CREATE INDEX IF NOT EXISTS "Word_word_trgm_idx" ON "Word" USING gin (word gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Word_definition_trgm_idx" ON "Word" USING gin (definition gin_trgm_ops);

-- Note: Requires pg_trgm extension
-- Run: CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================
-- UserProgress Table Indexes
-- ============================================

-- Index for due reviews (most common query)
CREATE INDEX IF NOT EXISTS "UserProgress_userId_nextReviewDate_idx" ON "UserProgress"("userId", "nextReviewDate");

-- Index for mastery level filtering
CREATE INDEX IF NOT EXISTS "UserProgress_userId_masteryLevel_idx" ON "UserProgress"("userId", "masteryLevel");

-- Index for progress analytics
CREATE INDEX IF NOT EXISTS "UserProgress_userId_correctCount_totalReviews_idx" ON "UserProgress"("userId", "correctCount", "totalReviews");

-- ============================================
-- StudySession Table Indexes
-- ============================================

-- Index for user session history
CREATE INDEX IF NOT EXISTS "StudySession_userId_startTime_idx" ON "StudySession"("userId", "startTime" DESC);

-- Index for session duration analytics
CREATE INDEX IF NOT EXISTS "StudySession_userId_duration_idx" ON "StudySession"("userId", "duration" DESC) WHERE "duration" IS NOT NULL;

-- ============================================
-- Review Table Indexes
-- ============================================

-- Composite index for review analytics
CREATE INDEX IF NOT EXISTS "Review_userId_createdAt_rating_idx" ON "Review"("userId", "createdAt" DESC, "rating");

-- Index for learning method analytics
CREATE INDEX IF NOT EXISTS "Review_userId_learningMethod_idx" ON "Review"("userId", "learningMethod");

-- ============================================
-- Example Table Indexes
-- ============================================

-- No additional indexes needed beyond existing wordId index

-- ============================================
-- WordImage Table Indexes
-- ============================================

-- Index for image source filtering
CREATE INDEX IF NOT EXISTS "WordImage_wordId_source_idx" ON "WordImage"("wordId", "source");

-- ============================================
-- Mnemonic Table Indexes
-- ============================================

-- Composite index for popular mnemonics
CREATE INDEX IF NOT EXISTS "Mnemonic_wordId_rating_idx" ON "Mnemonic"("wordId", "rating" DESC);

-- ============================================
-- Notification Table Indexes
-- ============================================

-- Composite index for unread notifications
CREATE INDEX IF NOT EXISTS "Notification_userId_isRead_createdAt_idx" ON "Notification"("userId", "isRead", "createdAt" DESC);

-- Index for notification type filtering
CREATE INDEX IF NOT EXISTS "Notification_userId_type_idx" ON "Notification"("userId", "type");

-- ============================================
-- Bookmark Table Indexes
-- ============================================

-- Composite index for user bookmarks
CREATE INDEX IF NOT EXISTS "Bookmark_userId_createdAt_idx" ON "Bookmark"("userId", "createdAt" DESC);

-- ============================================
-- Collection Table Indexes
-- ============================================

-- Composite index for public collections
CREATE INDEX IF NOT EXISTS "Collection_isPublic_difficulty_idx" ON "Collection"("isPublic", "difficulty") WHERE "isPublic" = true;

-- ============================================
-- Partial Indexes for Performance
-- ============================================

-- Index for active subscriptions only
CREATE INDEX IF NOT EXISTS "User_active_subscription_idx" ON "User"("id", "subscriptionEnd")
  WHERE "subscriptionStatus" = 'ACTIVE';

-- Index for users with current streak
CREATE INDEX IF NOT EXISTS "User_active_streak_idx" ON "User"("id", "currentStreak")
  WHERE "currentStreak" > 0;

-- Index for mastered words only
CREATE INDEX IF NOT EXISTS "UserProgress_mastered_idx" ON "UserProgress"("userId", "wordId")
  WHERE "masteryLevel" = 'MASTERED';

-- ============================================
-- Indexes for Common JOIN Queries
-- ============================================

-- Cover index for user progress with word details
CREATE INDEX IF NOT EXISTS "UserProgress_userId_wordId_masteryLevel_idx"
  ON "UserProgress"("userId", "wordId", "masteryLevel");

-- ============================================
-- Statistics
-- ============================================

-- Analyze tables to update statistics
ANALYZE "User";
ANALYZE "Word";
ANALYZE "UserProgress";
ANALYZE "StudySession";
ANALYZE "Review";
ANALYZE "Example";
ANALYZE "WordImage";
ANALYZE "Mnemonic";
ANALYZE "Notification";
ANALYZE "Bookmark";
ANALYZE "Collection";

-- ============================================
-- Verification Queries
-- ============================================

-- Check index usage (run after indexes are created)
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY idx_scan DESC;

-- Check table sizes
-- SELECT schemaname, tablename,
--        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check unused indexes (run after some time in production)
-- SELECT schemaname, tablename, indexname, idx_scan
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public' AND idx_scan = 0
-- ORDER BY pg_relation_size(indexrelid) DESC;
