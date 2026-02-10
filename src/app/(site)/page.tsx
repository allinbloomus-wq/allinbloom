import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import BouquetCard from "@/components/bouquet-card";
import FloristChoiceForm from "@/components/florist-choice-form";
import PromoCard from "@/components/promo-card";
import PromoGallery from "@/components/promo-gallery";
import { getFeaturedBouquets } from "@/lib/data/bouquets";
import { getActivePromoSlides } from "@/lib/data/promotions";
import { getStoreSettings } from "@/lib/data/settings";
import { getBouquetPricing } from "@/lib/pricing";
import {
  SITE_CITY,
  SITE_COUNTRY,
  SITE_DESCRIPTION,
  SITE_EMAIL,
  SITE_INSTAGRAM,
  SITE_NAME,
  SITE_ORIGIN,
  SITE_PHONE,
  SITE_REGION,
  SITE_TAGLINE,
} from "@/lib/site";

export const metadata: Metadata = {
  title: "Chicago Flower Delivery & Luxury Bouquets",
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Chicago Flower Delivery & Luxury Bouquets",
    description: SITE_DESCRIPTION,
    url: "/",
    images: [
      {
        url: "/images/hero-bouquet.png",
        alt: SITE_TAGLINE,
      },
    ],
  },
};

const galleryImages = [
  "/images/bouquet-1.png",
  "/images/bouquet-2.png",
  "/images/bouquet-3.png",
  "/images/bouquet-4.png",
  "/images/bouquet-5.png",
  "/images/bouquet-6.png",
];

