"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { parseBouquetForm } from "@/lib/bouquet-form";
import { requireAdmin } from "@/lib/auth";

export async function createBouquet(formData: FormData) {
  await requireAdmin();
  const data = parseBouquetForm(formData);
  await prisma.bouquet.create({ data });
  revalidatePath("/admin");
  redirect("/admin");
}

export async function updateBouquet(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const data = parseBouquetForm(formData);
  await prisma.bouquet.update({ where: { id }, data });
  revalidatePath("/admin");
  redirect("/admin");
}

export async function deleteBouquet(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  await prisma.bouquet.delete({ where: { id } });
  revalidatePath("/admin");
}
