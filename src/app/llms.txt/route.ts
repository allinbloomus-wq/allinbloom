import { FAQ_ITEMS } from "@/lib/faq";
import {
  SITE_ADDRESS_LINE_1,
  SITE_CITY,
  SITE_DELIVERY_AREAS,
  SITE_EMAIL,
  SITE_HOURS,
  SITE_NAME,
  SITE_ORIGIN,
  SITE_PHONE_DISPLAY,
  SITE_POSTAL_CODE,
  SITE_REGION,
} from "@/lib/site";

// llms.txt: a plain-text summary for AI assistants and answer engines.
export const dynamic = "force-static";

export function GET() {
  const base = SITE_ORIGIN.replace(/\/$/, "");
  const body = `# ${SITE_NAME}

> Local flower and gift studio at ${SITE_ADDRESS_LINE_1}, ${SITE_CITY}, ${SITE_REGION} ${SITE_POSTAL_CODE}. Same-day flower delivery in Wheeling and the Northwest Chicago suburbs: modern bouquets, custom and Designer's Choice arrangements, personalized Bubble Balloons, balloon arrangements, gift boxes, wedding and event florals, and corporate flowers.

- Phone: ${SITE_PHONE_DISPLAY}
- Email: ${SITE_EMAIL}
- Hours: ${SITE_HOURS.map(({ label, hours }) => `${label} ${hours}`).join("; ")}
- Delivery areas: ${SITE_DELIVERY_AREAS.join(", ")}, and selected North and Northwest Chicago neighborhoods.

## Pages

- [Flowers & bouquets](${base}/catalog): bouquets available for same-day delivery or pickup
- [Balloons](${base}/balloons): personalized Bubble Balloons and balloon arrangements
- [Gift boxes](${base}/gifts): flower and gift sets
- [Event space](${base}/event-space): studio event space and event florals
- [Reviews](${base}/reviews): customer reviews
- [FAQ](${base}/faq): delivery, pickup, custom orders, weddings and corporate flowers
- [Contact](${base}/contact): address, phone and hours

## FAQ

${FAQ_ITEMS.map(({ q, a }) => `### ${q}\n${a}`).join("\n\n")}
`;
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
