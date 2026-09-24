import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import BouquetCard from "@/components/bouquet-card";
import GalleryImageLightbox from "@/components/gallery-image-lightbox";
import FloristChoiceForm from "@/components/florist-choice-form";
import PromoCard from "@/components/promo-card";
import PromoGallery from "@/components/promo-gallery";
import { getFeaturedBouquets } from "@/lib/data/bouquets";
import { getActivePromoSlides } from "@/lib/data/promotions";
import { getStoreSettings } from "@/lib/data/settings";
import { getHomeHeroImage, getVisibleHomeGalleryImages } from "@/lib/home-images";
import { getBouquetPricing } from "@/lib/pricing";
import {
  SITE_ADDRESS_LINE_1,
  SITE_CITY,
  SITE_COUNTRY,
  SITE_DESCRIPTION,
  SITE_EMAIL,
  SITE_INSTAGRAM,
  SITE_NAME,
  SITE_ORIGIN,
  SITE_PHONE,
  SITE_POSTAL_CODE,
  SITE_REGION,
  SITE_TAGLINE,
} from "@/lib/site";

export const metadata: Metadata = {
  title: {
    absolute: "Flower Delivery in Wheeling, IL | Local Florist | All in Bloom",
  },
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Flower Delivery in Wheeling, IL | Local Florist | All in Bloom",
    description: SITE_DESCRIPTION,
    url: "/",
    images: [
      {
        url: "/images/hero-bouquet.webp",
        alt: SITE_TAGLINE,
      },
    ],
  },
};