export default async function HomePage() {
  const featured = await getFeaturedBouquets();
  const promoSlides = await getActivePromoSlides();
  const settings = await getStoreSettings();
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "Florist",
    name: SITE_NAME,
    url: SITE_ORIGIN,
    image: `${SITE_ORIGIN}/images/hero-bouquet.png`,
    description: SITE_DESCRIPTION,
    telephone: SITE_PHONE,
    email: SITE_EMAIL,
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      addressLocality: SITE_CITY,
      addressRegion: SITE_REGION,
      addressCountry: SITE_COUNTRY,
    },
    areaServed: `${SITE_CITY}, ${SITE_REGION}`,
    sameAs: [SITE_INSTAGRAM],
    openingHours: ["Mo-Sa 09:00-19:00"],
  };

  return (
    <div className="flex flex-col gap-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessSchema),
        }}
      />
      <section className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center animate-rise">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-xs uppercase tracking-[0.24em] text-stone-700 shadow-sm">
            Chicago delivery in 2-4 hours
          </div>
          <h1 className="text-4xl font-semibold text-stone-900 sm:text-5xl lg:text-6xl">
            All in Bloom Floral Studio
          </h1>
          <p className="max-w-xl text-balance text-lg text-stone-700">
            A modern floral atelier for soft, romantic bouquets and effortless
            gifting. Curated by artisan florists, designed for every elegant
            moment in your life.
          </p>
          <div className="relative animate-float lg:hidden">
            <div className="glass absolute right-6 top-6 z-10 hidden h-14 w-36 rounded-full border border-white/80 text-xs font-semibold uppercase tracking-[0.3em] text-stone-700 sm:flex items-center justify-center">
              New arrivals
            </div>
            <div className="glass overflow-hidden rounded-[32px] border border-white/80 p-4">
              <Image
                src="/images/hero-bouquet.png"
                alt="Elegant floral bouquet"
                width={520}
                height={640}
                className="h-auto w-full rounded-[26px] object-cover"
                priority
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/catalog"
              className="rounded-full bg-[color:var(--brand)] px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[color:var(--brand-dark)]"
            >
              Shop bouquets
            </Link>
            <Link
              href="/catalog?filter=featured"
              className="rounded-full border border-[color:var(--brand)]/30 bg-white/70 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--brand)] transition hover:border-[color:var(--brand)]/60"
            >
              Explore signature sets
            </Link>
          </div>
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
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Seasonal stems", value: "125+" },
              { label: "Happy clients", value: "4.9/5" },
              { label: "Chicago neighborhoods", value: "18" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-3xl border border-white/80 bg-white/70 px-4 py-3 text-center shadow-sm"
              >
                <p className="text-xl font-semibold text-stone-900">
                  {item.value}
                </p>
                <p className="text-xs uppercase tracking-[0.22em] text-stone-500">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="relative animate-float hidden lg:block">
          <div className="glass absolute right-6 top-6 z-10 hidden h-14 w-36 rounded-full border border-white/80 text-xs font-semibold uppercase tracking-[0.3em] text-stone-700 sm:flex items-center justify-center">
            New arrivals
          </div>
          <div className="glass overflow-hidden rounded-[32px] border border-white/80 p-4">
            <Image
              src="/images/hero-bouquet.png"
              alt="Elegant floral bouquet"
              width={520}
              height={640}
              className="h-auto w-full rounded-[26px] object-cover"
              priority
            />
          </div>
        </div>
      </section>

      <section className="space-y-6 animate-rise [animation-delay:200ms]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-stone-500">
              Signature bouquets
            </p>
            <h2 className="text-3xl font-semibold text-stone-900 sm:text-4xl">
              Our curated favorites
            </h2>
          </div>
          <Link
            href="/catalog?filter=featured"
            className="rounded-full border border-stone-300 bg-white/80 px-5 py-2 text-xs uppercase tracking-[0.3em] text-stone-600 transition hover:border-stone-400"
          >
            View all
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featured.map((bouquet) => (
            <BouquetCard
              key={bouquet.id}
              bouquet={bouquet}
              pricing={getBouquetPricing(bouquet, settings)}
            />
          ))}
        </div>
      </section>

      <section className="animate-rise [animation-delay:80ms]">
        <PromoGallery slides={promoSlides} />
      </section>

      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center animate-rise [animation-delay:280ms]">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.32em] text-stone-500">
            About the atelier
          </p>
          <h2 className="text-3xl font-semibold text-stone-900 sm:text-4xl">
            A poetic studio of blooms, fragrance, and quiet luxury
          </h2>
          <p className="text-sm leading-relaxed text-stone-600">
            All in Bloom Floral Studio blends old-world floral artistry with
            contemporary styling. Our designers source premium stems from local
            growers across the Chicago area, then compose each bouquet with a
            signature airy silhouette, tactile textures, and a soft palette that
            feels both timeless and modern.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <PromoCard
              title="Weekly edit"
              description="New seasonal curation drops every Thursday."
            />
            <PromoCard
              title="Luxury wraps"
              description="Matte paper, satin ribbon, and custom wax seal."
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {galleryImages.map((src) => (
            <div
              key={src}
              className="glass overflow-hidden rounded-[28px] border border-white/80 aspect-square"
            >
              <Image
                src={src}
                alt="Bouquet gallery preview"
                width={400}
                height={400}
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2 animate-rise [animation-delay:360ms]">
        <PromoCard
          title="Valentine Week Offer"
          description="Enjoy 15% off romantic rose collections and free delivery on all orders above $120."
          tone="rose"
        />
        <PromoCard
          title="Bridal Atelier"
          description="Reserve a bespoke wedding consultation with our senior florist team."
          tone="leaf"
        />
      </section>

      <section className="grid gap-10 rounded-[36px] border border-white/80 bg-white/70 p-8 shadow-sm lg:grid-cols-[1fr_1.1fr] animate-rise [animation-delay:480ms]">
        <div className="space-y-5">
          <p className="text-xs uppercase tracking-[0.32em] text-stone-500">
            FLORIST CHOICE BOUQUET
          </p>
          <h2 className="text-3xl font-semibold text-stone-900 sm:text-4xl">
            Let our florists craft a bouquet just for you
          </h2>
          <p className="text-sm leading-relaxed text-stone-600">
            Choose your mood, palette, and price point. We will hand-pick the
            freshest stems and design a one-of-a-kind bouquet with a personal
            note from our atelier.
          </p>
          <ul className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.22em] text-stone-500">
            <li className="rounded-full border border-stone-200 bg-white/70 px-3 py-1">
              same-day delivery
            </li>
            <li className="rounded-full border border-stone-200 bg-white/70 px-3 py-1">
              seasonal selection
            </li>
            <li className="rounded-full border border-stone-200 bg-white/70 px-3 py-1">
              handwritten note
            </li>
          </ul>
        </div>
        <FloristChoiceForm />
      </section>

      <section className="grid gap-6 rounded-[36px] border border-white/80 bg-white/70 p-8 shadow-sm lg:grid-cols-[0.9fr_1.1fr] animate-rise [animation-delay:520ms]">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.32em] text-stone-500">
            Visit our studio
          </p>
          <h2 className="text-3xl font-semibold text-stone-900 sm:text-4xl">
            Find All in Bloom Floral Studio in Chicago
          </h2>
          <p className="text-sm leading-relaxed text-stone-600">
            Stop by our studio for same-day bouquets, custom arrangements, and
            in-person consultations. We are open six days a week and always
            happy to help you choose the perfect stems.
          </p>
        </div>
        <div className="overflow-hidden rounded-[28px] border border-white/80 bg-white">
          <iframe
            title="All in Bloom Floral Studio map"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d379077.60318086424!2d-88.79021143865815!3d42.07439745469514!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x880fa5438e640395%3A0xc9a43fb3bbb9b85c!2z0KDQvtC70LvQuNC90LMg0JzQtdC00L7Rg9GBLCDQmNC70LvQuNC90L7QudGBIDYwMDA4LCDQodCo0JA!5e0!3m2!1sen!2sus!4v1770372032469!5m2!1sen!2sus"
            className="h-[280px] w-full sm:h-[360px]"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </section>
    </div>
  );
}
