"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  loadCheckoutFormStorage,
  saveCheckoutFormStorage,
  useCart,
} from "@/lib/cart";
import {
  clampFlowerQuantity,
  FLOWER_QUANTITY_MAX,
  FLOWER_QUANTITY_MIN,
} from "@/lib/flower-quantity";
import { formatMoney } from "@/lib/format";
import { applyPercentDiscount, getCartItemDiscount } from "@/lib/pricing";
import CheckoutButton from "@/components/checkout-button";
import ImageWithFallback from "@/components/image-with-fallback";

type DiscountInfo = {
  percent: number;
  note: string;
};

type GooglePlaceAddressComponent = {
  long_name?: string;
  short_name?: string;
  types?: string[];
};

type GooglePlaceAddressComponentNew = {
  longText?: string;
  shortText?: string;
  types?: string[];
};

type GooglePlaceResult = {
  formatted_address?: string;
  name?: string;
  address_components?: GooglePlaceAddressComponent[];
};

type GooglePlaceDetailsResult = {
  formattedAddress?: string;
  displayName?: string;
  addressComponents?: GooglePlaceAddressComponentNew[];
  fetchFields: (options: { fields: string[] }) => Promise<unknown>;
};

type GoogleMapsEventListener = {
  remove: () => void;
};

type GoogleAutocompleteInstance = {
  addListener: (
    eventName: "place_changed",
    handler: () => void
  ) => GoogleMapsEventListener;
  getPlace: () => GooglePlaceResult | undefined;
};

type GoogleFormattableText = {
  text?: string;
};

type GoogleAutocompleteSessionTokenInstance = object;

type GooglePlacePrediction = {
  text?: GoogleFormattableText;
  placeId?: string;
  toPlace: () => GooglePlaceDetailsResult;
};

type GoogleAutocompleteSuggestionItem = {
  placePrediction?: GooglePlacePrediction;
};

type GoogleAutocompleteSuggestionRequest = {
  input: string;
  includedRegionCodes?: string[];
  sessionToken?: GoogleAutocompleteSessionTokenInstance;
};

type GoogleAutocompleteSuggestionFetcher = {
  fetchAutocompleteSuggestions: (
    request: GoogleAutocompleteSuggestionRequest
  ) => Promise<{ suggestions?: GoogleAutocompleteSuggestionItem[] }>;
};

type GoogleMapsPlacesNamespace = {
  Autocomplete?: new (
    input: HTMLInputElement,
    options: {
      types: string[];
      componentRestrictions: { country: string };
      fields: string[];
    }
  ) => GoogleAutocompleteInstance;
  AutocompleteSuggestion?: GoogleAutocompleteSuggestionFetcher;
  AutocompleteSessionToken?: new () => GoogleAutocompleteSessionTokenInstance;
};

type GoogleMapsWindow = Window & {
  google?: {
    maps?: {
      importLibrary?: (library: "places") => Promise<GoogleMapsPlacesNamespace>;
      places?: GoogleMapsPlacesNamespace;
    };
  };
};

type ParsedGoogleAddress = {
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  hasStreetNumber: boolean;
  hasRoute: boolean;
};

type PaymentIconSpec = {
  label: string;
  src: string;
  fallbackSrc?: string;
};

const toLocalPhoneDigits = (value: string | null | undefined) => {
  const digits = (value || "").replace(/\D/g, "");
  if (!digits) return "";
  const local = digits.startsWith("1") ? digits.slice(1) : digits;
  return local.slice(0, 10);
};

type AddressParts = {
  line1: string;
  line2?: string;
  floor?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
};

const formatAddress = ({
  line1,
  line2,
  floor,
  city,
  state,
  postalCode,
  country,
}: AddressParts) => {
  const base = line1.trim();
  if (!base) return "";
  const extras: string[] = [];
  const cleanLine2 = line2?.trim();
  const cleanFloor = floor?.trim();
  if (cleanLine2) {
    extras.push(cleanLine2);
  }
  if (cleanFloor) {
    const normalizedFloor = cleanFloor.toLowerCase().startsWith("floor")
      ? cleanFloor
      : `Floor ${cleanFloor}`;
    extras.push(normalizedFloor);
  }
  const line = extras.length ? `${base}, ${extras.join(", ")}` : base;
  const stateZip = [state?.trim(), postalCode?.trim()].filter(Boolean).join(" ");
  const cityStateZip = [city?.trim(), stateZip].filter(Boolean).join(", ");
  const parts = [line, cityStateZip, country?.trim()].filter(Boolean) as string[];
  return parts.join(", ");
};

const formatAddressForQuote = (parts: AddressParts) =>
  formatAddress({ ...parts, line2: "", floor: "" });

const buildPostalCode = (postalCode: string, postalCodeSuffix: string) => {
  if (!postalCode) return "";
  return postalCodeSuffix ? `${postalCode}-${postalCodeSuffix}` : postalCode;
};

const DEFAULT_COUNTRY = "United States";
const ADDRESS_BROWSER_AUTOCOMPLETE = "section-all-in-bloom-checkout new-password";

const suppressBrowserAddressAutocomplete = (input: HTMLInputElement | null) => {
  if (!input) return;
  input.setAttribute("autocomplete", ADDRESS_BROWSER_AUTOCOMPLETE);
};

const normalizeHtmlToken = (value: string) =>
  value.replace(/[^a-zA-Z0-9_-]/g, "");

const warnGooglePlacesFallback = (message: string, error?: unknown) => {
  if (typeof console === "undefined") return;
  if (error) {
    console.warn(`[All in Bloom] ${message}`, error);
    return;
  }
  console.warn(`[All in Bloom] ${message}`);
};

const hasStructuredAddressDetails = ({
  line2,
  floor,
  city,
  state,
  postalCode,
  country,
}: Omit<AddressParts, "line1">) =>
  Boolean(
    line2?.trim() ||
      floor?.trim() ||
      city?.trim() ||
      state?.trim() ||
      postalCode?.trim() ||
      (country?.trim() && country.trim() !== DEFAULT_COUNTRY)
  );

