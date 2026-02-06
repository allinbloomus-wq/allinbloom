import type { Bouquet, BouquetStyle, FlowerType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { BOUQUET_STYLES, FLOWER_TYPES } from "@/lib/constants";

export type CatalogSearchParams = {
  flower?: string;
  color?: string;
  style?: string;
  mixed?: string;
  min?: string;
  max?: string;
  filter?: string;
};

const toNumber = (value?: string) => {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const normalizeEnum = <T extends readonly string[]>(
  value: string | undefined,
  allowed: T
) => {
  if (!value) return undefined;
  const upper = value.toUpperCase();
  return (allowed as readonly string[]).includes(upper) ? upper : undefined;
};

export async function getFeaturedBouquets(): Promise<Bouquet[]> {
  return prisma.bouquet.findMany({
    where: { isFeatured: true, isActive: true },
    orderBy: { createdAt: "desc" },
    take: 6,
  });
}

export async function getBouquetById(id: string): Promise<Bouquet | null> {
  return prisma.bouquet.findUnique({ where: { id } });
}

export async function getAdminBouquets(): Promise<Bouquet[]> {
  return prisma.bouquet.findMany({
    orderBy: { updatedAt: "desc" },
  });
}

export async function getBouquets(
  filters: CatalogSearchParams = {}
): Promise<Bouquet[]> {
  const flowerType = normalizeEnum(filters.flower, FLOWER_TYPES);
  const style = normalizeEnum(filters.style, BOUQUET_STYLES);
  const min = toNumber(filters.min);
  const max = toNumber(filters.max);

  const where: Prisma.BouquetWhereInput = {
    isActive: true,
  };

  if (filters.filter === "featured") {
    where.isFeatured = true;
  }

  if (flowerType && flowerType !== "ALL") {
    where.flowerType = flowerType as FlowerType;
  }

  if (style) {
    where.style = style as BouquetStyle;
  }

  if (filters.mixed === "mixed") {
    where.isMixed = true;
  }

  if (filters.mixed === "mono") {
    where.isMixed = false;
  }

  if (min !== undefined || max !== undefined) {
    where.priceCents = {
      ...(min !== undefined ? { gte: Math.round(min * 100) } : {}),
      ...(max !== undefined ? { lte: Math.round(max * 100) } : {}),
    };
  }

  if (filters.color) {
    where.colors = { contains: filters.color.toLowerCase() };
  }

  return prisma.bouquet.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
}
