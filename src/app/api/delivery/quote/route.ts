import { NextResponse } from "next/server";
import { getDeliveryQuote } from "@/lib/delivery";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const address = String(body?.address || "").trim();

  if (!address) {
    return NextResponse.json(
      { error: "Please enter a delivery address." },
      { status: 400 }
    );
  }

  const quote = await getDeliveryQuote(address);
  if (!quote.ok) {
    return NextResponse.json({ error: quote.error }, { status: 400 });
  }

  return NextResponse.json({
    miles: quote.miles,
    distanceText: quote.distanceText,
    feeCents: quote.feeCents,
    baseAddress: quote.baseAddress,
  });
}
