import type { Metadata } from "next";
import CatalogListing from "@/components/catalog-listing";

export const metadata: Metadata = {
  title: "Flower & Balloon Delivery in Wheeling, IL",
  description:
    "Same-day balloon and flower delivery in Wheeling, IL. Balloon bouquets for birthdays, baby showers and parties, on their own or with flowers.",
  alternates: { canonical: "/balloons" },
  openGraph: {
    title: "Flower & Balloon Delivery | All in Bloom Floral Studio",
    description:
      "Same-day balloon and flower delivery in Wheeling, IL.",
    url: "/balloons",
  },
};

export default function BalloonsPage() {
  return (
    <CatalogListing
      catalogType="BALOONS"
      eyebrow="Balloons"
      title="Balloons for birthdays and parties"
      description="Balloon sets you can order on their own or add to flowers. Ready for pickup or delivery."
      productLabel="balloons"
      emptyMessage="No balloons available right now. Please check back soon or give us a call."
    />
  );
}
