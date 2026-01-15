-- AlterTable: Add googleId to User for Google OAuth
ALTER TABLE "User" ADD COLUMN "googleId" TEXT;

-- CreateIndex: Unique constraint on googleId
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");
