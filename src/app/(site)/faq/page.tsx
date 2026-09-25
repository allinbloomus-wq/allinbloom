import type { Metadata } from "next";
import Link from "next/link";
import { FAQ_GROUPS, FAQ_ITEMS } from "@/lib/faq";
import { breadcrumbSchema, faqSchema, toJsonLd } from "@/lib/schema";
import { SITE_PHONE, SITE_PHONE_DISPLAY } from "@/lib/site";

export const metadata: Metadata = {
  title: "FAQ: Flower Delivery, Custom Bouquets & Balloons in Wheeling, IL",
  description:
    "Answers about same-day flower delivery in Wheeling, IL, delivery areas, pickup, custom bouquets, Bubble Balloons, weddings, events and corporate flowers.",
  alternates: {
    canonical: "/faq",
  },
  openGraph: {
    title: "FAQ | All in Bloom Floral Studio, Wheeling, IL",
    description:
      "Same-day delivery, delivery areas, custom bouquets, balloons, weddings and corporate flowers: everything you need to know before ordering.",
    url: "/faq",
  },
};

export default function FaqPage() {
  const phoneNumber = SITE_PHONE.replace(/[^+\d]/g, "");
  const jsonLd = toJsonLd(
    faqSchema(FAQ_ITEMS, "/faq"),
    breadcrumbSchema([{ name: "FAQ", path: "/faq" }])
  );

  return (
    <div className="grid min-w-0 gap-9 sm:gap-14 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />

      <header className="min-w-0 space-y-4 sm:space-y-5 lg:col-span-2 lg:max-w-3xl">
        <h1 className="text-balance text-3xl font-semibold text-stone-900 sm:text-5xl">
          Frequently asked questions
        </h1>
        <p className="max-w-[65ch] text-base leading-relaxed text-stone-600">
          Same-day flower delivery, custom bouquets, balloons and event florals
          from our studio in Wheeling, IL. Can&apos;t find your answer? Call{" "}
          <a
            href={`tel:${phoneNumber}`}
            className="font-medium text-stone-800 underline decoration-stone-300 underline-offset-4 transition hover:text-[color:var(--brand)] hover:decoration-[color:var(--brand)]"
          >
            {SITE_PHONE_DISPLAY}
          </a>{" "}
          and a florist will help.
        </p>
      </header>

      <nav aria-label="FAQ topics" className="min-w-0 lg:sticky lg:top-28 lg:self-start">
        <ul className="flex max-w-full gap-2 overflow-x-auto pb-2 lg:flex-col lg:gap-1 lg:overflow-visible">
          {FAQ_GROUPS.map((group) => (
            <li key={group.id} className="shrink-0">
              <a
                href={`#${group.id}`}
                className="flex min-h-11 items-center rounded-full border border-stone-200 bg-white/70 px-4 py-2 text-sm text-stone-700 transition hover:border-[color:var(--brand)] hover:text-[color:var(--brand)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brand)] lg:rounded-xl lg:border-transparent lg:bg-transparent lg:px-3"
              >
                {group.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="min-w-0 space-y-12 sm:space-y-16">
        {FAQ_GROUPS.map((group) => (
          <section
            key={group.id}
            id={group.id}
            aria-labelledby={`${group.id}-title`}
            className="scroll-mt-28"
          >
            <div className="mb-4 flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-baseline sm:justify-between sm:gap-x-6 sm:gap-y-2">
              <h2
                id={`${group.id}-title`}
                className="font-[family-name:var(--font-script)] text-[2rem] leading-none text-[color:var(--brand)] sm:text-[2.4rem]"
              >
                {group.title}
              </h2>
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                {group.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="inline-flex min-h-11 items-center text-stone-600 underline decoration-stone-300 underline-offset-4 transition hover:text-[color:var(--brand)] hover:decoration-[color:var(--brand)]"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="divide-y divide-stone-200 border-y border-stone-200">
              {group.items.map(({ q, a }) => (
                <details key={q} className="group">
                  <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-base font-medium text-stone-900 transition hover:text-[color:var(--brand)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--brand)] sm:gap-6 sm:py-5 sm:text-lg [&::-webkit-details-marker]:hidden">
                    <span className="min-w-0 text-pretty">{q}</span>
                    <svg
                      aria-hidden
                      viewBox="0 0 20 20"
                      className="h-5 w-5 shrink-0 text-stone-400 transition-transform duration-300 group-open:rotate-45 group-open:text-[color:var(--brand)]"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    >
                      <path d="M10 3v14M3 10h14" />
                    </svg>
                  </summary>
                  <div className="max-w-[68ch] space-y-3 pb-6 pr-2 text-base leading-relaxed text-stone-600 sm:pr-10">
                    {a.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </section>
        ))}

        <section className="min-w-0 rounded-[24px] bg-[color:var(--brand)] px-5 py-7 text-white shadow-[0_18px_40px_rgba(var(--brand-rgb),0.25)] sm:rounded-[28px] sm:px-10 sm:py-10">
          <h2 className="text-2xl font-semibold sm:text-3xl">
            Still deciding? Talk to a florist.
          </h2>
          <p className="mt-3 max-w-[60ch] text-base leading-relaxed text-white/85">
            Tell us the occasion, colors and budget, and we&apos;ll design
            something for pickup or local delivery.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              href={`tel:${phoneNumber}`}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-4 py-3 text-center text-sm font-semibold uppercase tracking-[0.12em] text-[color:var(--brand-dark)] transition hover:-translate-y-0.5 sm:px-6 sm:tracking-[0.2em]"
            >
              Call {SITE_PHONE_DISPLAY}
            </a>
            <Link
              href="/catalog"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/60 px-4 py-3 text-center text-sm font-semibold uppercase tracking-[0.12em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 sm:px-6 sm:tracking-[0.2em]"
            >
              Shop flowers
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