const parseGoogleAddressComponents = <T extends { types?: string[] }>({
  components,
  fallbackLine1,
  getLongText,
  getShortText,
}: {
  components: T[];
  fallbackLine1: string;
  getLongText: (component: T | undefined) => string;
  getShortText: (component: T | undefined) => string;
}): ParsedGoogleAddress => {
  const getComponent = (type: string) =>
    components.find((component) => component.types?.includes(type));
  const streetNumber = getLongText(getComponent("street_number"));
  const route = getLongText(getComponent("route"));
  const subpremise = getLongText(getComponent("subpremise"));
  const city =
    getLongText(getComponent("locality")) ||
    getLongText(getComponent("postal_town")) ||
    getLongText(getComponent("sublocality")) ||
    getLongText(getComponent("administrative_area_level_2"));
  const state = getShortText(getComponent("administrative_area_level_1"));
  const postalCode = getLongText(getComponent("postal_code"));
  const postalCodeSuffix = getLongText(getComponent("postal_code_suffix"));
  const country = getLongText(getComponent("country"));
  const line1 = [streetNumber, route].filter(Boolean).join(" ").trim();

  return {
    line1: line1 || fallbackLine1,
    line2: subpremise ? `Apt ${subpremise}` : "",
    city,
    state,
    postalCode: buildPostalCode(postalCode, postalCodeSuffix),
    country,
    hasStreetNumber: Boolean(streetNumber),
    hasRoute: Boolean(route),
  };
};

const getGoogleSuggestionLabel = (suggestion: GoogleAutocompleteSuggestionItem) =>
  suggestion.placePrediction?.text?.text?.trim() || "";

const PaymentIcon = ({ icon }: { icon: PaymentIconSpec }) => {
  const [src, setSrc] = useState(icon.src);
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        className="inline-flex shrink-0 items-center justify-center text-[10px] uppercase tracking-[0.18em] text-stone-500"
        title={icon.label}
      >
        {icon.label}
      </span>
    );
  }

  return (
    <span className="inline-flex shrink-0 items-center justify-center" title={icon.label}>
      <img
        src={src}
        alt={icon.label}
        loading="lazy"
        className="h-2.5 w-auto"
        onError={() => {
          if (icon.fallbackSrc && src !== icon.fallbackSrc) {
            setSrc(icon.fallbackSrc);
            return;
          }
          setFailed(true);
        }}
      />
    </span>
  );
};

type CartViewProps = {
  isAuthenticated: boolean;
  userEmail: string | null;
  userPhone: string | null;
  globalDiscount: DiscountInfo | null;
  firstOrderDiscount: DiscountInfo | null;
  canceledCheckoutStatus: string | null;
  categoryDiscount: {
    percent: number;
    note: string;
    flowerType?: string | null;
    mixed?: string | null;
    color?: string | null;
    minPriceCents?: number | null;
    maxPriceCents?: number | null;
  } | null;
};

