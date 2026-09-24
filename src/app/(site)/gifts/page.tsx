import type { Metadata } from "next";
import CatalogListing from "@/components/catalog-listing";

export const metadata: Metadata = {
  title: "Flower & Gift Box Delivery in Wheeling, IL",
  description:
    "Same-day flower and gift box delivery in Wheeling, IL. Send a gift box on its own or add it to a bouquet from All in Bloom Floral Studio.",
  alternates: { canonical: "/gifts" },
  openGraph: {
    title: "Flower & Gift Box Delivery | All in Bloom Floral Studio",
    description:
      "Same-day flower and gift box delivery in Wheeling, IL.",
    url: "/gifts",
  },
};

export default function GiftsPage() {
  return (
    <CatalogListing
      catalogType="GIFTS"
      eyebrow="Gift Box"
      title="Gift boxes"
      description="Send a gift box on its own or add one to your bouquet order."
      cardVariant="gift"
      productLabel="gift boxes"
      emptyMessage="No gift boxes available right now. Please check back soon."
    />
  );
}
