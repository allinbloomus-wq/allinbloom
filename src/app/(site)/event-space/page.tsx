import type { Metadata } from "next";
import CatalogListing from "@/components/catalog-listing";

export const metadata: Metadata = {
  title: "Event Space Rental in Wheeling, IL",
  description:
    "Rent our flower studio in Wheeling, IL for birthdays, bridal showers, workshops and photo shoots. Compare packages and book online.",
  alternates: { canonical: "/event-space" },
  openGraph: {
    title: "Event Space | All in Bloom Floral Studio",
    description:
      "Rent our flower studio in Wheeling, IL for small parties, showers and workshops.",
    url: "/event-space",
  },
};

export default function EventSpacePage() {
  return (
    <CatalogListing
      catalogType="EVENT_SPACE"
      eyebrow="Event space"
      title="Host your event at our studio"
      description="A space full of flowers for small parties, showers and workshops. Compare packages and book the one that fits."
      cardVariant="event"
      productLabel="event spaces"
      emptyMessage="Event-space options are coming soon. Please contact our studio for availability."
      includeFirstOrderDiscount={false}
    />
  );
}