export default async function HomePage() {
  const featured = await getFeaturedBouquets();
  const promoSlides = await getActivePromoSlides();
  const settings = await getStoreSettings();
  const heroImage = getHomeHeroImage(settings);
  // Administrators can store any number of images; the public home mosaic and
  // its lightbox intentionally expose only the first six in that order.
  const galleryImages = getVisibleHomeGalleryImages(settings);
  const [mainGalleryImage, ...compactGalleryImages] = galleryImages;
  const atelierGalleryItems = galleryImages.map((src, idx) => ({
    src,
    alt: `Bouquet by All in Bloom Floral Studio, photo ${idx + 1}`,
    lightboxWidth: 1600,
    lightboxHeight: 1600,
  }));
  const localBusinessImage = heroImage.startsWith("http")
    ? heroImage
    : `${SITE_ORIGIN}${heroImage.startsWith("/") ? heroImage : `/${heroImage}`}`;

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "Florist",
    name: SITE_NAME,
    url: SITE_ORIGIN,
    image: localBusinessImage,
    description: SITE_DESCRIPTION,
    telephone: SITE_PHONE,
    email: SITE_EMAIL,
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE_ADDRESS_LINE_1,
      addressLocality: SITE_CITY,
      addressRegion: SITE_REGION,
      postalCode: SITE_POSTAL_CODE,
      addressCountry: SITE_COUNTRY,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 42.136281087564285,
      longitude: -87.9050852153543,
    },
    areaServed: [
      `${SITE_CITY}, ${SITE_REGION}`,
      "Northwest Chicago Suburbs, IL",
      "Chicago, IL",
    ],
    sameAs: [SITE_INSTAGRAM],
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "08:30",
        closes: "17:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Saturday",
        opens: "10:00",
        closes: "18:00",
      },
    ],
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_ORIGIN,
  };

  return (
    <div className="flex flex-col gap-14 sm:gap-20 lg:gap-[4.5rem]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessSchema),
        }}
      />
      <section className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center animate-rise">
        <div className="space-y-6">
          <div className="relative lg:hidden">
            <div className="pointer-events-none absolute -inset-x-3 -top-6 h-[340px] rounded-[40px] bg-[radial-gradient(circle_at_20%_20%,rgba(var(--cream-rgb),0.86),transparent_58%),radial-gradient(circle_at_85%_15%,rgba(var(--accent-rgb),0.36),transparent_45%)] blur-2xl" />
            <div className="relative overflow-hidden rounded-[34px] border border-white/80 bg-[linear-gradient(140deg,rgba(255,255,255,0.9),rgba(var(--cream-rgb),0.72))] p-3 shadow-[0_26px_70px_rgba(var(--brand-rgb),0.22)]">
              <div className="relative overflow-hidden rounded-[26px] border border-white/70">
                <Image
                  src={heroImage}
                  alt="Fresh bouquet from All in Bloom Floral Studio in Wheeling"
                  width={760}
                  height={940}
                  className="h-[420px] w-full object-cover object-center"
                  priority
                  fetchPriority="high"
                />
                <div className="absolute inset-0 bg-[linear-gradient(175deg,rgba(22,10,7,0.06),rgba(22,10,7,0.7))]" />
                <div className="absolute left-4 top-4 rounded-full border border-white/50 bg-white/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-white backdrop-blur">
                  Same-day delivery
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <p className="text-[11px] uppercase tracking-[0.3em] text-white/75">
                    Wheeling, IL
                  </p>
                  <p className="mt-1 text-2xl font-semibold leading-tight text-balance">
                    Fresh bouquets, made to order
                  </p>
                </div>
              </div>
              <Link
                href="/catalog"
                className="mt-3 inline-flex w-full items-center justify-center rounded-2xl bg-[color:var(--brand)] px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[color:var(--brand-dark)]"
              >
                Shop all
              </Link>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-xs uppercase tracking-[0.24em] text-stone-700 shadow-sm">
            Flowers, balloons & event space
          </div>
          <div className="lg:hidden animate-rise [animation-delay:80ms]">
            <PromoGallery slides={promoSlides} />
          </div>
          <h1 className="text-3xl font-semibold text-stone-900 text-balance sm:text-5xl lg:text-6xl">
            Flower Delivery in Wheeling, IL
          </h1>
          <p className="max-w-xl text-balance text-lg text-stone-700">
            Order a bouquet online and we&apos;ll deliver it the same day.
            Flowers, balloons and gift boxes for birthdays, dates and
            &ldquo;just because&rdquo;.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
            <Link
              href="/catalog"
              className="hidden items-center justify-center rounded-full bg-[color:var(--brand)] px-6 py-3 text-center text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[color:var(--brand-dark)] lg:inline-flex"
            >
              Shop all
            </Link>
            <Link
              href="/catalog?filter=featured"
              className="rounded-full border border-[color:var(--brand)]/30 bg-white/70 px-6 py-3 text-center text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--brand)] transition hover:border-[color:var(--brand)]/60"
            >
              Explore signature sets
            </Link>
          </div>
          <a
            href={SITE_INSTAGRAM}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-[color:var(--brand)] px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white shadow-[0_12px_28px_rgba(var(--brand-rgb),0.28)] transition hover:-translate-y-0.5 hover:bg-[color:var(--brand-dark)] sm:w-auto"
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
        <div className="relative animate-float hidden lg:block">
          <div className="glass absolute right-6 top-6 z-10 hidden h-14 min-w-[10rem] rounded-full border border-white/80 px-4 text-center text-xs font-semibold uppercase tracking-[0.24em] text-stone-700 sm:flex items-center justify-center">
            New arrivals
          </div>
          <div className="glass overflow-hidden rounded-[32px] border border-white/80 p-4">
            <Image
              src={heroImage}
              alt="Fresh bouquet from All in Bloom Floral Studio in Wheeling"
              width={520}
              height={640}
              className="h-auto w-full rounded-[26px] object-cover"
              priority
              fetchPriority="high"
            />
          </div>
        </div>
      </section>

      <section className="hidden lg:block animate-rise [animation-delay:80ms]">
        <PromoGallery slides={promoSlides} />
      </section>

      <section className="space-y-6 animate-rise [animation-delay:200ms]">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-stone-500">
              Signature bouquets
            </p>
            <h2 className="text-2xl font-semibold text-stone-900 sm:text-4xl">
              Customer favorites
            </h2>
          </div>
          <Link
            href="/catalog?filter=featured"
            className="w-full rounded-full border border-stone-300 bg-white/80 px-5 py-2 text-center text-xs uppercase tracking-[0.3em] text-stone-600 transition hover:border-stone-400 sm:w-auto sm:shrink-0 sm:whitespace-nowrap"
          >
            View all
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featured.map((bouquet) => (
            <BouquetCard
              key={bouquet.id}
              bouquet={bouquet}
              pricing={getBouquetPricing(bouquet, settings)}
            />
          ))}
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center animate-rise [animation-delay:280ms]">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.32em] text-stone-500">
            About us
          </p>
          <h2 className="text-3xl font-semibold text-stone-900 sm:text-4xl">
            A small flower studio on Milwaukee Ave
          </h2>
          <p className="text-sm leading-relaxed text-stone-600">
            We build every bouquet by hand on the day it goes out. Stop by to
            pick one from the showcase, or order online and we&apos;ll
            deliver it.
          </p>
          <div className="rounded-[28px] border border-white/80 bg-gradient-to-br from-[color:var(--soft-rose)] to-[color:var(--accent)] p-5 text-[color:var(--brand)] shadow-sm sm:p-6">
            <p className="text-xs uppercase tracking-[0.32em] text-stone-500">
              Exclusive
            </p>
            <h3 className="mt-2 text-xl font-semibold sm:text-2xl">
              A little extra care in every bouquet
            </h3>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/70 bg-white/60 p-4">
                <p className="text-sm font-semibold">Beautifully wrapped</p>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">
                  Every bouquet is wrapped in our signature paper and ribbon.
                </p>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/60 p-4">
                <p className="text-sm font-semibold">Made personal</p>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">
                  Add a greeting card with your message. We can also send you a
                  photo before delivery.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-stone-500">
              Gallery
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-stone-900 sm:text-3xl">
              Recent bouquets
            </h3>
          </div>
          <div className="space-y-2.5 sm:hidden">
            <div className="glass overflow-hidden rounded-[28px] border border-white/80 aspect-[5/4]">
              <GalleryImageLightbox
                src={mainGalleryImage}
                alt="Bouquet gallery preview"
                className="block h-full w-full"
                imageClassName="h-full w-full object-cover"
                previewWidth={520}
                previewHeight={420}
                items={atelierGalleryItems}
                startIndex={0}
              />
            </div>
            <div className="grid grid-cols-5 gap-2">
              {compactGalleryImages.map((src, idx) => (
                <div
                  key={`home-gallery-mobile-${idx + 1}`}
                  className="glass overflow-hidden rounded-[18px] border border-white/80 aspect-square"
                >
                  <GalleryImageLightbox
                    src={src}
                    alt="Bouquet gallery preview"
                    className="block h-full w-full"
                    imageClassName="h-full w-full object-cover"
                    previewWidth={180}
                    previewHeight={180}
                    items={atelierGalleryItems}
                    startIndex={idx + 1}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="hidden gap-4 sm:grid sm:grid-cols-2">
            {galleryImages.map((src, idx) => (
              <div
                key={`home-gallery-desktop-${idx}`}
                className="glass overflow-hidden rounded-[28px] border border-white/80 aspect-square"
              >
                <GalleryImageLightbox
                  src={src}
                  alt="Bouquet gallery preview"
                  className="block h-full w-full"
                  imageClassName="h-full w-full object-cover"
                  previewWidth={400}
                  previewHeight={400}
                  items={atelierGalleryItems}
                  startIndex={idx}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4 animate-rise [animation-delay:320ms]">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-stone-500">
            Delivery areas
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-stone-900 sm:text-4xl">
            Where We Deliver
          </h2>
        </div>
        <p className="max-w-3xl text-sm leading-relaxed text-stone-600">
          Enter your address at checkout to see the delivery fee and
          available time. We currently deliver to:
        </p>
        <p className="max-w-4xl text-sm leading-relaxed text-stone-600">
          Wheeling, Buffalo Grove, Arlington Heights, Prospect Heights, Rolling
          Meadows, Mount Prospect, Palatine, Northbrook, Glenview, Lincolnshire,
          Deerfield, Vernon Hills, Mundelein, Lake Zurich, Barrington,
          Schaumburg, Hoffman Estates, Elk Grove Village, Des Plaines, Park
          Ridge, Niles, Morton Grove, Skokie, Evanston, and selected North and
          Northwest Chicago neighborhoods.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-2 animate-rise [animation-delay:360ms]">
        <PromoCard
          title="First Order Offer"
          description="Enjoy 10% off your first order."
          tone="rose"
        />
        <PromoCard
          title="Wedding Flowers"
          description="Bridal bouquets, boutonnieres and venue florals. Contact us to book a consultation."
          tone="leaf"
        />
      </section>

      <section className="grid gap-8 rounded-none border-0 bg-transparent p-0 shadow-none sm:gap-10 sm:rounded-[36px] sm:border sm:border-white/80 sm:bg-white/70 sm:p-8 sm:shadow-sm lg:grid-cols-[1fr_1.1fr] animate-rise [animation-delay:480ms]">
        <div className="space-y-5">
          <p className="text-xs uppercase tracking-[0.32em] text-stone-500">
            Build your own bouquet
          </p>
          <h2 className="text-3xl font-semibold text-stone-900 sm:text-4xl">
            Florist&apos;s choice bouquet
          </h2>
          <p className="text-sm leading-relaxed text-stone-600">
            Tell us the occasion, colors and budget, and our florist will
            put together a bouquet from the freshest flowers in the studio
            that day.
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

      <section className="grid gap-6 rounded-none border-0 bg-transparent p-0 shadow-none sm:rounded-[36px] sm:border sm:border-white/80 sm:bg-white/70 sm:p-8 sm:shadow-sm lg:grid-cols-[0.9fr_1.1fr] animate-rise [animation-delay:520ms]">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.32em] text-stone-500">
            Visit us
          </p>
          <h2 className="text-3xl font-semibold text-stone-900 sm:text-4xl">
            Our Studio in Wheeling
          </h2>
          <p className="text-sm leading-relaxed text-stone-600">
            {SITE_ADDRESS_LINE_1}, {SITE_CITY}, {SITE_REGION}{" "}
            {SITE_POSTAL_CODE}. Come in for a ready-made bouquet, pick up an
            online order, or talk to us about a custom arrangement.
          </p>
        </div>
        <div className="overflow-hidden rounded-[28px] border border-white/80 bg-white">
          <iframe
            title="All in Bloom Floral Studio map"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d184.91590065921062!2d-87.9050852153543!3d42.136281087564285!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x880fb9328ddb551b%3A0xe419f6ce282a69!2zMjI0IFMgTWlsd2F1a2VlIEF2ZSwgV2hlZWxpbmcsIElMIDYwMDkwLCDQodCo0JA!5e0!3m2!1sru!2sru!4v1777579957452!5m2!1sru!2sru"
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

