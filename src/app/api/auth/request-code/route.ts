import { NextResponse } from "next/server";
import { requestEmailCode } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = String(body?.email || "")
    .toLowerCase()
    .trim();

  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { error: "Please provide a valid email address." },
      { status: 400 }
    );
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    await requestEmailCode(email);
    return NextResponse.json({ ok: true, isNew: !existingUser });
  } catch (error) {
    console.error("Failed to send email code", error);
    return NextResponse.json(
      { error: "Unable to send verification code." },
      { status: 500 }
    );
  }
}
