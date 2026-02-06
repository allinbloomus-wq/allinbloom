import { NextResponse } from "next/server";
import { requestEmailCode } from "@/lib/auth";

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
