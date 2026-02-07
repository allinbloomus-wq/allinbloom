const DEFAULT_BASE_ADDRESS =
  "1995 Hicks Rd, Rolling Meadows, IL 60008, USA";

const DELIVERY_TIERS = [
  { maxMiles: 10, feeCents: 0 },
  { maxMiles: 20, feeCents: 1500 },
  { maxMiles: 30, feeCents: 3000 },
];

type DeliveryQuoteOk = {
  ok: true;
  miles: number;
  distanceText: string;
  feeCents: number;
  baseAddress: string;
};

type DeliveryQuoteError = {
  ok: false;
  error: string;
};

export type DeliveryQuote = DeliveryQuoteOk | DeliveryQuoteError;

export function getBaseAddress() {
  return process.env.DELIVERY_BASE_ADDRESS?.trim() || DEFAULT_BASE_ADDRESS;
}

export function getDeliveryFeeCents(miles: number) {
  for (const tier of DELIVERY_TIERS) {
    if (miles <= tier.maxMiles) return tier.feeCents;
  }
  return null;
}

export async function getDeliveryQuote(
  rawAddress: string
): Promise<DeliveryQuote> {
  const address = rawAddress.trim();
  if (!address) {
    return { ok: false, error: "Delivery address is required." };
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "Delivery is not configured." };
  }

  const baseAddress = getBaseAddress();
  const params = new URLSearchParams({
    origins: baseAddress,
    destinations: address,
    units: "imperial",
    key: apiKey,
  });

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/distancematrix/json?${params.toString()}`
  );

  if (!response.ok) {
    return { ok: false, error: "Unable to calculate delivery distance." };
  }

  const data = (await response.json()) as {
    status?: string;
    rows?: Array<{
      elements?: Array<{
        status?: string;
        distance?: { text?: string; value?: number };
      }>;
    }>;
  };

  if (data.status !== "OK") {
    return { ok: false, error: "Unable to calculate delivery distance." };
  }

  const element = data.rows?.[0]?.elements?.[0];
  if (!element || element.status !== "OK") {
    return { ok: false, error: "Address not found or unreachable." };
  }

  const meters = element.distance?.value;
  if (typeof meters !== "number") {
    return { ok: false, error: "Unable to calculate delivery distance." };
  }

  const miles = meters / 1609.344;
  const feeCents = getDeliveryFeeCents(miles);
  if (feeCents === null) {
    return {
      ok: false,
      error: "Delivery is available within 30 miles of our studio.",
    };
  }

  const distanceText = element.distance?.text || `${miles.toFixed(1)} mi`;

  return {
    ok: true,
    miles,
    distanceText,
    feeCents,
    baseAddress,
  };
}
