import { prisma } from "@/lib/db";

export async function getAdminOrders() {
  return prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });
}

export async function getOrderById(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });
}

export async function getOrdersByEmail(email: string) {
  return prisma.order.findMany({
    where: { email },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });
}

export async function countOrdersByEmail(email: string) {
  return prisma.order.count({ where: { email } });
}
