-- EBS 교재별 레벨 분류 지원
-- 기존: @@unique([wordId, examCategory]) → 단어당 시험 하나의 레벨만
-- 변경: @@unique([wordId, examCategory, level]) → 같은 단어가 EBS 내 여러 교재에 속할 수 있음

-- 기존 unique constraint 삭제
ALTER TABLE "WordExamLevel" DROP CONSTRAINT IF EXISTS "WordExamLevel_wordId_examCategory_key";

-- 새 composite unique constraint 추가 (level 포함)
CREATE UNIQUE INDEX "WordExamLevel_wordId_examCategory_level_key" ON "WordExamLevel"("wordId", "examCategory", "level");
