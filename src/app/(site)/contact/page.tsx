import type { Metadata } from "next";
import ContactForm from "@/components/contact-form";
import { SITE_DESCRIPTION } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact | Chicago Flower Delivery",
  description:
    "Contact All in Bloom Floral Studio for custom bouquets, corporate gifting, and event florals in Chicago.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact | Chicago Flower Delivery",
    description: SITE_DESCRIPTION,
    url: "/contact",
  },
};

export default function ContactPage() {
  return (
    <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
      <div className="space-y-4">
        <p className="text-xs uppercase tracking-[0.32em] text-stone-500">
          Contact
        </p>
        <h1 className="text-4xl font-semibold text-stone-900 sm:text-5xl">
          We are here for your floral moments
        </h1>
        <p className="text-sm leading-relaxed text-stone-600">
          Ask about custom bouquets, corporate subscriptions, or event florals.
          Our concierge team responds within one business day.
        </p>
        <div className="space-y-2 text-sm text-stone-600">
          <p>Studio hotline: +1 (224) 213-3823</p>
          <p>Email: allinbloom.us@gmail.com</p>
          <p>Hours: Mon-Sat 9:00 AM to 7:00 PM</p>
          <a
            href="https://www.instagram.com/all_in_bloom_studio"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-3 rounded-full bg-[color:var(--brand)] px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white shadow-[0_12px_28px_rgba(108,20,10,0.28)] transition hover:-translate-y-0.5 hover:bg-[color:var(--brand-dark)]"
          >
            Instagram
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-4 w-4 text-white/90"
            >
              <path
                fill="currentColor"
                d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm0 2a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H7Zm10 1.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm0 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z"
              />
            </svg>
          </a>
        </div>
      </div>
      <ContactForm />
    </div>
  );
}
