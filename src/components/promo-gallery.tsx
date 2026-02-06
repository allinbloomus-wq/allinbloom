"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type PromoSlide = {
  id: string;
  title: string;
  subtitle?: string | null;
  image: string;
  link?: string | null;
};

type PromoGalleryProps = {
  slides: PromoSlide[];
};

const FALLBACK_SLIDES: PromoSlide[] = [
  {
    id: "fallback-1",
    title: "Seasonal promotion",
    subtitle: "Soft blush bouquets with signature wraps.",
    image: "/images/promo-1.svg",
    link: "/catalog?filter=featured",
  },
  {
    id: "fallback-2",
    title: "Florist choice spotlight",
    subtitle: "Custom bouquets crafted in hours.",
    image: "/images/promo-2.svg",
    link: "/catalog",
  },
  {
    id: "fallback-3",
    title: "Gift-ready details",
    subtitle: "Handwritten notes and satin ribbon.",
    image: "/images/promo-3.svg",
    link: "/catalog",
  },
];

export default function PromoGallery({ slides }: PromoGalleryProps) {
  const items = useMemo(
    () => (slides.length ? slides : FALLBACK_SLIDES),
    [slides]
  );
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (items.length < 2) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [items.length]);

  return (
    <div className="glass rounded-[36px] border border-white/80 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-stone-500">
            Studio offers
          </p>
          <h2 className="text-3xl font-semibold text-stone-900 sm:text-4xl">
            Seasonal promotions
          </h2>
        </div>
        <div className="hidden text-xs uppercase tracking-[0.28em] text-stone-500 sm:block">
          Auto-scroll
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-[28px] border border-white/80">
        <div
          className="flex transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {items.map((slide) => (
            <div key={slide.id} className="w-full flex-shrink-0">
              <div className="relative h-[240px] w-full sm:h-[300px] lg:h-[360px]">
                <Image
                  src={slide.image}
                  alt={slide.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 900px"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/10 to-transparent" />
                <div className="absolute left-6 top-6 max-w-md text-white">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/70">
                    Promotion
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold sm:text-3xl">
                    {slide.title}
                  </h3>
                  {slide.subtitle ? (
                    <p className="mt-2 text-sm text-white/80">
                      {slide.subtitle}
                    </p>
                  ) : null}
                  {slide.link ? (
                    <Link
                      href={slide.link}
                      className="mt-4 inline-flex rounded-full border border-white/60 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white backdrop-blur"
                    >
                      View details
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {items.length > 1 ? (
        <div className="mt-4 flex justify-center gap-2">
          {items.map((slide, idx) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => setIndex(idx)}
              className={`h-2 w-2 rounded-full transition ${
                idx === index ? "bg-[color:var(--brand)]" : "bg-stone-300"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
