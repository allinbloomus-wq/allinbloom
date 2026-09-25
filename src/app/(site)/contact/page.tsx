import type { Metadata } from "next";
import Link from "next/link";
import ContactForm from "@/components/contact-form";
import {
  SITE_ADDRESS_LINE_1,
  SITE_CITY,
  SITE_EMAIL,
  SITE_HOURS,
  SITE_INSTAGRAM,
  SITE_MAP_URL,
  SITE_PHONE,
  SITE_PHONE_DISPLAY,
  SITE_POSTAL_CODE,
  SITE_REGION,
} from "@/lib/site";

export const metadata: Metadata = {
  title: "Flower Delivery Wheeling, IL: Contact, Address & Hours",
  description:
    "Order flower delivery by phone or visit All in Bloom Floral Studio at 224 S Milwaukee Ave, Wheeling, IL. Custom bouquets, corporate orders and events.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact | Flower Delivery in Wheeling, IL",
    description:
      "Phone, address and hours of All in Bloom Floral Studio, flower delivery in Wheeling, IL.",
    url: "/contact",
  },
};

const linkClass =
  "font-medium text-stone-800 underline decoration-stone-300 underline-offset-4 transition hover:text-[color:var(--brand)] hover:decoration-[color:var(--brand)]";

export default function ContactPage() {
  const phoneNumber = SITE_PHONE.replace(/[^+\d]/g, "");

  return (
    <div className="space-y-8 sm:space-y-10">
      <header className="space-y-4">
        <h1 className="text-3xl font-semibold text-stone-900 sm:text-5xl">
          Get in touch
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-stone-600 sm:text-base">
          Questions about an order, a custom bouquet, corporate flowers or an
          event? Call us or send a message, and we&apos;ll reply within one
          business day. Delivery areas and custom orders are covered in the{" "}
          <Link href="/faq" className={linkClass}>
            FAQ
          </Link>
          .
        </p>
      </header>
      <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
        <dl className="glass flex flex-col justify-between divide-y divide-stone-300/70 rounded-[28px] border border-white/80 px-5 py-2 text-sm sm:px-6">
          <div className="grid grid-cols-[6rem_1fr] items-baseline gap-4 py-3.5">
            <dt className="text-stone-500">Phone</dt>
            <dd>
              <a href={`tel:${phoneNumber}`} className={linkClass}>
                {SITE_PHONE_DISPLAY}
              </a>
            </dd>
          </div>
          <div className="grid grid-cols-[6rem_1fr] items-baseline gap-4 py-3.5">
            <dt className="text-stone-500">Email</dt>
            <dd className="break-all">
              <a href={`mailto:${SITE_EMAIL}`} className={linkClass}>
                {SITE_EMAIL}
              </a>
            </dd>
          </div>
          <div className="grid grid-cols-[6rem_1fr] items-baseline gap-4 py-3.5">
            <dt className="text-stone-500">Studio</dt>
            <dd className="text-stone-800">
              {SITE_ADDRESS_LINE_1}
              <br />
              {SITE_CITY}, {SITE_REGION} {SITE_POSTAL_CODE}
              <br />
              <a
                href={SITE_MAP_URL}
                target="_blank"
                rel="noreferrer"
                className={`mt-1 inline-block ${linkClass}`}
              >
                Get directions
              </a>
            </dd>
          </div>
          <div className="grid grid-cols-[6rem_1fr] items-baseline gap-4 py-3.5">
            <dt className="text-stone-500">Hours</dt>
            <dd className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-stone-800">
              {SITE_HOURS.map(({ label, hours }) => (
                <span key={label} className="contents">
                  <span>{label}</span>
                  <span className="whitespace-nowrap tabular-nums">{hours}</span>
                </span>
              ))}
            </dd>
          </div>
          <div className="grid grid-cols-[6rem_1fr] items-baseline gap-4 py-3.5">
            <dt className="text-stone-500">Instagram</dt>
            <dd>
              <a
                href={SITE_INSTAGRAM}
                target="_blank"
                rel="noreferrer"
                className={linkClass}
              >
                @all_in_bloom_studio
              </a>
            </dd>
          </div>
        </dl>
        <ContactForm />
      </div>
    </div>
  );
}