export default function CartView({
  isAuthenticated,
  userEmail,
  userPhone,
  globalDiscount,
  firstOrderDiscount,
  canceledCheckoutStatus,
  categoryDiscount,
}: CartViewProps) {
  const { items, updateQuantity, removeItem } = useCart();
  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const addressAutofillId = normalizeHtmlToken(useId());
  const addressFieldNames = useMemo(
    () => ({
      street: `aib-${addressAutofillId}-a`,
      apartment: `aib-${addressAutofillId}-b`,
      floor: `aib-${addressAutofillId}-c`,
      city: `aib-${addressAutofillId}-d`,
      state: `aib-${addressAutofillId}-e`,
      postalCode: `aib-${addressAutofillId}-f`,
      country: `aib-${addressAutofillId}-g`,
    }),
    [addressAutofillId]
  );
  const [guestEmail, setGuestEmail] = useState(() => userEmail || "");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [addressFloor, setAddressFloor] = useState("");
  const [addressCity, setAddressCity] = useState("");
  const [addressState, setAddressState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [orderComment, setOrderComment] = useState("");
  const [phoneLocal, setPhoneLocal] = useState(() => toLocalPhoneDigits(userPhone));
  const inputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteRef = useRef<GoogleAutocompleteInstance | null>(null);
  const autocompleteListenerRef = useRef<GoogleMapsEventListener | null>(null);
  const placesApiRef = useRef<GoogleMapsPlacesNamespace | null>(null);
  const autocompleteSessionTokenRef = useRef<GoogleAutocompleteSessionTokenInstance | null>(null);
  const suggestionsRequestIdRef = useRef(0);
  const quoteRequestIdRef = useRef(0);
  const skipNextSuggestionFetchRef = useRef(false);
  const closeSuggestionsTimeoutRef = useRef<number | null>(null);
  const [googleAutocompleteMode, setGoogleAutocompleteMode] = useState<
    "none" | "data" | "legacy"
  >("none");
  const [addressSuggestions, setAddressSuggestions] = useState<
    GoogleAutocompleteSuggestionItem[]
  >([]);
  const [addressSuggestionsOpen, setAddressSuggestionsOpen] = useState(false);
  const [addressSuggestionsLoading, setAddressSuggestionsLoading] = useState(false);
  const [activeAddressSuggestionIndex, setActiveAddressSuggestionIndex] = useState(-1);
  const [quote, setQuote] = useState<{
    feeCents: number;
    miles: number;
    distanceText: string;
    address: string;
  } | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [storageReady, setStorageReady] = useState(false);
  const checkoutEmail = (isAuthenticated ? userEmail || "" : guestEmail).trim().toLowerCase();
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(checkoutEmail);
  const showEmailError = !isAuthenticated && guestEmail.trim().length > 0 && !emailValid;
  const formatPhone = (localDigits: string) => {
    const part1 = localDigits.slice(0, 3);
    const part2 = localDigits.slice(3, 6);
    const part3 = localDigits.slice(6, 10);
    let result = "+1";
    if (part1) result += ` ${part1}`;
    if (part2) result += ` ${part2}`;
    if (part3) result += ` ${part3}`;
    return result;
  };
  const phoneValid = phoneLocal.length === 10;
  const phoneValue = formatPhone(phoneLocal);
  const addressForQuote = useMemo(
    () =>
      formatAddressForQuote({
        line1: addressLine1,
        city: addressCity,
        state: addressState,
        postalCode,
        country,
      }),
    [addressLine1, addressCity, addressState, postalCode, country]
  );
  const hasRequiredAddress =
    Boolean(addressLine1.trim()) &&
    Boolean(addressCity.trim()) &&
    Boolean(addressState.trim()) &&
    Boolean(postalCode.trim());

  const closeAddressSuggestions = useCallback((options?: { clearItems?: boolean }) => {
    setAddressSuggestionsOpen(false);
    setActiveAddressSuggestionIndex(-1);
    if (options?.clearItems !== false) {
      setAddressSuggestions([]);
    }
  }, []);

  const resetAutocompleteSessionToken = useCallback((
    placesNamespace?: GoogleMapsPlacesNamespace | null
  ) => {
    const namespace = placesNamespace || placesApiRef.current;
    autocompleteSessionTokenRef.current = namespace?.AutocompleteSessionToken
      ? new namespace.AutocompleteSessionToken()
      : null;
  }, []);

  const resetStructuredAddressDetails = () => {
    setAddressLine2("");
    setAddressFloor("");
    setAddressCity("");
    setAddressState("");
    setPostalCode("");
    setCountry(DEFAULT_COUNTRY);
  };

  const handleStreetAddressChange = (nextValue: string) => {
    const shouldResetStructuredAddress =
      nextValue !== addressLine1 &&
      hasStructuredAddressDetails({
        line2: addressLine2,
        floor: addressFloor,
        city: addressCity,
        state: addressState,
        postalCode,
        country,
      });

    skipNextSuggestionFetchRef.current = false;
    setAddressLine1(nextValue);

    if (shouldResetStructuredAddress) {
      resetStructuredAddressDetails();
      resetAutocompleteSessionToken();
    }

    setQuote(null);
    setQuoteError(null);

    if (googleAutocompleteMode === "data") {
      closeAddressSuggestions();
    }
  };

  const applyParsedAddress = useCallback((parsed: ParsedGoogleAddress) => {
    if (!parsed.hasStreetNumber || !parsed.hasRoute || !parsed.line1.trim()) {
      setQuote(null);
      setQuoteError("Please choose a full street address with a house number.");
      closeAddressSuggestions();
      resetAutocompleteSessionToken();
      return false;
    }

    skipNextSuggestionFetchRef.current = true;
    setAddressLine1(parsed.line1);
    setAddressLine2(parsed.line2);
    setAddressCity(parsed.city);
    setAddressState(parsed.state);
    setPostalCode(parsed.postalCode);
    setCountry(parsed.country || DEFAULT_COUNTRY);
    setQuote(null);
    setQuoteError(null);
    closeAddressSuggestions();
    resetAutocompleteSessionToken();
    return true;
  }, [closeAddressSuggestions, resetAutocompleteSessionToken]);

  const applySuggestionPlace = useCallback(async (
    suggestion: GoogleAutocompleteSuggestionItem
  ) => {
    const prediction = suggestion.placePrediction;
    if (!prediction) return false;
    const place = prediction.toPlace();
    await place.fetchFields({
      fields: ["displayName", "formattedAddress", "addressComponents"],
    });
    return applyParsedAddress(
      parseGoogleAddressComponents({
        components: place.addressComponents || [],
        fallbackLine1:
          prediction.text?.text?.trim() ||
          place.displayName ||
          place.formattedAddress ||
          "",
        getLongText: (component) => component?.longText || "",
        getShortText: (component) => component?.shortText || "",
      })
    );
  }, [applyParsedAddress]);

  const applyLegacyPlace = useCallback((place: GooglePlaceResult | undefined) => {
    if (!place) return false;
    return applyParsedAddress(
      parseGoogleAddressComponents({
        components: place.address_components || [],
        fallbackLine1: place.name || place.formatted_address || "",
        getLongText: (component) => component?.long_name || "",
        getShortText: (component) => component?.short_name || "",
      })
    );
  }, [applyParsedAddress]);

  const initializeLegacyAutocomplete = useCallback((
    placesNamespace: GoogleMapsPlacesNamespace | null
  ) => {
    const input = inputRef.current;
    if (!input || !placesNamespace?.Autocomplete || autocompleteRef.current) {
      return false;
    }

    try {
      autocompleteRef.current = new placesNamespace.Autocomplete(input, {
        types: ["address"],
        componentRestrictions: { country: "us" },
        fields: ["formatted_address", "address_components", "name"],
      });
      suppressBrowserAddressAutocomplete(input);
      autocompleteListenerRef.current = autocompleteRef.current.addListener(
        "place_changed",
        () => {
          applyLegacyPlace(autocompleteRef.current?.getPlace());
        }
      );
    } catch {
      autocompleteRef.current = null;
      autocompleteListenerRef.current = null;
      return false;
    }

    setGoogleAutocompleteMode("legacy");
    closeAddressSuggestions();
    return true;
  }, [applyLegacyPlace, closeAddressSuggestions]);

  useEffect(() => {
    const stored = loadCheckoutFormStorage();
    if (stored) {
      if (!isAuthenticated && stored.guestEmail) {
        setGuestEmail(stored.guestEmail);
      }
      const legacyAddress = stored.address?.trim() || "";
      setAddressLine1(stored.addressLine1?.trim() || legacyAddress);
      setAddressLine2(stored.addressLine2?.trim() || "");
      setAddressFloor(stored.addressFloor?.trim() || "");
      setAddressCity(stored.addressCity?.trim() || "");
      setAddressState(stored.addressState?.trim() || "");
      setPostalCode(stored.postalCode?.trim() || "");
      setCountry(stored.country?.trim() || DEFAULT_COUNTRY);
      setOrderComment(stored.orderComment?.trim() || "");
      if (stored.phoneLocal) {
        setPhoneLocal(stored.phoneLocal);
      }
      if (stored.quote) {
        setQuote(stored.quote);
      }
    }
    setStorageReady(true);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!storageReady) return;
    saveCheckoutFormStorage({
      guestEmail: isAuthenticated ? "" : guestEmail,
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2.trim(),
      addressFloor: addressFloor.trim(),
      addressCity: addressCity.trim(),
      addressState: addressState.trim(),
      postalCode: postalCode.trim(),
      country: country.trim(),
      orderComment: orderComment.trim(),
      phoneLocal,
      quote,
    });
  }, [
    addressCity,
    addressFloor,
    addressLine1,
    addressLine2,
    addressState,
    country,
    guestEmail,
    isAuthenticated,
    orderComment,
    phoneLocal,
    postalCode,
    quote,
    storageReady,
  ]);

  useEffect(() => {
    if (!quote) return;
    if (quote.address !== addressForQuote) {
      setQuote(null);
      setQuoteError(null);
    }
  }, [addressForQuote, quote]);

  useEffect(() => {
    if (!mapsKey) return;
    if (autocompleteRef.current || placesApiRef.current) return;

    let cancelled = false;

    const loadGoogleMaps = () =>
      new Promise<void>((resolve, reject) => {
        const mapsApi = (window as GoogleMapsWindow).google?.maps;
        if (mapsApi?.places || mapsApi?.importLibrary) {
          resolve();
          return;
        }
        const handleReady = () => {
          const nextMapsApi = (window as GoogleMapsWindow).google?.maps;
          if (nextMapsApi?.places || nextMapsApi?.importLibrary) {
            resolve();
            return;
          }
          reject(new Error("Google Maps API did not initialize."));
        };
        const existing = document.getElementById("google-maps-js") as
          | HTMLScriptElement
          | null;
        if (existing) {
          if (existing.dataset.loaded === "true") {
            handleReady();
            return;
          }
          if (existing.dataset.error === "true") {
            reject(new Error("Google Maps API failed to load."));
            return;
          }
          existing.addEventListener("load", handleReady, { once: true });
          existing.addEventListener(
            "error",
            () => reject(new Error("Google Maps API failed to load.")),
            { once: true }
          );
          return;
        }
        const script = document.createElement("script");
        script.id = "google-maps-js";
        script.async = true;
        script.defer = true;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${mapsKey}&libraries=places&loading=async&v=weekly`;
        script.addEventListener(
          "load",
          () => {
            script.dataset.loaded = "true";
            handleReady();
          },
          { once: true }
        );
        script.addEventListener(
          "error",
          () => {
            script.dataset.error = "true";
            reject(new Error("Google Maps API failed to load."));
          },
          { once: true }
        );
        document.head.appendChild(script);
      });

    loadGoogleMaps()
      .then(async () => {
        if (cancelled) return;
        const mapsApi = (window as GoogleMapsWindow).google?.maps;
        if (!mapsApi) {
          setGoogleAutocompleteMode("none");
          return;
        }
        let placesNamespace = mapsApi.places || {};
        if (mapsApi.importLibrary) {
          try {
            placesNamespace = {
              ...placesNamespace,
              ...(await mapsApi.importLibrary("places")),
            };
          } catch {
            // Fall back to whatever was loaded directly on google.maps.places.
          }
        }
        placesApiRef.current = placesNamespace;

        if (placesNamespace.Autocomplete) {
          if (inputRef.current) {
            if (initializeLegacyAutocomplete(placesNamespace)) {
              return;
            }
            setGoogleAutocompleteMode("none");
            return;
          }
          setGoogleAutocompleteMode("legacy");
          closeAddressSuggestions();
          return;
        }

        if (placesNamespace.AutocompleteSuggestion) {
          resetAutocompleteSessionToken(placesNamespace);
          setGoogleAutocompleteMode("data");
          return;
        }

        setGoogleAutocompleteMode("none");
      })
      .catch((error) => {
        warnGooglePlacesFallback(
          "Google Maps JavaScript API failed to load. Check Maps JavaScript API, Places API, billing, and HTTP referrer restrictions. Manual address entry remains available.",
          error
        );
        setGoogleAutocompleteMode("none");
      });

    return () => {
      cancelled = true;
      if (closeSuggestionsTimeoutRef.current !== null) {
        window.clearTimeout(closeSuggestionsTimeoutRef.current);
        closeSuggestionsTimeoutRef.current = null;
      }
      autocompleteListenerRef.current?.remove();
      autocompleteListenerRef.current = null;
      autocompleteRef.current = null;
    };
  }, [
    closeAddressSuggestions,
    initializeLegacyAutocomplete,
    mapsKey,
    resetAutocompleteSessionToken,
  ]);

  useEffect(() => {
    if (
      googleAutocompleteMode !== "legacy" ||
      autocompleteRef.current ||
      !inputRef.current
    ) {
      return;
    }

    const placesNamespace = placesApiRef.current;
    if (!placesNamespace?.Autocomplete) {
      setGoogleAutocompleteMode("none");
      return;
    }

    if (!initializeLegacyAutocomplete(placesNamespace)) {
      setGoogleAutocompleteMode("none");
    }
  }, [googleAutocompleteMode, initializeLegacyAutocomplete, items.length]);

  useEffect(() => {
    if (googleAutocompleteMode !== "data") {
      setAddressSuggestionsLoading(false);
      closeAddressSuggestions();
      return;
    }

    if (skipNextSuggestionFetchRef.current) {
      skipNextSuggestionFetchRef.current = false;
      return;
    }

    const trimmed = addressLine1.trim();
    const placesNamespace = placesApiRef.current;
    if (!trimmed || trimmed.length < 3 || !placesNamespace?.AutocompleteSuggestion) {
      setAddressSuggestionsLoading(false);
      closeAddressSuggestions();
      return;
    }

    const requestId = suggestionsRequestIdRef.current + 1;
    suggestionsRequestIdRef.current = requestId;
    const timeoutId = window.setTimeout(async () => {
      setAddressSuggestionsLoading(true);
      try {
        if (!autocompleteSessionTokenRef.current) {
          resetAutocompleteSessionToken(placesNamespace);
        }
        const result = await placesNamespace.AutocompleteSuggestion!.fetchAutocompleteSuggestions({
          input: trimmed,
          includedRegionCodes: ["us"],
          sessionToken: autocompleteSessionTokenRef.current || undefined,
        });
        if (suggestionsRequestIdRef.current !== requestId) return;

        const suggestions = (result.suggestions || [])
          .filter((suggestion) => Boolean(getGoogleSuggestionLabel(suggestion)))
          .slice(0, 5);

        setAddressSuggestions(suggestions);
        setActiveAddressSuggestionIndex(suggestions.length ? 0 : -1);
        setAddressSuggestionsOpen(
          document.activeElement === inputRef.current && suggestions.length > 0
        );
      } catch (error) {
        if (suggestionsRequestIdRef.current !== requestId) return;
        setAddressSuggestions([]);
        setAddressSuggestionsOpen(false);
        warnGooglePlacesFallback(
          "Google Places Data API autocomplete failed. If this is a 403, enable Places API (New) for this key or use the legacy Places library fallback. Manual address entry remains available.",
          error
        );
        if (placesNamespace.Autocomplete && inputRef.current && !autocompleteRef.current) {
          initializeLegacyAutocomplete(placesNamespace);
          setGoogleAutocompleteMode("legacy");
          return;
        }
        setGoogleAutocompleteMode("none");
      } finally {
        if (suggestionsRequestIdRef.current === requestId) {
          setAddressSuggestionsLoading(false);
        }
      }
    }, 180);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    addressLine1,
    closeAddressSuggestions,
    googleAutocompleteMode,
    initializeLegacyAutocomplete,
    resetAutocompleteSessionToken,
  ]);

  const lineItems = useMemo(() => {
    return items.map((item) => {
      const basePrice = item.meta?.basePriceCents ?? item.priceCents;
      const isFlowerQuantityEnabled = Boolean(item.meta?.isFlowerQuantityEnabled);
      const flowerQuantityPerBouquet = isFlowerQuantityEnabled
        ? clampFlowerQuantity(
            Number(item.meta?.flowerQuantityPerBouquet || FLOWER_QUANTITY_MIN)
          )
        : 1;
      const bouquetsCount = isFlowerQuantityEnabled
        ? Math.max(1, Math.round(item.quantity || 1))
        : item.quantity;
      const discount = getCartItemDiscount(
        {
          basePriceCents: basePrice,
          bouquetDiscountPercent: item.meta?.bouquetDiscountPercent,
          bouquetDiscountNote: item.meta?.bouquetDiscountNote,
          flowerType: item.meta?.flowerType,
          isMixed: item.meta?.isMixed,
          bouquetType: item.meta?.bouquetType,
          colors: item.meta?.bouquetColors,
        },
        {
          globalDiscountPercent: globalDiscount?.percent || 0,
          globalDiscountNote: globalDiscount?.note || null,
          categoryDiscountPercent: categoryDiscount?.percent || 0,
          categoryDiscountNote: categoryDiscount?.note || null,
          categoryFlowerType: categoryDiscount?.flowerType || null,
          categoryMixed: categoryDiscount?.mixed || null,
          categoryColor: categoryDiscount?.color || null,
          categoryMinPriceCents: categoryDiscount?.minPriceCents ?? null,
          categoryMaxPriceCents: categoryDiscount?.maxPriceCents ?? null,
        }
      );

      const discountedPrice = discount
        ? Math.max(
            0,
            Math.round(basePrice * (100 - discount.percent) / 100)
          )
        : basePrice;

      return {
        ...item,
        quantity: bouquetsCount,
        basePrice,
        discount,
        discountedPrice,
        isFlowerQuantityEnabled,
        flowerQuantityPerBouquet,
        lineTotal: discountedPrice * flowerQuantityPerBouquet * bouquetsCount,
        lineOriginal: basePrice * flowerQuantityPerBouquet * bouquetsCount,
      };
    });
  }, [items, globalDiscount, categoryDiscount]);

  const subtotalCents = useMemo(
    () => lineItems.reduce((sum, item) => sum + item.lineTotal, 0),
    [lineItems]
  );

  const hasAnyDiscount = useMemo(
    () => lineItems.some((item) => Boolean(item.discount)),
    [lineItems]
  );

  const showFirstOrderDiscount = Boolean(firstOrderDiscount) && !hasAnyDiscount;

  const discountedSubtotalCents = useMemo(() => {
    if (!showFirstOrderDiscount || !firstOrderDiscount) {
      return subtotalCents;
    }

    return lineItems.reduce((sum, item) => {
      const unitPrice = applyPercentDiscount(item.basePrice, firstOrderDiscount.percent);
      return sum + unitPrice * item.flowerQuantityPerBouquet * item.quantity;
    }, 0);
  }, [firstOrderDiscount, lineItems, showFirstOrderDiscount, subtotalCents]);

  const firstOrderDiscountCents = useMemo(() => {
    return Math.max(0, subtotalCents - discountedSubtotalCents);
  }, [discountedSubtotalCents, subtotalCents]);

  const shippingCents = quote?.feeCents ?? 0;
  const totalCents = Math.max(
    0,
    discountedSubtotalCents + shippingCents
  );
  const stripeCheckoutDisabled =
    !quote ||
    quoteLoading ||
    Boolean(quoteError) ||
    !emailValid ||
    !phoneValid ||
    !hasRequiredAddress ||
    checkoutBusy;
  const paypalCheckoutDisabled =
    !quote ||
    quoteLoading ||
    Boolean(quoteError) ||
    !emailValid ||
    !hasRequiredAddress ||
    checkoutBusy;
  const checkoutPhone = phoneValid ? phoneValue : "";

  const requestQuote = async () => {
    if (!hasRequiredAddress) {
      setQuote(null);
      setQuoteError("Please enter street, city, state, and ZIP.");
      return;
    }

    const requestId = quoteRequestIdRef.current + 1;
    quoteRequestIdRef.current = requestId;
    setQuoteLoading(true);
    setQuoteError(null);

    try {
      const trimmed = addressForQuote.trim();
      const response = await fetch("/api/delivery/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: trimmed }),
      });

      const payload = await response.json().catch(() => ({}));
      if (quoteRequestIdRef.current !== requestId) return;

      if (!response.ok) {
        setQuote(null);
        setQuoteError(
          payload?.detail ||
            payload?.error ||
            payload?.message ||
            "Unable to calculate delivery."
        );
        return;
      }

      setQuote({
        feeCents: payload.feeCents,
        miles: payload.miles,
        distanceText: payload.distanceText,
        address: trimmed,
      });
    } catch {
      if (quoteRequestIdRef.current !== requestId) return;
      setQuote(null);
      setQuoteError("Unable to calculate delivery.");
    } finally {
      if (quoteRequestIdRef.current === requestId) {
        setQuoteLoading(false);
      }
    }
  };

  if (!items.length) {
    return (
      <div className="glass rounded-[28px] border border-white/80 p-8 text-center text-sm text-stone-600">
        Your cart is empty. Explore the catalog to add bouquets.
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="min-w-0 space-y-4">
        {lineItems.map((item) => {
          const displayDiscount =
            item.discount || (showFirstOrderDiscount ? firstOrderDiscount : null);
          const displayUnitPrice = displayDiscount
            ? applyPercentDiscount(item.basePrice, displayDiscount.percent)
            : item.basePrice;
          const displayLineTotal =
            displayUnitPrice * item.flowerQuantityPerBouquet * item.quantity;
          const displayLineOriginal =
            item.basePrice * item.flowerQuantityPerBouquet * item.quantity;

          return (
            <div
              key={item.id}
              className="glass flex flex-col gap-4 rounded-[28px] border border-white/80 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-4">
                <div className="h-20 w-20 overflow-hidden rounded-2xl border border-white/80 bg-white">
                  <ImageWithFallback
                    src={item.image}
                    alt={item.name}
                    width={120}
                    height={140}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-stone-900">
                    {item.name}
                  </p>
                  {item.meta?.note ? (
                    <p className="break-words text-xs text-stone-500">{item.meta.note}</p>
                  ) : null}
                  {item.isFlowerQuantityEnabled ? (
                    <div className="space-y-1">
                      {displayDiscount ? (
                        <p className="text-xs text-stone-400 line-through">
                          {formatMoney(item.basePrice)}/stem x {item.flowerQuantityPerBouquet} ={" "}
                          {formatMoney(item.basePrice * item.flowerQuantityPerBouquet)}
                        </p>
                      ) : null}
                      <p
                        className={
                          displayDiscount
                            ? "text-xs text-[color:var(--brand)]"
                            : "text-xs text-stone-600"
                        }
                      >
                        {formatMoney(displayUnitPrice)}/stem x {item.flowerQuantityPerBouquet} ={" "}
                        {formatMoney(displayUnitPrice * item.flowerQuantityPerBouquet)}
                      </p>
                      {item.quantity > 1 ? (
                        <p className="text-xs text-stone-500">
                          x {item.quantity} bouquets
                        </p>
                      ) : null}
                      <p className="text-xs text-stone-500">
                        Total: {formatMoney(displayLineTotal)}
                      </p>
                      {displayDiscount ? (
                        <p className="text-xs text-stone-500">
                          -{displayDiscount.percent}% - {displayDiscount.note}
                        </p>
                      ) : null}
                    </div>
                  ) : displayDiscount ? (
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-[0.2em] text-stone-400 line-through">
                        {formatMoney(item.quantity > 1 ? displayLineOriginal : item.basePrice)}
                      </p>
                      <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--brand)]">
                        {formatMoney(item.quantity > 1 ? displayLineTotal : displayUnitPrice)}
                      </p>
                      {item.quantity > 1 ? (
                        <p className="text-xs text-stone-500">
                          x {item.quantity} bouquets
                        </p>
                      ) : null}
                      <p className="text-xs text-stone-500">
                        -{displayDiscount.percent}% - {displayDiscount.note}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
                      {formatMoney(item.basePrice)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto sm:justify-end">
                {item.isFlowerQuantityEnabled ? (
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-stone-500">
                      {item.flowerQuantityPerBouquet} stems each
                    </p>
                    <label className="flex items-center gap-2 rounded-full border border-stone-200 bg-white/80 px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-stone-600 max-[410px]:text-[8px] max-[410px]:tracking-[0.06em] sm:text-xs sm:tracking-[0.24em]">
                      Bouquets
                      <input
                        type="number"
                        min={FLOWER_QUANTITY_MIN}
                        max={FLOWER_QUANTITY_MAX}
                        inputMode="numeric"
                        value={item.quantity}
                        onChange={(event) => {
                          const next = Number(event.target.value);
                          updateQuantity(item.id, clampFlowerQuantity(next));
                        }}
                        className="h-7 w-16 rounded-full border border-stone-200 bg-white px-2 text-right text-xs font-semibold text-stone-700 outline-none focus:border-stone-400 max-[410px]:w-14 max-[410px]:px-1.5 max-[410px]:text-[11px] sm:w-20 sm:text-sm"
                      />
                    </label>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-full border border-stone-200 bg-white/80 px-3 py-2 text-xs uppercase tracking-[0.3em] text-stone-600">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="h-6 w-6 rounded-full border border-stone-200 text-sm"
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="h-6 w-6 rounded-full border border-stone-200 text-sm"
                    >
                      +
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs uppercase tracking-[0.3em] text-rose-700"
                >
                  Remove
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="glass h-fit min-w-0 space-y-4 rounded-[28px] border border-white/80 p-5 sm:p-6">
        <h2 className="text-xl font-semibold text-stone-900">Order summary</h2>
        {canceledCheckoutStatus === "CANCELED" || canceledCheckoutStatus === "FAILED" ? (
          <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs uppercase tracking-[0.24em] text-amber-800">
            Previous checkout was canceled.
          </p>
        ) : null}
        {canceledCheckoutStatus === "PAID" ? (
          <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs uppercase tracking-[0.24em] text-emerald-800">
            Previous checkout is already paid.
          </p>
        ) : null}
        <div className="space-y-3">
          <label className="flex flex-col gap-2 text-sm text-stone-700">
            Email for receipt
            <input
              value={isAuthenticated ? userEmail || "" : guestEmail}
              onChange={(event) => {
                if (isAuthenticated) return;
                setGuestEmail(event.target.value);
              }}
              placeholder="you@example.com"
              type="email"
              autoComplete="email"
              disabled={isAuthenticated}
              className="w-full min-w-0 rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-sm text-stone-800 outline-none focus:border-stone-400 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-500"
            />
          </label>
          {showEmailError ? (
            <p className="text-xs uppercase tracking-[0.24em] text-rose-700">
              Enter a valid email address.
            </p>
          ) : null}
          <div
            aria-hidden="true"
            className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden opacity-0"
          >
            <input
              tabIndex={-1}
              type="text"
              name="address-line1"
              autoComplete="street-address"
            />
            <input
              tabIndex={-1}
              type="text"
              name="address-line2"
              autoComplete="address-line2"
            />
            <input
              tabIndex={-1}
              type="text"
              name="address-level2"
              autoComplete="address-level2"
            />
            <input
              tabIndex={-1}
              type="text"
              name="address-level1"
              autoComplete="address-level1"
            />
            <input
              tabIndex={-1}
              type="text"
              name="postal-code"
              autoComplete="postal-code"
            />
            <input
              tabIndex={-1}
              type="text"
              name="country"
              autoComplete="country"
            />
          </div>
          <label className="flex flex-col gap-2 text-sm text-stone-700">
            Street address
            <div className="relative">
              <input
                ref={inputRef}
                name={addressFieldNames.street}
                value={addressLine1}
                onChange={(event) => handleStreetAddressChange(event.target.value)}
                onFocus={() => {
                  suppressBrowserAddressAutocomplete(inputRef.current);
                  if (googleAutocompleteMode === "data" && addressSuggestions.length > 0) {
                    setAddressSuggestionsOpen(true);
                  }
                }}
                onBlur={() => {
                  if (closeSuggestionsTimeoutRef.current !== null) {
                    window.clearTimeout(closeSuggestionsTimeoutRef.current);
                  }
                  closeSuggestionsTimeoutRef.current = window.setTimeout(() => {
                    closeAddressSuggestions({ clearItems: false });
                    closeSuggestionsTimeoutRef.current = null;
                  }, 120);
                }}
                onKeyDown={(event) => {
                  if (
                    googleAutocompleteMode !== "data" ||
                    !addressSuggestionsOpen ||
                    !addressSuggestions.length
                  ) {
                    return;
                  }

                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    setActiveAddressSuggestionIndex((current) =>
                      current < addressSuggestions.length - 1 ? current + 1 : 0
                    );
                    return;
                  }

                  if (event.key === "ArrowUp") {
                    event.preventDefault();
                    setActiveAddressSuggestionIndex((current) =>
                      current > 0 ? current - 1 : addressSuggestions.length - 1
                    );
                    return;
                  }

                  if (event.key === "Escape") {
                    closeAddressSuggestions({ clearItems: false });
                    return;
                  }

                  if (event.key === "Enter" && activeAddressSuggestionIndex >= 0) {
                    event.preventDefault();
                    void applySuggestionPlace(
                      addressSuggestions[activeAddressSuggestionIndex]
                    ).catch(() => {
                      setQuote(null);
                      setQuoteError("Unable to fill address automatically.");
                      closeAddressSuggestions();
                    });
                  }
                }}
                placeholder="123 Main St"
                autoComplete={ADDRESS_BROWSER_AUTOCOMPLETE}
                autoCorrect="off"
                autoCapitalize="words"
                spellCheck={false}
                data-lpignore="true"
                data-1p-ignore="true"
                className="w-full min-w-0 rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-sm text-stone-800 outline-none focus:border-stone-400 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400"
              />
              {googleAutocompleteMode === "data" &&
              (addressSuggestionsOpen || addressSuggestionsLoading) ? (
                <div className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-40 overflow-hidden rounded-2xl border border-[rgba(108,20,10,0.16)] bg-[rgba(255,255,255,0.98)] shadow-[0_18px_36px_rgba(108,20,10,0.16)] backdrop-blur">
                  {addressSuggestionsLoading ? (
                    <div className="px-4 py-3 text-xs uppercase tracking-[0.2em] text-stone-500">
                      Searching...
                    </div>
                  ) : addressSuggestions.length ? (
                    <>
                      {addressSuggestions.map((suggestion, index) => {
                        const label = getGoogleSuggestionLabel(suggestion);
                        return (
                          <button
                            key={suggestion.placePrediction?.placeId || `${label}-${index}`}
                            type="button"
                            onMouseDown={(event) => {
                              event.preventDefault();
                            }}
                            onClick={() => {
                              void applySuggestionPlace(suggestion).catch(() => {
                                setQuote(null);
                                setQuoteError("Unable to fill address automatically.");
                                closeAddressSuggestions();
                              });
                            }}
                            className={`block w-full border-0 border-b border-[rgba(108,20,10,0.08)] px-4 py-3 text-left text-sm text-stone-700 last:border-b-0 ${
                              index === activeAddressSuggestionIndex
                                ? "bg-[rgba(108,20,10,0.08)]"
                                : "bg-transparent"
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                      <div className="border-t border-[rgba(108,20,10,0.08)] px-4 py-2 text-[10px] uppercase tracking-[0.22em] text-stone-400">
                        Powered by Google
                      </div>
                    </>
                  ) : (
                    <div className="px-4 py-3 text-xs uppercase tracking-[0.2em] text-stone-500">
                      No address suggestions
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm text-stone-700">
              <span className="min-h-[2.5rem]">Apartment / Suite (optional)</span>
              <input
                name={addressFieldNames.apartment}
                value={addressLine2}
                onChange={(event) => setAddressLine2(event.target.value)}
                placeholder="Apt 2B"
                autoComplete={ADDRESS_BROWSER_AUTOCOMPLETE}
                autoCorrect="off"
                spellCheck={false}
                data-lpignore="true"
                data-1p-ignore="true"
                className="w-full min-w-0 rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-sm text-stone-800 outline-none focus:border-stone-400"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-stone-700">
              <span className="min-h-[2.5rem]">Floor (optional)</span>
              <input
                name={addressFieldNames.floor}
                value={addressFloor}
                onChange={(event) => setAddressFloor(event.target.value)}
                placeholder="5"
                autoComplete={ADDRESS_BROWSER_AUTOCOMPLETE}
                autoCorrect="off"
                spellCheck={false}
                data-lpignore="true"
                data-1p-ignore="true"
                className="w-full min-w-0 rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-sm text-stone-800 outline-none focus:border-stone-400"
              />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1.2fr_0.8fr_0.9fr]">
            <label className="flex flex-col gap-2 text-sm text-stone-700">
              City
              <input
                name={addressFieldNames.city}
                value={addressCity}
                onChange={(event) => {
                  setAddressCity(event.target.value);
                  setQuote(null);
                  setQuoteError(null);
                }}
                placeholder="Chicago"
                autoComplete={ADDRESS_BROWSER_AUTOCOMPLETE}
                autoCorrect="off"
                spellCheck={false}
                data-lpignore="true"
                data-1p-ignore="true"
                className="w-full min-w-0 rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-sm text-stone-800 outline-none focus:border-stone-400"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-stone-700">
              State
              <input
                name={addressFieldNames.state}
                value={addressState}
                onChange={(event) => {
                  const next = event.target.value
                    .toUpperCase()
                    .replace(/[^A-Z]/g, "")
                    .slice(0, 2);
                  setAddressState(next);
                  setQuote(null);
                  setQuoteError(null);
                }}
                placeholder="IL"
                autoComplete={ADDRESS_BROWSER_AUTOCOMPLETE}
                autoCorrect="off"
                spellCheck={false}
                data-lpignore="true"
                data-1p-ignore="true"
                maxLength={2}
                className="w-full min-w-0 rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-sm text-stone-800 uppercase outline-none focus:border-stone-400"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-stone-700">
              ZIP code
              <input
                name={addressFieldNames.postalCode}
                value={postalCode}
                onChange={(event) => {
                  const next = event.target.value
                    .toUpperCase()
                    .replace(/[^0-9-]/g, "")
                    .slice(0, 10);
                  setPostalCode(next);
                  setQuote(null);
                  setQuoteError(null);
                }}
                placeholder="60601"
                autoComplete={ADDRESS_BROWSER_AUTOCOMPLETE}
                inputMode="numeric"
                data-lpignore="true"
                data-1p-ignore="true"
                className="w-full min-w-0 rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-sm text-stone-800 outline-none focus:border-stone-400"
              />
            </label>
          </div>
          <label className="flex flex-col gap-2 text-sm text-stone-700">
            Country
            <input
              name={addressFieldNames.country}
              value={country}
              onChange={(event) => {
                setCountry(event.target.value);
                setQuote(null);
                setQuoteError(null);
              }}
              placeholder={DEFAULT_COUNTRY}
              autoComplete={ADDRESS_BROWSER_AUTOCOMPLETE}
              autoCorrect="off"
              spellCheck={false}
              data-lpignore="true"
              data-1p-ignore="true"
              className="w-full min-w-0 rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-sm text-stone-800 outline-none focus:border-stone-400"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-stone-700">
            Phone number
            <input
              value={phoneValue}
              onChange={(event) => {
                const digits = event.target.value.replace(/\D/g, "");
                const local =
                  digits.startsWith("1") ? digits.slice(1) : digits;
                setPhoneLocal(local.slice(0, 10));
              }}
              placeholder="+1 312 555 0123"
              inputMode="numeric"
              autoComplete="tel"
              maxLength={15}
              pattern="^\\+1 \\d{3} \\d{3} \\d{4}$"
              className="w-full min-w-0 rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-sm text-stone-800 outline-none focus:border-stone-400 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400"
            />
          </label>
          {phoneLocal.length > 0 && !phoneValid ? (
            <p className="text-xs uppercase tracking-[0.24em] text-rose-700">
              Use format +1 312 555 0123.
            </p>
          ) : null}
          <label className="flex flex-col gap-2 text-sm text-stone-700">
            Order comment (optional)
            <textarea
              value={orderComment}
              onChange={(event) => setOrderComment(event.target.value.slice(0, 500))}
              placeholder="Delivery instructions, recipient notes, etc."
              rows={3}
              className="min-h-[6.5rem] w-full min-w-0 rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-sm text-stone-800 outline-none focus:border-stone-400"
            />
          </label>
          <button
            type="button"
            onClick={requestQuote}
            disabled={quoteLoading || !hasRequiredAddress}
            className="w-full rounded-full border border-stone-200 bg-white/80 px-4 py-2 text-xs uppercase tracking-[0.3em] text-stone-600 disabled:opacity-50"
          >
            {quoteLoading ? "Checking..." : "Check delivery"}
          </button>
          <p className="text-xs text-stone-500">
            Delivery pricing: free within 10 miles, $15 within 20 miles, $30
            within 30 miles.
          </p>
          {quote ? (
            <p className="text-xs text-stone-500">
              Distance: {quote.distanceText}
            </p>
          ) : null}
          {quoteError ? (
            <p className="text-xs uppercase tracking-[0.24em] text-rose-700">
              {quoteError}
            </p>
          ) : null}
        </div>
        <div className="space-y-2 text-sm text-stone-600">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatMoney(subtotalCents)}</span>
          </div>
          {showFirstOrderDiscount && firstOrderDiscount ? (
            <div className="flex justify-between text-sm text-stone-600">
              <span>
                First order discount ({firstOrderDiscount.percent}%)
              </span>
              <span>-{formatMoney(firstOrderDiscountCents)}</span>
            </div>
          ) : null}
          <div className="flex justify-between">
            <span>Delivery</span>
            <span>
              {!quote
                ? "Add address"
                : shippingCents === 0
                ? "Free"
                : formatMoney(shippingCents)}
            </span>
          </div>
          <div className="flex justify-between font-semibold text-stone-900">
            <span>Total</span>
            <span>{quote ? formatMoney(totalCents) : "--"}</span>
          </div>
        </div>
        <CheckoutButton
          items={items}
          deliveryAddress={addressForQuote}
          deliveryAddressLine1={addressLine1.trim()}
          deliveryAddressLine2={addressLine2.trim()}
          deliveryCity={addressCity.trim()}
          deliveryState={addressState.trim()}
          deliveryPostalCode={postalCode.trim()}
          deliveryCountry={country.trim()}
          deliveryFloor={addressFloor.trim()}
          orderComment={orderComment.trim()}
          phone={checkoutPhone}
          email={checkoutEmail}
          disabled={stripeCheckoutDisabled}
          onBusyChange={setCheckoutBusy}
          label="Checkout"
          paymentMethod="stripe"
        />
        <div className="flex min-w-0 max-w-full items-center gap-3 overflow-x-auto py-1 lg:justify-start">
          {[
            {
              label: "Visa",
              src: "/payments/visa.svg",
              fallbackSrc: "https://api.iconify.design/logos/visa.svg?height=18",
            },
            {
              label: "Mastercard",
              src: "/payments/mastercard.svg",
              fallbackSrc:
                "https://api.iconify.design/logos/mastercard.svg?height=18",
            },
            {
              label: "Amex",
              src: "/payments/amex.svg",
              fallbackSrc:
                "https://api.iconify.design/logos/american-express.svg?height=18",
            },
            {
              label: "Discover",
              src: "/payments/discover.svg",
              fallbackSrc:
                "https://api.iconify.design/logos/discover.svg?height=18",
            },
            {
              label: "Apple Pay",
              src: "/payments/apple-pay.svg",
              fallbackSrc:
                "https://api.iconify.design/logos/apple-pay.svg?height=18",
            },
            {
              label: "Google Pay",
              src: "/payments/google-pay.svg",
              fallbackSrc:
                "https://api.iconify.design/logos/google-pay.svg?height=18",
            },
            {
              label: "Link",
              src: "/payments/link.svg",
              fallbackSrc:
                "https://api.iconify.design/logos/stripe.svg?height=18",
            },
            {
              label: "Cash App Pay",
              src: "/payments/cash-app-pay.svg",
              fallbackSrc:
                "https://api.iconify.design/lineicons/cash-app.svg?height=18&color=%2300d632",
            },
            {
              label: "Amazon Pay",
              src: "/payments/amazon-pay.svg",
              fallbackSrc:
                "https://api.iconify.design/fa6-brands/amazon-pay.svg?height=18&color=%23ff9900",
            },
            {
              label: "Samsung Pay",
              src: "/payments/samsung-pay.svg",
              fallbackSrc:
                "https://api.iconify.design/fa6-brands/samsung-pay.svg?height=18&color=%231428a0",
            },
            {
              label: "UnionPay",
              src: "/payments/unionpay.svg",
              fallbackSrc:
                "https://api.iconify.design/logos/unionpay.svg?height=18",
            },
            {
              label: "JCB",
              src: "/payments/jcb.svg",
              fallbackSrc: "https://api.iconify.design/logos/jcb.svg?height=18",
            },
            {
              label: "Diners Club",
              src: "/payments/diners-club.svg",
              fallbackSrc:
                "https://api.iconify.design/fa6-brands/cc-diners-club.svg?height=18&color=%230079be",
            },
          ].map((icon) => (
            <PaymentIcon key={`${icon.label}:${icon.src}`} icon={icon} />
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-stone-200" />
          <span className="text-[10px] uppercase tracking-[0.3em] text-stone-400">
            or
          </span>
          <span className="h-px flex-1 bg-stone-200" />
        </div>
        <CheckoutButton
          items={items}
          deliveryAddress={addressForQuote}
          deliveryAddressLine1={addressLine1.trim()}
          deliveryAddressLine2={addressLine2.trim()}
          deliveryCity={addressCity.trim()}
          deliveryState={addressState.trim()}
          deliveryPostalCode={postalCode.trim()}
          deliveryCountry={country.trim()}
          deliveryFloor={addressFloor.trim()}
          orderComment={orderComment.trim()}
          phone={checkoutPhone}
          email={checkoutEmail}
          disabled={paypalCheckoutDisabled}
          onBusyChange={setCheckoutBusy}
          label="Pay with PayPal"
          paymentMethod="paypal"
          iconSrc="/paypal.webp"
          iconAlt="PayPal"
          iconClassName="h-4 w-auto"
        />
        <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
          Secure checkout with Stripe or PayPal
        </p>
      </div>
    </div>
  );
}

