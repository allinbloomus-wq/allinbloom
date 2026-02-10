import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orderId = params.id;
  if (!orderId) {
    return NextResponse.json({ error: "Missing order id" }, { status: 400 });
  }

  const existing = await prisma.order.findUnique({
    where: { id: orderId },
    select: { isRead: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { isRead: !existing.isRead },
  });

  return NextResponse.json({ isRead: updated.isRead });
}
