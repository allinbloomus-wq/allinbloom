"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

const parsePromoForm = (formData: FormData) => {
  const title = String(formData.get("title") || "").trim();
  const subtitle = String(formData.get("subtitle") || "").trim();
  const image = String(formData.get("image") || "").trim();
  const link = String(formData.get("link") || "").trim();
  const position = Number(formData.get("position") || 0);

  return {
    title,
    subtitle: subtitle || null,
    image,
    link: link || null,
    position: Number.isFinite(position) ? position : 0,
    isActive: formData.get("isActive") === "on",
  };
};

export async function createPromoSlide(formData: FormData) {
  await requireAdmin();
  const data = parsePromoForm(formData);
  await prisma.promoSlide.create({ data });
  revalidatePath("/");
  revalidatePath("/admin/promotions");
  redirect("/admin/promotions");
}

export async function updatePromoSlide(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const data = parsePromoForm(formData);
  await prisma.promoSlide.update({ where: { id }, data });
  revalidatePath("/");
  revalidatePath("/admin/promotions");
  redirect("/admin/promotions");
}

export async function deletePromoSlide(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  await prisma.promoSlide.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/admin/promotions");
}
