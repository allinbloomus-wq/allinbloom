import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

function parseSince(value: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const since = parseSince(url.searchParams.get("since"));
  const where: {
    status: "PAID";
    createdAt?: { gt: Date };
  } = { status: "PAID" };

  if (since) {
    where.createdAt = { gt: since };
  }

  const count = await prisma.order.count({ where });

  return NextResponse.json({ count });
}
