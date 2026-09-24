import type { Metadata } from "next";
import CatalogListing from "@/components/catalog-listing";

export const metadata: Metadata = {
  title: "Gift Boxes in Wheeling, IL",
  description:
    "Gift boxes you can send alone or add to a bouquet. Order online from All in Bloom Floral Studio with same-day delivery around Wheeling, IL.",
  alternates: { canonical: "/gifts" },
  openGraph: {
    title: "Gift Boxes | All in Bloom Floral Studio",
    description:
      "Gift boxes to send alone or with flowers, delivered from Wheeling, IL.",
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
