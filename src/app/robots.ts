import type { MetadataRoute } from "next";
import { SITE_ORIGIN } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = SITE_ORIGIN.replace(/\/$/, "");
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/account", "/auth", "/cart", "/checkout", "/api"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
