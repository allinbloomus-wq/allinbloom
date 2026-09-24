export const SITE_NAME = "All in Bloom Floral Studio";
export const SITE_TAGLINE = "Wheeling flower delivery and luxury bouquets.";
export const SITE_DESCRIPTION =
  "All in Bloom Floral Studio is a flower and balloon shop located in Wheeling, Illinois, serving Wheeling and Chicago’s Northwest Suburbs.";
export const SITE_KEYWORDS = [
  "Chicago florist",
  "Chicago flower delivery",
  "same-day flowers Chicago",
  "luxury bouquets Chicago",
  "flower shop Chicago",
  "wedding flowers Chicago",
  "romantic bouquets",
  "florist choice bouquet",
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

const RAW_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://allinbloom.us";

export const SITE_ORIGIN = RAW_SITE_URL.startsWith("http")
  ? RAW_SITE_URL
  : `https://${RAW_SITE_URL}`;
