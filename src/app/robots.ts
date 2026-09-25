import type { MetadataRoute } from "next";
import { SITE_ORIGIN } from "@/lib/site";

const PRIVATE_PATHS = ["/admin", "/account", "/auth", "/cart", "/checkout", "/api"];

// AI search / answer-engine crawlers are allowed explicitly so the studio can
// be cited in AI answers; private paths stay closed to every crawler.
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "PerplexityBot",
  "Google-Extended",
  "Applebot-Extended",
];

export default function robots(): MetadataRoute.Robots {
  const baseUrl = SITE_ORIGIN.replace(/\/$/, "");
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE_PATHS },
      { userAgent: AI_CRAWLERS, allow: "/", disallow: PRIVATE_PATHS },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
