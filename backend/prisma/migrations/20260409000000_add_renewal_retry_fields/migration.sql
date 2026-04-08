-- AlterTable
ALTER TABLE "User" ADD COLUMN "renewalRetryCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "lastRenewalAttempt" TIMESTAMP(3);
