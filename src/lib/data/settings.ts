import type { StoreSettings } from "@prisma/client";
import { prisma } from "@/lib/db";

const DEFAULT_SETTINGS: Omit<StoreSettings, "updatedAt"> = {
  id: "default",
  globalDiscountPercent: 0,
  globalDiscountNote: null,
  categoryDiscountPercent: 0,
  categoryDiscountNote: null,
  categoryFlowerType: null,
  categoryStyle: null,
  categoryMixed: null,
  categoryColor: null,
  categoryMinPriceCents: null,
  categoryMaxPriceCents: null,
  firstOrderDiscountPercent: 10,
  firstOrderDiscountNote: "Скидка 10% на первый заказ",
};

export async function getStoreSettings(): Promise<StoreSettings> {
  return prisma.storeSettings.upsert({
    where: { id: "default" },
    update: {},
    create: DEFAULT_SETTINGS,
  });
}

export async function updateStoreSettings(
  data: Partial<Omit<StoreSettings, "id" | "updatedAt">>
) {
  return prisma.storeSettings.update({
    where: { id: "default" },
    data,
  });
}
