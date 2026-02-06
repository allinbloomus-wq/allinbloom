import { prisma } from "@/lib/db";

export async function getActivePromoSlides() {
  return prisma.promoSlide.findMany({
    where: { isActive: true },
    orderBy: { position: "asc" },
    select: {
      id: true,
      title: true,
      subtitle: true,
      image: true,
      link: true,
    },
  });
}

export async function getAdminPromoSlides() {
  return prisma.promoSlide.findMany({
    orderBy: [{ position: "asc" }, { updatedAt: "desc" }],
  });
}

export async function getPromoSlideById(id: string) {
  return prisma.promoSlide.findUnique({ where: { id } });
}
