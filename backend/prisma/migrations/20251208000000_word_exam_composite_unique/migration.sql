-- Drop existing unique constraint on word field
DROP INDEX IF EXISTS "Word_word_key";

-- Create composite unique constraint on word + examCategory
CREATE UNIQUE INDEX "Word_word_examCategory_key" ON "Word"("word", "examCategory");
