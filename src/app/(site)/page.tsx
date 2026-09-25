import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import BouquetCard from "@/components/bouquet-card";
import GalleryImageLightbox from "@/components/gallery-image-lightbox";
import FloristChoiceForm from "@/components/florist-choice-form";
import PromoGallery from "@/components/promo-gallery";
import ReviewStars from "@/components/review-stars";
import type { Review } from "@/lib/api-types";
import { getFeaturedBouquets } from "@/lib/data/bouquets";
import { getActivePromoSlides } from "@/lib/data/promotions";
import { getActiveReviews } from "@/lib/data/reviews";
import { getStoreSettings } from "@/lib/data/settings";
import { FAQ_ITEMS } from "@/lib/faq";
import { getHomeHeroImage, getVisibleHomeGalleryImages } from "@/lib/home-images";
import { getBouquetPricing } from "@/lib/pricing";
import {
  SITE_ADDRESS_LINE_1,
  SITE_CITY,
  SITE_DELIVERY_AREAS,
  SITE_DESCRIPTION,
  SITE_HOURS,
  SITE_MAP_URL,
  SITE_PHONE,
  SITE_PHONE_DISPLAY,
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

const OCCASIONS = [
  {
    title: "Birthday flowers",
    text: "Bright bouquets, easy to pair with a personalized balloon.",
    href: "/catalog",
  },
  {
    title: "Anniversary & romance",
    text: "Garden roses, peonies and soft romantic palettes.",
    href: "/catalog?flower=rose",
  },
  {
    title: "Sympathy flowers",
    text: "Quiet white and cream arrangements, delivered with care.",
    href: "/catalog?color=white",
  },
  {
    title: "Get well & hospital delivery",
    text: "We deliver to local hospitals that accept flowers.",
    href: "/catalog",
  },
  {
    title: "New baby & welcome home",
    text: "Bubble Balloons, numbers and coordinating flowers.",
    href: "/balloons",
  },
  {
    title: "Thank you & just because",
    text: "Seasonal bouquets and ready-to-give gift boxes.",
    href: "/gifts",
  },
] as const;

const HOME_FAQ_QUESTIONS = [
  "Do you offer same-day flower delivery?",
  "What areas do you deliver to?",
  "Can I pick up flowers directly from your studio?",
  "What is a Designer’s Choice bouquet?",
  "Can I order flowers and balloons together?",
];

const linkClass =
  "font-medium text-stone-800 underline decoration-stone-300 underline-offset-4 transition hover:text-[color:var(--brand)] hover:decoration-[color:var(--brand)]";

async function loadReviews(): Promise<Review[]> {
  try {
    return await getActiveReviews();
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [featured, promoSlides, settings, reviews] = await Promise.all([
    getFeaturedBouquets(),
    getActivePromoSlides(),
    getStoreSettings(),
    loadReviews(),
  ]);
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

  const phoneNumber = SITE_PHONE.replace(/[^+\d]/g, "");
  const reviewCount = reviews.length;
  const averageRating = reviewCount
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount
    : 0;
  const topReviews = [...reviews]
    .filter((review) => review.text.trim().length > 0)
    .sort((a, b) => b.rating - a.rating || b.text.length - a.text.length)
    .slice(0, 3);
  const faqPreview = FAQ_ITEMS.filter(({ q }) => HOME_FAQ_QUESTIONS.includes(q));

  return (
    <div className="flex flex-col gap-16 sm:gap-24">
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
                <p className="absolute bottom-0 left-0 right-0 p-4 text-2xl font-semibold leading-tight text-balance text-white">
                  Fresh bouquets, made to order in Wheeling
                </p>
              </div>
              <Link
                href="/catalog"
                className="mt-3 inline-flex w-full items-center justify-center rounded-2xl bg-[color:var(--brand)] px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[color:var(--brand-dark)]"
              >
                Shop flowers
              </Link>
            </div>
          </div>
          <h1 className="text-3xl font-semibold text-stone-900 text-balance sm:text-5xl lg:text-6xl">
            Flower Delivery in Wheeling, IL
          </h1>
          <p className="max-w-xl text-balance text-lg text-stone-700">
            A local floral studio on Milwaukee Ave. Bouquets, personalized
            balloons and gift boxes, made by hand and delivered the same day
            across the Northwest suburbs.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
            <Link
              href="/catalog"
              className="hidden items-center justify-center rounded-full bg-[color:var(--brand)] px-7 py-3 text-center text-sm font-semibold uppercase tracking-[0.2em] text-white shadow-[0_12px_28px_rgba(var(--brand-rgb),0.28)] transition hover:-translate-y-0.5 hover:bg-[color:var(--brand-dark)] lg:inline-flex"
            >
              Shop flowers
            </Link>
            <Link
              href="#designers-choice"
              className="rounded-full border border-[color:var(--brand)]/30 bg-white/70 px-6 py-3 text-center text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--brand)] transition hover:border-[color:var(--brand)]/60"
            >
              Design a custom bouquet
            </Link>
          </div>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-stone-600">
            {reviewCount > 0 ? (
              <li className="flex items-center gap-2">
                <ReviewStars value={averageRating} size="sm" />
                <Link href="/reviews" className="hover:text-stone-900">
                  {averageRating.toFixed(1)} from {reviewCount} review
                  {reviewCount === 1 ? "" : "s"}
                </Link>
              </li>
            ) : null}
            <li>Same-day delivery</li>
            <li>Pickup in Wheeling</li>
            <li>
              <a href={`tel:${phoneNumber}`} className="hover:text-stone-900">
                {SITE_PHONE_DISPLAY}
              </a>
            </li>
          </ul>
        </div>
        <div className="relative animate-float hidden lg:block">
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

      <section className="animate-rise [animation-delay:80ms]">
        <PromoGallery slides={promoSlides} />
      </section>

      <section aria-labelledby="favorites-title" className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2
            id="favorites-title"
            className="text-2xl font-semibold text-stone-900 sm:text-4xl"
          >
            Customer favorite bouquets
          </h2>
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

      <section
        aria-labelledby="occasions-title"
        className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]"
      >
        <div className="space-y-4">
          <h2
            id="occasions-title"
            className="text-3xl font-semibold text-stone-900 text-balance sm:text-4xl"
          >
            Flowers for every occasion
          </h2>
          <p className="max-w-md text-sm leading-relaxed text-stone-600 sm:text-base">
            Not sure what to send? Tell us who it&apos;s for and the budget,
            and our florists will suggest something, or start from one of
            these.
          </p>
        </div>
        <ul className="grid border-t border-stone-300/70 sm:grid-cols-2 sm:gap-x-8">
          {OCCASIONS.map((occasion) => (
            <li key={occasion.title} className="border-b border-stone-300/70">
              <Link
                href={occasion.href}
                className="group flex items-start justify-between gap-4 py-5"
              >
                <span>
                  <h3 className="text-base font-semibold text-stone-900 transition group-hover:text-[color:var(--brand)] sm:text-lg">
                    {occasion.title}
                  </h3>
                  <span className="mt-1 block text-sm leading-relaxed text-stone-600">
                    {occasion.text}
                  </span>
                </span>
                <svg
                  aria-hidden
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mt-1.5 h-4 w-4 shrink-0 text-stone-400 transition group-hover:translate-x-1 group-hover:text-[color:var(--brand)]"
                >
                  <path d="M4 10h12M11 5l5 5-5 5" />
                </svg>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby="balloons-title"
        className="rounded-[36px] bg-[color:var(--brand)] px-6 py-10 text-white shadow-[0_24px_60px_rgba(var(--brand-rgb),0.28)] sm:px-10 sm:py-14"
      >
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div className="space-y-4">
            <h2
              id="balloons-title"
              className="text-3xl font-semibold text-balance sm:text-4xl"
            >
              Flowers and balloons, in one gift
            </h2>
            <p className="max-w-xl text-sm leading-relaxed text-white/85 sm:text-base">
              We make both, so the bouquet and the balloons match. Personalized
              Bubble Balloons with custom lettering, number and heart balloons,
              and gift boxes for birthdays, baby showers, anniversaries and
              welcome-home surprises. Balloons can also be ordered on their own.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
            <Link
              href="/balloons"
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--brand-dark)] transition hover:-translate-y-0.5"
            >
              Shop balloons
            </Link>
            <Link
              href="/gifts"
              className="inline-flex items-center justify-center rounded-full border border-white/60 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:-translate-y-0.5 hover:bg-white/10"
            >
              Gift boxes
            </Link>
          </div>
        </div>
      </section>

      {topReviews.length > 0 ? (
        <section aria-labelledby="reviews-title" className="space-y-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="space-y-2">
              <h2
                id="reviews-title"
                className="text-3xl font-semibold text-stone-900 sm:text-4xl"
              >
                What customers say
              </h2>
              <div className="flex items-center gap-3 text-sm text-stone-600">
                <ReviewStars value={averageRating} size="md" />
                <span>
                  {averageRating.toFixed(1)} average from {reviewCount} review
                  {reviewCount === 1 ? "" : "s"}
                </span>
              </div>
            </div>
            <Link
              href="/reviews"
              className="w-full rounded-full border border-stone-300 bg-white/80 px-5 py-2 text-center text-xs uppercase tracking-[0.3em] text-stone-600 transition hover:border-stone-400 sm:w-auto"
            >
              All reviews
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {topReviews.map((review) => (
              <figure
                key={review.id}
                className="flex flex-col justify-between gap-5 rounded-[28px] border border-white/80 bg-white/70 p-6 shadow-sm"
              >
                <blockquote className="line-clamp-6 text-sm leading-relaxed text-stone-700 sm:text-base">
                  &ldquo;{review.text.trim()}&rdquo;
                </blockquote>
                <figcaption className="flex items-center justify-between gap-3 text-sm font-semibold text-stone-900">
                  {review.name}
                  <ReviewStars value={review.rating} size="sm" />
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      ) : null}

      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-4">
          <h2 className="text-3xl font-semibold text-stone-900 sm:text-4xl">
            A small flower studio on Milwaukee Ave
          </h2>
          <p className="text-sm leading-relaxed text-stone-600 sm:text-base">
            Every bouquet is designed by a local florist at our Wheeling studio
            on the day it goes out, not shipped in a box from a national
            warehouse. Stop by to pick one from the showcase, or order online
            and we&apos;ll deliver it.
          </p>
          <dl className="grid gap-x-8 gap-y-5 pt-4 sm:grid-cols-2">
            <div className="border-t border-stone-300/70 pt-4">
              <dt className="text-sm font-semibold text-stone-900">
                Beautifully wrapped
              </dt>
              <dd className="mt-1.5 text-sm leading-relaxed text-stone-600">
                Every bouquet is wrapped in our signature paper and ribbon.
              </dd>
            </div>
            <div className="border-t border-stone-300/70 pt-4">
              <dt className="text-sm font-semibold text-stone-900">
                Made personal
              </dt>
              <dd className="mt-1.5 text-sm leading-relaxed text-stone-600">
                Add a greeting card with your message. We can also send you a
                photo before delivery.
              </dd>
            </div>
          </dl>
        </div>
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-stone-900 sm:text-3xl">
            Recent bouquets
          </h2>
          <div className="space-y-2.5 sm:hidden">
            <div className="glass overflow-hidden rounded-[28px] border border-white/80 aspect-[5/4]">
              <GalleryImageLightbox
                src={mainGalleryImage}
                alt="Recent bouquet by All in Bloom Floral Studio, Wheeling IL"
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
                    alt={`Recent bouquet by All in Bloom, photo ${idx + 2}`}
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
                  alt={`Recent bouquet by All in Bloom, photo ${idx + 1}`}
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

      <section aria-labelledby="events-title" className="space-y-6">
        <h2
          id="events-title"
          className="text-3xl font-semibold text-stone-900 sm:text-4xl"
        >
          Weddings, events and business flowers
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="flex flex-col gap-3 border-t border-stone-300/70 pt-5">
            <h3 className="text-lg font-semibold text-stone-900">
              Wedding flowers
            </h3>
            <p className="text-sm leading-relaxed text-stone-600">
              Bridal bouquets, boutonnieres, ceremony flowers, centerpieces and
              venue florals, designed around your palette.
            </p>
            <Link href="/contact" className={`mt-auto self-start pt-1 text-sm ${linkClass}`}>
              Book a consultation
            </Link>
          </div>
          <div className="flex flex-col gap-3 border-t border-stone-300/70 pt-5">
            <h3 className="text-lg font-semibold text-stone-900">
              Private events
            </h3>
            <p className="text-sm leading-relaxed text-stone-600">
              Table arrangements and floral décor for celebrations, plus our
              studio event space for small gatherings.
            </p>
            <Link href="/event-space" className={`mt-auto self-start pt-1 text-sm ${linkClass}`}>
              See the event space
            </Link>
          </div>
          <div className="flex flex-col gap-3 border-t border-stone-300/70 pt-5">
            <h3 className="text-lg font-semibold text-stone-900">
              Business flowers
            </h3>
            <p className="text-sm leading-relaxed text-stone-600">
              Arrangements for offices, reception areas, restaurants and
              dealerships, client gifts and recurring service.
            </p>
            <Link href="/contact" className={`mt-auto self-start pt-1 text-sm ${linkClass}`}>
              Ask about business orders
            </Link>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="offer-title"
        className="flex flex-col gap-6 rounded-[32px] bg-white/75 px-6 py-8 shadow-[0_18px_44px_rgba(var(--brand-rgb),0.12)] sm:flex-row sm:items-center sm:justify-between sm:px-10"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-8">
          <p
            aria-hidden
            className="font-[family-name:var(--font-script)] text-6xl leading-none text-[color:var(--brand)] sm:text-7xl"
          >
            10%
          </p>
          <div className="space-y-1">
            <h2
              id="offer-title"
              className="text-xl font-semibold text-stone-900 sm:text-2xl"
            >
              10% off your first order
            </h2>
            <p className="text-sm text-stone-600">
              New to All in Bloom? The discount applies to your first order.
            </p>
          </div>
        </div>
        <Link
          href="/catalog"
          className="inline-flex shrink-0 items-center justify-center rounded-full bg-[color:var(--brand)] px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:-translate-y-0.5 hover:bg-[color:var(--brand-dark)]"
        >
          Shop flowers
        </Link>
      </section>

      <section aria-labelledby="areas-title" className="space-y-5">
        <h2
          id="areas-title"
          className="text-3xl font-semibold text-stone-900 sm:text-4xl"
        >
          Same-day flower delivery areas
        </h2>
        <p className="max-w-3xl text-sm leading-relaxed text-stone-600 sm:text-base">
          We deliver from Wheeling across the Northwest and North Shore
          suburbs, plus selected North and Northwest Chicago neighborhoods.
          Enter the address at checkout to see the delivery fee and available
          times.
        </p>
        <ul className="flex flex-wrap gap-2">
          {SITE_DELIVERY_AREAS.map((area) => (
            <li
              key={area}
              className="rounded-full border border-stone-300/80 bg-white/60 px-3.5 py-1.5 text-sm text-stone-700"
            >
              {area}
            </li>
          ))}
        </ul>
      </section>

      <section
        id="designers-choice"
        className="scroll-mt-28 grid gap-8 rounded-none border-0 bg-transparent p-0 shadow-none sm:gap-10 sm:rounded-[36px] sm:border sm:border-white/80 sm:bg-white/70 sm:p-8 sm:shadow-sm lg:grid-cols-[1fr_1.1fr]"
      >
        <div className="space-y-5">
          <h2 className="text-3xl font-semibold text-stone-900 sm:text-4xl">
            Designer&apos;s Choice bouquet
          </h2>
          <p className="text-sm leading-relaxed text-stone-600 sm:text-base">
            Tell us the occasion, colors and budget, and our florist will put
            together a bouquet from the freshest flowers in the studio that
            day.
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

      <section
        aria-labelledby="home-faq-title"
        className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]"
      >
        <div className="space-y-4">
          <h2
            id="home-faq-title"
            className="text-3xl font-semibold text-stone-900 sm:text-4xl"
          >
            Questions before you order
          </h2>
          <p className="text-sm leading-relaxed text-stone-600 sm:text-base">
            Delivery, pickup, custom designs and more.{" "}
            <Link href="/faq" className={linkClass}>
              Read all FAQ
            </Link>
          </p>
        </div>
        <div className="divide-y divide-stone-300/70 border-y border-stone-300/70">
          {faqPreview.map(({ q, a }) => (
            <details key={q} className="group">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-5 text-base font-medium text-stone-900 transition hover:text-[color:var(--brand)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--brand)] [&::-webkit-details-marker]:hidden">
                <h3 className="text-pretty">{q}</h3>
                <svg
                  aria-hidden
                  viewBox="0 0 20 20"
                  className="mt-1 h-4 w-4 shrink-0 text-stone-400 transition-transform duration-300 group-open:rotate-45 group-open:text-[color:var(--brand)]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                >
                  <path d="M10 3v14M3 10h14" />
                </svg>
              </summary>
              <p className="max-w-[68ch] pb-6 pr-10 text-sm leading-relaxed text-stone-600">
                {a}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section className="grid gap-6 rounded-none border-0 bg-transparent p-0 shadow-none sm:rounded-[36px] sm:border sm:border-white/80 sm:bg-white/70 sm:p-8 sm:shadow-sm lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-5">
          <h2 className="text-3xl font-semibold text-stone-900 sm:text-4xl">
            Visit our studio in Wheeling
          </h2>
          <p className="text-sm leading-relaxed text-stone-600 sm:text-base">
            Come in for a ready-made bouquet, pick up an online order, or talk
            to us about a custom arrangement.
          </p>
          <address className="space-y-1 text-sm not-italic text-stone-700">
            <p>{SITE_ADDRESS_LINE_1}</p>
            <p>
              {SITE_CITY}, {SITE_REGION} {SITE_POSTAL_CODE}
            </p>
            <p>
              <a href={`tel:${phoneNumber}`} className={linkClass}>
                {SITE_PHONE_DISPLAY}
              </a>
            </p>
          </address>
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-sm text-stone-700">
            {SITE_HOURS.map(({ label, hours }) => (
              <div key={label} className="contents">
                <dt className="text-stone-500">{label}</dt>
                <dd className="tabular-nums">{hours}</dd>
              </div>
            ))}
          </dl>
          <a
            href={SITE_MAP_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-full items-center justify-center rounded-full bg-[color:var(--brand)] px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:-translate-y-0.5 hover:bg-[color:var(--brand-dark)] sm:w-auto"
          >
            Get directions
          </a>
        </div>
        <div className="overflow-hidden rounded-[28px] border border-white/80 bg-white">
          <iframe
            title="All in Bloom Floral Studio map"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d184.91590065921062!2d-87.9050852153543!3d42.136281087564285!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x880fb9328ddb551b%3A0xe419f6ce282a69!2zMjI0IFMgTWlsd2F1a2VlIEF2ZSwgV2hlZWxpbmcsIElMIDYwMDkwLCDQodCo0JA!5e0!3m2!1sen!2sus!4v1777579957452!5m2!1sen!2sus"
            className="h-[280px] w-full sm:h-[380px]"
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
