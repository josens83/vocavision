-- Migration: add_word_visual_model
-- 3-이미지 시각화 시스템을 위한 WordVisual 모델 추가

-- 1. VisualType enum 생성
DO $$ BEGIN
    CREATE TYPE "VisualType" AS ENUM ('CONCEPT', 'MNEMONIC', 'RHYME');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. WordVisual 테이블 생성
CREATE TABLE IF NOT EXISTS "WordVisual" (
    "id" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "type" "VisualType" NOT NULL,
    "labelEn" TEXT,
    "labelKo" TEXT,
    "captionEn" TEXT,
    "captionKo" TEXT,
    "imageUrl" TEXT,
    "promptEn" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WordVisual_pkey" PRIMARY KEY ("id")
);

-- 3. Unique constraint (wordId + type)
DO $$ BEGIN
    ALTER TABLE "WordVisual" ADD CONSTRAINT "WordVisual_wordId_type_key" UNIQUE ("wordId", "type");
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 4. Index on wordId
CREATE INDEX IF NOT EXISTS "WordVisual_wordId_idx" ON "WordVisual"("wordId");

-- 5. Foreign key constraint
DO $$ BEGIN
    ALTER TABLE "WordVisual" ADD CONSTRAINT "WordVisual_wordId_fkey"
        FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 6. 기존 인라인 필드에서 데이터 마이그레이션 (있다면)
-- 참고: 기존 imageConceptUrl, imageMnemonicUrl, imageRhymeUrl 필드가 있다면 아래 쿼리로 이전
/*
INSERT INTO "WordVisual" ("id", "wordId", "type", "labelKo", "captionKo", "imageUrl", "order", "createdAt", "updatedAt")
SELECT
    gen_random_uuid(),
    id,
    'CONCEPT',
    '의미',
    "imageConceptCaption",
    "imageConceptUrl",
    0,
    NOW(),
    NOW()
FROM "Word"
WHERE "imageConceptUrl" IS NOT NULL;

INSERT INTO "WordVisual" ("id", "wordId", "type", "labelKo", "captionKo", "imageUrl", "order", "createdAt", "updatedAt")
SELECT
    gen_random_uuid(),
    id,
    'MNEMONIC',
    '연상',
    "imageMnemonicCaption",
    "imageMnemonicUrl",
    1,
    NOW(),
    NOW()
FROM "Word"
WHERE "imageMnemonicUrl" IS NOT NULL;

INSERT INTO "WordVisual" ("id", "wordId", "type", "labelKo", "captionKo", "imageUrl", "order", "createdAt", "updatedAt")
SELECT
    gen_random_uuid(),
    id,
    'RHYME',
    '라이밍',
    "imageRhymeCaption",
    "imageRhymeUrl",
    2,
    NOW(),
    NOW()
FROM "Word"
WHERE "imageRhymeUrl" IS NOT NULL;
*/
