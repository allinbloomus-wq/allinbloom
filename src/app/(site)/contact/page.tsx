import type { Metadata } from "next";
import Image from "next/image";
import ContactForm from "@/components/contact-form";
import { SITE_DESCRIPTION, SITE_PHONE } from "@/lib/site";

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
  const smsNumber = SITE_PHONE.replace(/[^+\d]/g, "");

  return (
    <div className="grid gap-8 sm:gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
      <div className="space-y-4">
        <p className="text-xs uppercase tracking-[0.32em] text-stone-500">
          Contact
        </p>
        <h1 className="text-3xl font-semibold text-stone-900 sm:text-5xl">
          We are here for your floral moments
        </h1>
        <p className="text-sm leading-relaxed text-stone-600">
          Ask about custom bouquets, corporate subscriptions, or event florals.
          Our concierge team responds within one business day.
        </p>
        <div className="space-y-2 text-sm text-stone-600">
          <p>
            Studio hotline:{" "}
            <a
              href={`sms:${smsNumber}`}
              className="font-medium text-stone-700 underline decoration-stone-300 underline-offset-4 transition hover:text-[color:var(--brand)] hover:decoration-[color:var(--brand)]"
            >
              +1 (224) 213-3823
            </a>
          </p>
          <p>Email: allinbloom.us@gmail.com</p>
          <p>Hours: Mon-Sat 9:00 AM to 7:00 PM</p>
          <a
            href="https://www.instagram.com/all_in_bloom_studio"
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-[color:var(--brand)] px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white shadow-[0_12px_28px_rgba(108,20,10,0.28)] transition hover:-translate-y-0.5 hover:bg-[color:var(--brand-dark)] sm:w-auto"
          >
            Instagram
            <Image
              src="/instagram.png"
              alt=""
              aria-hidden
              width={16}
              height={16}
              className="h-4 w-4 object-contain"
            />
          </a>
        </div>
      </div>
      <ContactForm />
    </div>
  );
}
