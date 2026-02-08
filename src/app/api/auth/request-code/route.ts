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
    const now = new Date();
    const windowStart = new Date(now.getTime() - 15 * 60 * 1000);
    const recentCount = await prisma.verificationCode.count({
      where: { email, createdAt: { gt: windowStart } },
    });

    if (recentCount >= 5) {
      const oldest = await prisma.verificationCode.findFirst({
        where: { email, createdAt: { gt: windowStart } },
        orderBy: { createdAt: "asc" },
      });
      const retryAfterSec = oldest
        ? Math.max(
            1,
            Math.ceil((oldest.createdAt.getTime() + 15 * 60 * 1000 - now.getTime()) / 1000)
          )
        : 15 * 60;
      return NextResponse.json(
        {
          error: "Too many requests. Please try again later.",
          retryAfterSec,
        },
        { status: 429 }
      );
    }

    const lastCode = await prisma.verificationCode.findFirst({
      where: { email },
      orderBy: { createdAt: "desc" },
    });

    if (lastCode && now.getTime() - lastCode.createdAt.getTime() < 20 * 1000) {
      const retryAfterSec = Math.max(
        1,
        Math.ceil((lastCode.createdAt.getTime() + 20 * 1000 - now.getTime()) / 1000)
      );
      return NextResponse.json(
        {
          error: "Please wait a moment before requesting another code.",
          retryAfterSec,
        },
        { status: 429 }
      );
    }

    await requestEmailCode(email);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to send email code", error);
    return NextResponse.json(
      { error: "Unable to send verification code." },
      { status: 500 }
    );
  }
}
