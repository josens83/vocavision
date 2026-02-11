-- DB enum 타입 이름 수정: WordStatus → ContentStatus
-- Prisma 스키마는 ContentStatus를 사용하지만, DB에는 WordStatus로 남아있어 타입 불일치 발생
-- 에러: column "status" is of type "WordStatus" but expression is of type "ContentStatus"

ALTER TYPE "WordStatus" RENAME TO "ContentStatus";
