"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import GalleryImageLightbox from "@/components/gallery-image-lightbox";

type PromoSlide = {
  id: string;
  title?: string | null;
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
    title: "",
    subtitle: "",
    image: "/images/promo-1.png",
    link: "",
  },
  {
    id: "fallback-2",
    title: "",
    subtitle: "",
    image: "/images/promo-2.png",
    link: "",
  },
  {
    id: "fallback-3",
    title: "Gift-ready details",
    subtitle: "Handwritten notes and satin ribbon.",
    image: "/images/promo-3.png",
    link: "/catalog",
  },
];

export default function PromoGallery({ slides }: PromoGalleryProps) {
  const items = useMemo(
    () => (slides.length ? slides : FALLBACK_SLIDES),
    [slides]
  );
  const promoLightboxItems = useMemo(
    () =>
      items.map((slide, idx) => ({
        src: slide.image,
        alt: slide.title || `Promotion image ${idx + 1}`,
        lightboxWidth: 1600,
        lightboxHeight: 1600,
      })),
    [items]
  );
  const [index, setIndex] = useState(0);
  const [isAutoPaused, setIsAutoPaused] = useState(false);
  const [perView, setPerView] = useState(1);

  const maxIndex = Math.max(0, items.length - perView);
  const canSlide = maxIndex > 0;
  const activeIndex = Math.min(index, maxIndex);

  const viewportRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<Array<HTMLDivElement | null>>([]);
  const directionRef = useRef(1);
  const indexRef = useRef(0);
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollFrameRef = useRef<number | null>(null);
  const interactionStartRef = useRef<{ x: number; y: number } | null>(null);
  const blockLinkClickRef = useRef(false);
  const resetLinkBlockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  useEffect(() => {
    slideRefs.current = slideRefs.current.slice(0, items.length);
  }, [items.length]);

  useEffect(() => {
    const updatePerView = () => {
      setPerView(window.innerWidth >= 1024 ? 3 : 1);
    };

    updatePerView();
    window.addEventListener("resize", updatePerView);
    return () => window.removeEventListener("resize", updatePerView);
  }, []);

  const scrollToIndex = useCallback((targetIndex: number, behavior: ScrollBehavior) => {
    const viewport = viewportRef.current;
    const targetSlide = slideRefs.current[targetIndex];

    if (!viewport || !targetSlide) return;

    viewport.scrollTo({
      left: targetSlide.offsetLeft,
      behavior,
    });
  }, []);

  const pauseAutoscroll = useCallback(() => {
    setIsAutoPaused(true);

    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current);
    }

    pauseTimerRef.current = setTimeout(() => {
      setIsAutoPaused(false);
    }, 20000);
  }, []);

  const beginInteraction = useCallback(
    (x: number, y: number) => {
      interactionStartRef.current = { x, y };
      blockLinkClickRef.current = false;
      pauseAutoscroll();
    },
    [pauseAutoscroll]
  );

  const moveInteraction = useCallback((x: number, y: number) => {
    const start = interactionStartRef.current;
    if (!start || blockLinkClickRef.current) return;

    const movedFarEnough =
      Math.abs(x - start.x) > 8 || Math.abs(y - start.y) > 8;

    if (movedFarEnough) {
      blockLinkClickRef.current = true;
    }
  }, []);

  const endInteraction = useCallback(() => {
    interactionStartRef.current = null;

    if (!blockLinkClickRef.current) return;

    if (resetLinkBlockTimerRef.current) {
      clearTimeout(resetLinkBlockTimerRef.current);
    }

    resetLinkBlockTimerRef.current = setTimeout(() => {
      blockLinkClickRef.current = false;
    }, 250);
  }, []);

  const goToIndex = useCallback(
    (targetIndex: number) => {
      const nextIndex = Math.max(0, Math.min(targetIndex, maxIndex));
      const previousIndex = indexRef.current;

      directionRef.current = nextIndex >= previousIndex ? 1 : -1;
      indexRef.current = nextIndex;
      setIndex(nextIndex);
      scrollToIndex(nextIndex, "smooth");
      pauseAutoscroll();
    },
    [maxIndex, pauseAutoscroll, scrollToIndex]
  );

  const handleViewportScroll = useCallback(() => {
    if (scrollFrameRef.current !== null) return;

    scrollFrameRef.current = window.requestAnimationFrame(() => {
      scrollFrameRef.current = null;

      const viewport = viewportRef.current;
      if (!viewport) return;

      let nearestIndex = 0;
      let nearestDistance = Number.POSITIVE_INFINITY;

      for (let currentIndex = 0; currentIndex <= maxIndex; currentIndex += 1) {
        const slide = slideRefs.current[currentIndex];
        if (!slide) continue;

        const distance = Math.abs(slide.offsetLeft - viewport.scrollLeft);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = currentIndex;
        }
      }

      const previousIndex = indexRef.current;
      if (nearestIndex !== previousIndex) {
        directionRef.current = nearestIndex > previousIndex ? 1 : -1;
        indexRef.current = nearestIndex;
        setIndex(nearestIndex);
      }
    });
  }, [maxIndex]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || items.length < 2) return;
    beginInteraction(event.clientX, event.clientY);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary) return;
    moveInteraction(event.clientX, event.clientY);
  };

  const handlePointerUp = () => {
    endInteraction();
  };

  const handlePrev = () => {
    if (!canSlide) return;
    goToIndex(indexRef.current - 1);
  };

  const handleNext = () => {
    if (!canSlide) return;
    goToIndex(indexRef.current + 1);
  };

  useEffect(() => {
    const clampedIndex = Math.min(indexRef.current, maxIndex);
    indexRef.current = clampedIndex;
    scrollToIndex(clampedIndex, "auto");
  }, [items.length, maxIndex, perView, scrollToIndex]);

  useEffect(() => {
    if (!canSlide || isAutoPaused) return;

    const interval = setInterval(() => {
      setIndex(() => {
        const currentIndex = Math.min(indexRef.current, maxIndex);
        const nextRaw = currentIndex + directionRef.current;
        let nextIndex = nextRaw;

        if (nextRaw > maxIndex) {
          directionRef.current = -1;
          nextIndex = Math.max(currentIndex - 1, 0);
        } else if (nextRaw < 0) {
          directionRef.current = 1;
          nextIndex = Math.min(currentIndex + 1, maxIndex);
        }

        indexRef.current = nextIndex;
        scrollToIndex(nextIndex, "smooth");
        return nextIndex;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [canSlide, isAutoPaused, maxIndex, scrollToIndex]);

  useEffect(() => {
    return () => {
      if (pauseTimerRef.current) {
        clearTimeout(pauseTimerRef.current);
      }
      if (resetLinkBlockTimerRef.current) {
        clearTimeout(resetLinkBlockTimerRef.current);
      }
      if (scrollFrameRef.current !== null) {
        window.cancelAnimationFrame(scrollFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="rounded-[28px] border-0 bg-transparent p-0 shadow-none sm:glass sm:rounded-[36px] sm:border sm:border-white/80 sm:p-6">
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

      <div className="relative mt-5 sm:mt-6">
        <div
          ref={viewportRef}
          className="select-none overflow-x-auto rounded-[28px] border border-white/80 scroll-smooth snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          onScroll={handleViewportScroll}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <div className="flex gap-0 lg:gap-4">
            {items.map((slide, idx) => (
              <div
                key={slide.id}
                ref={(node) => {
                  slideRefs.current[idx] = node;
                }}
                className="w-full flex-shrink-0 snap-start cursor-grab active:cursor-grabbing lg:w-[calc((100%-2rem)/3)]"
              >
                <div className="relative w-full overflow-hidden rounded-[24px] border border-white/40 sm:border-white/80 aspect-[9/16] sm:aspect-[9/16] lg:aspect-[9/16]">
                  <GalleryImageLightbox
                    src={slide.image}
                    alt={slide.title || "Promo slide"}
                    className="block h-full w-full"
                    imageClassName="h-full w-full object-cover"
                    previewWidth={900}
                    previewHeight={1600}
                    canOpen={() => !blockLinkClickRef.current}
                    onOpen={pauseAutoscroll}
                    items={promoLightboxItems}
                    startIndex={idx}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/10 to-transparent pointer-events-none" />
                  {(slide.title || slide.subtitle || slide.link) && (
                    <div className="pointer-events-none absolute left-6 top-6 max-w-md text-white">
                      {slide.title && (
                        <>
                          <p className="text-xs uppercase tracking-[0.3em] text-white/70">
                            Promotion
                          </p>
                          <h3 className="mt-2 text-2xl font-semibold sm:text-3xl">
                            {slide.title}
                          </h3>
                        </>
                      )}
                      {slide.subtitle && (
                        <p className="mt-2 text-sm text-white/80">
                          {slide.subtitle}
                        </p>
                      )}
                      {slide.link && (
                        <Link
                          href={slide.link}
                          className="pointer-events-auto mt-4 inline-flex rounded-full border border-white/60 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white backdrop-blur"
                          onClick={(event) => {
                            if (blockLinkClickRef.current) {
                              event.preventDefault();
                              return;
                            }
                            pauseAutoscroll();
                          }}
                        >
                          View details
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {canSlide ? (
          <div className="pointer-events-none absolute inset-0 hidden items-center justify-between px-3 sm:flex">
            <button
              type="button"
              onClick={handlePrev}
              className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/80 text-stone-700 shadow-sm backdrop-blur transition hover:scale-105"
              aria-label="Previous promotion"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path
                  fillRule="evenodd"
                  d="M12.78 4.22a.75.75 0 0 1 0 1.06L8.06 10l4.72 4.72a.75.75 0 1 1-1.06 1.06l-5.25-5.25a.75.75 0 0 1 0-1.06l5.25-5.25a.75.75 0 0 1 1.06 0Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/80 text-stone-700 shadow-sm backdrop-blur transition hover:scale-105"
              aria-label="Next promotion"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path
                  fillRule="evenodd"
                  d="M7.22 15.78a.75.75 0 0 1 0-1.06L11.94 10 7.22 5.28a.75.75 0 1 1 1.06-1.06l5.25 5.25a.75.75 0 0 1 0 1.06l-5.25 5.25a.75.75 0 0 1-1.06 0Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        ) : null}
      </div>

      {canSlide ? (
        <p className="mt-3 text-center text-[10px] uppercase tracking-[0.24em] text-stone-500 sm:hidden">
          Swipe to browse
        </p>
      ) : null}

      {canSlide ? (
        <div className="mt-4 flex justify-center gap-2">
          {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
            <button
              key={`promo-dot-${idx}`}
              type="button"
              onClick={() => goToIndex(idx)}
              className={`h-2 w-2 rounded-full transition ${
                idx === activeIndex ? "bg-[color:var(--brand)]" : "bg-stone-300"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
