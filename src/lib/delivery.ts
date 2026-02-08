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
  formattedAddress: string; // Добавляем валидированный адрес от Google
};

type DeliveryQuoteError = {
  ok: false;
  error: string;
};

export type DeliveryQuote = DeliveryQuoteOk | DeliveryQuoteError;

// Валидация формата адреса
function validateAddressFormat(address: string): { valid: boolean; error?: string } {
  const trimmed = address.trim();
  
  // Минимальная длина
  if (trimmed.length < 10) {
    return { valid: false, error: "Address is too short. Please provide a complete address." };
  }
  
  // Должна быть хотя бы одна цифра (номер дома)
  if (!/\d/.test(trimmed)) {
    return { valid: false, error: "Please include a street number." };
  }
  
  // Должна быть хотя бы одна запятая (разделитель между частями адреса)
  if (!trimmed.includes(',')) {
    return { valid: false, error: "Please provide a complete address with city and state (e.g., 123 Main St, Chicago, IL)." };
  }
  
  return { valid: true };
}

// Валидация геокодинга через Google Geocoding API
async function validateAndGeocodeAddress(
  address: string,
  apiKey: string
): Promise<{
  valid: boolean;
  error?: string;
  formattedAddress?: string;
  placeId?: string;
}> {
  try {
    const params = new URLSearchParams({
      address: address,
      key: apiKey,
    });

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`
    );

    if (!response.ok) {
      return { valid: false, error: "Unable to validate address." };
    }

    const data = (await response.json()) as {
      status?: string;
      results?: Array<{
        formatted_address?: string;
        place_id?: string;
        types?: string[];
        address_components?: Array<{
          types?: string[];
          short_name?: string;
        }>;
      }>;
    };

    if (data.status === "ZERO_RESULTS") {
      return { valid: false, error: "Address not found. Please check and try again." };
    }

    if (data.status !== "OK" || !data.results || data.results.length === 0) {
      return { valid: false, error: "Unable to validate address." };
    }

    const result = data.results[0];
    
    // Проверяем, что это конкретный адрес, а не регион/город/страна
    const types = result.types || [];
    const isVagueLocation = types.some(type => 
      ['country', 'administrative_area_level_1', 'administrative_area_level_2', 'locality'].includes(type)
    ) && !types.includes('street_address') && !types.includes('premise');

    if (isVagueLocation) {
      return { 
        valid: false, 
        error: "Please provide a complete street address, not just a city or region." 
      };
    }

    // Проверяем наличие номера дома
    const hasStreetNumber = result.address_components?.some(
      component => component.types?.includes('street_number')
    );

    if (!hasStreetNumber) {
      return { 
        valid: false, 
        error: "Please include a street number in your address." 
      };
    }

    // Проверяем наличие улицы
    const hasRoute = result.address_components?.some(
      component => component.types?.includes('route')
    );

    if (!hasRoute) {
      return { 
        valid: false, 
        error: "Please include a street name in your address." 
      };
    }

    return {
      valid: true,
      formattedAddress: result.formatted_address,
      placeId: result.place_id,
    };
  } catch (error) {
    return { valid: false, error: "Network error. Please try again." };
  }
}

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

  // Шаг 1: Базовая валидация формата
  const formatValidation = validateAddressFormat(address);
  if (!formatValidation.valid) {
    return { ok: false, error: formatValidation.error! };
  }

  // Шаг 2: Валидация через Geocoding API
  const geocodeValidation = await validateAndGeocodeAddress(address, apiKey);
  if (!geocodeValidation.valid) {
    return { ok: false, error: geocodeValidation.error! };
  }

  const baseAddress = getBaseAddress();
  
  // Шаг 3: Расчет расстояния
  try {
    const params = new URLSearchParams({
      origins: baseAddress,
      destinations: geocodeValidation.formattedAddress!, // Используем валидированный адрес
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
      return { ok: false, error: "Address not reachable for delivery." };
    }

    const meters = element.distance?.value;
    if (typeof meters !== "number") {
      return { ok: false, error: "Unable to calculate delivery distance." };
    }

    const miles = Math.round((meters / 1609.344) * 100) / 100;
    const feeCents = getDeliveryFeeCents(miles);
    
    if (feeCents === null) {
      const maxMiles = DELIVERY_TIERS[DELIVERY_TIERS.length - 1].maxMiles;
      return {
        ok: false,
        error: `Delivery is available within ${maxMiles} miles of our studio. Your address is ${miles.toFixed(1)} miles away.`,
      };
    }

    const distanceText = element.distance?.text || `${miles.toFixed(1)} mi`;

    return {
      ok: true,
      miles,
      distanceText,
      feeCents,
      baseAddress,
      formattedAddress: geocodeValidation.formattedAddress!,
    };
  } catch (error) {
    return { ok: false, error: "Network error. Please try again." };
  }
}