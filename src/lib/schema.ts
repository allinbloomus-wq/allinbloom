import {
  SITE_ADDRESS_LINE_1,
  SITE_CITY,
  SITE_COUNTRY,
  SITE_DELIVERY_AREAS,
  SITE_DESCRIPTION,
  SITE_EMAIL,
  SITE_GEO,
  SITE_INSTAGRAM,
  SITE_MAP_URL,
  SITE_NAME,
  SITE_ORIGIN,
  SITE_PHONE,
  SITE_POSTAL_CODE,
  SITE_REGION,
} from "@/lib/site";

// Structured data (schema.org JSON-LD). Entities share stable @id values so
// search engines can join the business, website and page graphs together.
const ORIGIN = SITE_ORIGIN.replace(/\/$/, "");

export const absoluteUrl = (path = "/") =>
  path.startsWith("http") ? path : `${ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;

export const BUSINESS_ID = `${ORIGIN}/#florist`;
export const WEBSITE_ID = `${ORIGIN}/#website`;

export function floristSchema(image = "/images/hero-bouquet.webp") {
  return {
    "@type": "Florist",
    "@id": BUSINESS_ID,
    name: SITE_NAME,
    alternateName: "All in Bloom",
    url: `${ORIGIN}/`,
    logo: absoluteUrl("/logo.png"),
    image: absoluteUrl(image),
    description: SITE_DESCRIPTION,
    telephone: SITE_PHONE,
    email: SITE_EMAIL,
    priceRange: "$$",
    currenciesAccepted: "USD",
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE_ADDRESS_LINE_1,
      addressLocality: SITE_CITY,
      addressRegion: SITE_REGION,
      postalCode: SITE_POSTAL_CODE,
      addressCountry: SITE_COUNTRY,
    },
    geo: { "@type": "GeoCoordinates", ...SITE_GEO },
    hasMap: SITE_MAP_URL,
    areaServed: [
      ...SITE_DELIVERY_AREAS.map((name) => ({
        "@type": "City",
        name: `${name}, ${SITE_REGION}`,
      })),
      { "@type": "AdministrativeArea", name: "Northwest Chicago Suburbs, IL" },
    ],
    knowsAbout: [
      "Same-day flower delivery",
      "Custom bouquets",
      "Designer's Choice bouquets",
      "Personalized Bubble Balloons",
      "Balloon arrangements",
      "Gift boxes",
      "Wedding flowers",
      "Event florals",
      "Corporate flowers",
    ],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Flowers, balloons and gifts",
      itemListElement: [
        { name: "Bouquets", path: "/catalog" },
        { name: "Balloons", path: "/balloons" },
        { name: "Gift boxes", path: "/gifts" },
        { name: "Event space", path: "/event-space" },
      ].map(({ name, path }) => ({
        "@type": "OfferCatalog",
        name,
        url: absoluteUrl(path),
      })),
    },
    sameAs: [SITE_INSTAGRAM],
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "08:30",
        closes: "17:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Saturday",
        opens: "10:00",
        closes: "18:00",
      },
    ],
  };
}

export function websiteSchema() {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: SITE_NAME,
    url: `${ORIGIN}/`,
    inLanguage: "en-US",
    publisher: { "@id": BUSINESS_ID },
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "Home", path: "/" }, ...items].map(
      ({ name, path }, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name,
        item: absoluteUrl(path),
      })
    ),
  };
}

export function faqSchema(items: { q: string; a: string }[], path: string) {
  return {
    "@type": "FAQPage",
    "@id": `${absoluteUrl(path)}#faq`,
    url: absoluteUrl(path),
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": BUSINESS_ID },
    mainEntity: items.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}

export const toJsonLd = (...nodes: object[]) =>
  JSON.stringify({ "@context": "https://schema.org", "@graph": nodes }).replace(
    /</g,
    "\\u003c"
  );
