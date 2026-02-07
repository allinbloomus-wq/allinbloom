-- AlterTable
ALTER TABLE "StoreSettings" ADD COLUMN     "categoryColor" TEXT,
ADD COLUMN     "categoryDiscountNote" TEXT,
ADD COLUMN     "categoryDiscountPercent" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "categoryFlowerType" TEXT,
ADD COLUMN     "categoryMaxPriceCents" INTEGER,
ADD COLUMN     "categoryMinPriceCents" INTEGER,
ADD COLUMN     "categoryMixed" TEXT,
ADD COLUMN     "categoryStyle" TEXT;
