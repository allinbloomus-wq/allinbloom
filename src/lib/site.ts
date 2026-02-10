export const SITE_NAME = "All in Bloom Floral Studio";
export const SITE_TAGLINE = "Chicago flower delivery and luxury bouquets.";
export const SITE_DESCRIPTION =
  "Chicago flower delivery with curated bouquets, same-day options, and florist-designed arrangements for every occasion.";
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

export const SITE_EMAIL = "hello@allinbloom.com";
export const SITE_PHONE = "+1-224-213-3823";
export const SITE_CITY = "Chicago";
export const SITE_REGION = "IL";
export const SITE_COUNTRY = "US";
export const SITE_INSTAGRAM =
  "https://www.instagram.com/all_in_bloom_studio";

const RAW_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXTAUTH_URL ||
  "https://allinbloom.us";

export const SITE_ORIGIN = RAW_SITE_URL.startsWith("http")
  ? RAW_SITE_URL
  : `https://${RAW_SITE_URL}`;
