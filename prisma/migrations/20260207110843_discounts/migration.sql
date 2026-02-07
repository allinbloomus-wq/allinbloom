-- AlterTable
ALTER TABLE "Bouquet" ADD COLUMN     "discountNote" TEXT,
ADD COLUMN     "discountPercent" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "StoreSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "globalDiscountPercent" INTEGER NOT NULL DEFAULT 0,
    "globalDiscountNote" TEXT,
    "firstOrderDiscountPercent" INTEGER NOT NULL DEFAULT 10,
    "firstOrderDiscountNote" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreSettings_pkey" PRIMARY KEY ("id")
);
