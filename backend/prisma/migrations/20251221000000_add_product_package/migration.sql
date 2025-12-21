-- CreateEnum
CREATE TYPE "PurchaseStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REFUNDED');

-- CreateTable
CREATE TABLE "ProductPackage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "shortDesc" TEXT,
    "price" INTEGER NOT NULL,
    "originalPrice" INTEGER,
    "durationDays" INTEGER NOT NULL,
    "badge" TEXT,
    "badgeColor" TEXT,
    "imageUrl" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isComingSoon" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductPackageWord" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductPackageWord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPurchase" (
    "id" TEXT NOT NULL,
    "visibleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "paymentId" TEXT,
    "amount" INTEGER NOT NULL,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" "PurchaseStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductPackage_slug_key" ON "ProductPackage"("slug");

-- CreateIndex
CREATE INDEX "ProductPackage_isActive_idx" ON "ProductPackage"("isActive");

-- CreateIndex
CREATE INDEX "ProductPackage_displayOrder_idx" ON "ProductPackage"("displayOrder");

-- CreateIndex
CREATE INDEX "ProductPackageWord_packageId_idx" ON "ProductPackageWord"("packageId");

-- CreateIndex
CREATE INDEX "ProductPackageWord_wordId_idx" ON "ProductPackageWord"("wordId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductPackageWord_packageId_wordId_key" ON "ProductPackageWord"("packageId", "wordId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPurchase_visibleId_key" ON "UserPurchase"("visibleId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPurchase_paymentId_key" ON "UserPurchase"("paymentId");

-- CreateIndex
CREATE INDEX "UserPurchase_userId_idx" ON "UserPurchase"("userId");

-- CreateIndex
CREATE INDEX "UserPurchase_packageId_idx" ON "UserPurchase"("packageId");

-- CreateIndex
CREATE INDEX "UserPurchase_expiresAt_idx" ON "UserPurchase"("expiresAt");

-- CreateIndex
CREATE INDEX "UserPurchase_status_idx" ON "UserPurchase"("status");

-- AddForeignKey
ALTER TABLE "ProductPackageWord" ADD CONSTRAINT "ProductPackageWord_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "ProductPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductPackageWord" ADD CONSTRAINT "ProductPackageWord_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPurchase" ADD CONSTRAINT "UserPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPurchase" ADD CONSTRAINT "UserPurchase_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "ProductPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPurchase" ADD CONSTRAINT "UserPurchase_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
