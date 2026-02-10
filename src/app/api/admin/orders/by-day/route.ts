import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAdminOrdersByDay } from "@/lib/data/orders";
import { getDayRange, parseDayKey } from "@/lib/admin-orders";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const dayKey = url.searchParams.get("date");
  if (!dayKey) {
    return NextResponse.json({ error: "Missing date" }, { status: 400 });
  }

  const parsed = parseDayKey(dayKey);
  const range = parsed ? getDayRange(dayKey) : null;
  if (!range) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const orders = await getAdminOrdersByDay(dayKey);

  return NextResponse.json({ dayKey, orders });
}
