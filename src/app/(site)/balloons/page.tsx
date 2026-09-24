import type { Metadata } from "next";
import CatalogListing from "@/components/catalog-listing";

export const metadata: Metadata = {
  title: "Balloons in Wheeling, IL: Birthday & Party Balloons",
  description:
    "Balloon bouquets for birthdays, baby showers and parties. Pick up in Wheeling, IL or order with same-day delivery.",
  alternates: { canonical: "/balloons" },
  openGraph: {
    title: "Balloons | All in Bloom Floral Studio",
    description:
      "Balloon bouquets for birthdays and parties with same-day delivery from Wheeling, IL.",
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
