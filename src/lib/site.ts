export const SITE_NAME = "All in Bloom Floral Studio";
export const SITE_TAGLINE = "Same-day flower delivery in Wheeling, IL and nearby suburbs.";
export const SITE_DESCRIPTION =
  "Same-day flower delivery in Wheeling, IL and nearby suburbs: Buffalo Grove, Arlington Heights, Northbrook and more. Fresh bouquets, balloons and gift boxes.";
export const SITE_KEYWORDS = [
  "flower delivery Wheeling IL",
  "same-day flower delivery",
  "flower delivery near me",
  "florist Wheeling IL",
  "flower shop near me",
  "balloons Wheeling IL",
  "Buffalo Grove florist",
  "Arlington Heights flower delivery",
  "Buffalo Grove flower delivery",
  "Northbrook flower delivery",
  "Northwest suburbs florist",
  "gift boxes",
  "All in Bloom Floral Studio",
];

export const SITE_EMAIL = "allinbloom.us@gmail.com";
export const SITE_PHONE = "+1-224-213-3823";
export const SITE_PHONE_DISPLAY = "(224) 213-3823";
export const SITE_ADDRESS_LINE_1 = "224 S Milwaukee Ave";
export const SITE_CITY = "Wheeling";
export const SITE_REGION = "IL";
export const SITE_POSTAL_CODE = "60090";
export const SITE_COUNTRY = "US";
export const SITE_HOURS = [
  { label: "Monday–Friday", hours: "8:30 AM–5:00 PM" },
  { label: "Saturday", hours: "10:00 AM–6:00 PM" },
  { label: "Sunday", hours: "Closed" },
] as const;
export const SITE_INSTAGRAM =
  "https://www.instagram.com/all_in_bloom_studio";
export const SITE_GEO = {
  latitude: 42.136281087564285,
  longitude: -87.9050852153543,
} as const;
export const SITE_MAP_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `${SITE_ADDRESS_LINE_1}, ${SITE_CITY}, ${SITE_REGION} ${SITE_POSTAL_CODE}`
)}`;
export const SITE_DELIVERY_AREAS = [
  "Wheeling",
  "Buffalo Grove",
  "Arlington Heights",
  "Prospect Heights",
  "Rolling Meadows",
  "Mount Prospect",
  "Palatine",
  "Northbrook",
  "Glenview",
  "Lincolnshire",
  "Deerfield",
  "Vernon Hills",
  "Mundelein",
  "Lake Zurich",
  "Barrington",
  "Schaumburg",
  "Hoffman Estates",
  "Elk Grove Village",
  "Des Plaines",
  "Park Ridge",
  "Niles",
  "Morton Grove",
  "Skokie",
  "Evanston",
] as const;

const RAW_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://allinbloom.us";

export const SITE_ORIGIN = RAW_SITE_URL.startsWith("http")
  ? RAW_SITE_URL
  : `https://${RAW_SITE_URL}`;
