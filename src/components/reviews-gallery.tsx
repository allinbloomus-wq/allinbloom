"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import BouquetImageLightbox from "@/components/bouquet-image-lightbox";
import ReviewStars from "@/components/review-stars";
import { formatDate } from "@/lib/format";
import type { Review } from "@/lib/api-types";

type ReviewsGalleryProps = {
  reviews: Review[];
};

const AUTO_SCROLL_INTERVAL_MS = 5000;
const AUTO_SCROLL_PAUSE_MS = 20000;
const INTERACTION_CLICK_THRESHOLD = 8;

export default function ReviewsGallery({ reviews }: ReviewsGalleryProps) {
  const items = useMemo(() => reviews, [reviews]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [isAutoPaused, setIsAutoPaused] = useState(false);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    loop: false,
    containScroll: "trimSnaps",
    slidesToScroll: 1,
    dragFree: false,
    skipSnaps: false,
    dragThreshold: 7,
    duration: 32,
  });

  const directionRef = useRef<1 | -1>(1);
  const activeIndexRef = useRef(0);
  const pageCountRef = useRef(1);
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const interactionStartRef = useRef<{ x: number; y: number } | null>(null);
  const blockImageOpenRef = useRef(false);
  const resetOpenBlockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const hasSlides = items.length > 0;
  const canSlide = pageCount > 1;
  const maxIndex = Math.max(0, pageCount - 1);
  const clampedActiveIndex = Math.min(activeIndex, maxIndex);

  const pauseAutoscroll = useCallback(() => {
    setIsAutoPaused(true);

    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current);
    }

    pauseTimerRef.current = setTimeout(() => {
      setIsAutoPaused(false);
    }, AUTO_SCROLL_PAUSE_MS);
  }, []);

  const beginInteraction = useCallback(
    (x: number, y: number) => {
      interactionStartRef.current = { x, y };
      blockImageOpenRef.current = false;
      pauseAutoscroll();
    },
    [pauseAutoscroll]
  );

  const moveInteraction = useCallback((x: number, y: number) => {
    const start = interactionStartRef.current;
    if (!start || blockImageOpenRef.current) return;

    const movedFarEnough =
      Math.abs(x - start.x) > INTERACTION_CLICK_THRESHOLD ||
      Math.abs(y - start.y) > INTERACTION_CLICK_THRESHOLD;

    if (movedFarEnough) {
      blockImageOpenRef.current = true;
    }
  }, []);

  const endInteraction = useCallback(() => {
    interactionStartRef.current = null;

    if (!blockImageOpenRef.current) return;

    if (resetOpenBlockTimerRef.current) {
      clearTimeout(resetOpenBlockTimerRef.current);
    }

    resetOpenBlockTimerRef.current = setTimeout(() => {
      blockImageOpenRef.current = false;
    }, 250);
  }, []);

  const syncCarouselState = useCallback(() => {
    if (!emblaApi) return;

    const nextPageCount = Math.max(1, emblaApi.scrollSnapList().length);
    const nextIndex = Math.max(
      0,
      Math.min(emblaApi.selectedScrollSnap(), nextPageCount - 1)
    );
    const previousIndex = activeIndexRef.current;

    if (nextIndex !== previousIndex) {
      directionRef.current = nextIndex > previousIndex ? 1 : -1;
    }

    activeIndexRef.current = nextIndex;
    pageCountRef.current = nextPageCount;
    setActiveIndex(nextIndex);
    setPageCount(nextPageCount);
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  const goToIndex = useCallback(
    (targetIndex: number) => {
      if (!emblaApi) return;

      const boundedMax = Math.max(0, pageCountRef.current - 1);
      const nextIndex = Math.max(0, Math.min(targetIndex, boundedMax));
      const previousIndex = activeIndexRef.current;
      directionRef.current = nextIndex >= previousIndex ? 1 : -1;

      emblaApi.scrollTo(nextIndex);
      pauseAutoscroll();
    },
    [emblaApi, pauseAutoscroll]
  );

  const handlePrev = useCallback(() => {
    if (!canSlide) return;
    goToIndex(activeIndexRef.current - 1);
  }, [canSlide, goToIndex]);

  const handleNext = useCallback(() => {
    if (!canSlide) return;
    goToIndex(activeIndexRef.current + 1);
  }, [canSlide, goToIndex]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary) return;
    beginInteraction(event.clientX, event.clientY);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary) return;
    moveInteraction(event.clientX, event.clientY);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary) return;
    endInteraction();
  };

  useEffect(() => {
    if (!emblaApi) return;

    emblaApi.on("select", syncCarouselState);
    emblaApi.on("reInit", syncCarouselState);
    emblaApi.on("pointerDown", pauseAutoscroll);

    return () => {
      emblaApi.off("select", syncCarouselState);
      emblaApi.off("reInit", syncCarouselState);
      emblaApi.off("pointerDown", pauseAutoscroll);
    };
  }, [emblaApi, pauseAutoscroll, syncCarouselState]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.reInit();
  }, [emblaApi, items.length]);

  useEffect(() => {
    if (!emblaApi || !canSlide || isAutoPaused) return;

    const interval = setInterval(() => {
      const boundedMax = Math.max(0, pageCountRef.current - 1);
      const currentIndex = Math.min(activeIndexRef.current, boundedMax);
      const nextRaw = currentIndex + directionRef.current;
      let nextIndex = nextRaw;

      if (nextRaw > boundedMax) {
        directionRef.current = -1;
        nextIndex = Math.max(currentIndex - 1, 0);
      } else if (nextRaw < 0) {
        directionRef.current = 1;
        nextIndex = Math.min(currentIndex + 1, boundedMax);
      }

      emblaApi.scrollTo(nextIndex);
    }, AUTO_SCROLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [canSlide, emblaApi, isAutoPaused]);

  useEffect(() => {
    return () => {
      if (pauseTimerRef.current) {
        clearTimeout(pauseTimerRef.current);
      }
      if (resetOpenBlockTimerRef.current) {
        clearTimeout(resetOpenBlockTimerRef.current);
      }
    };
  }, []);

  if (!hasSlides) {
    return (
      <div className="rounded-[28px] border border-white/80 bg-white/70 p-6 text-sm text-stone-600 sm:rounded-[36px] sm:p-8">
        No public reviews yet. Be the first to share your flower story.
      </div>
    );
  }

  return (
    <div className="rounded-[28px] border-0 bg-transparent p-0 shadow-none sm:glass sm:rounded-[36px] sm:border sm:border-white/80 sm:p-6">
      <div className="relative mt-1 sm:mt-2">
        <div
          ref={emblaRef}
          className="touch-pan-y select-none overflow-hidden rounded-[28px] border border-white/80"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={endInteraction}
        >
          <div className="flex gap-0 md:gap-4">
            {items.map((review) => (
              <div
                key={review.id}
                className="w-full min-w-0 flex-shrink-0 snap-start cursor-grab active:cursor-grabbing md:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-2rem)/3)]"
              >
                <article className="flex h-full min-w-0 flex-col rounded-[24px] border border-white/85 bg-white/85 p-4 shadow-[0_12px_26px_rgba(63,40,36,0.12)] sm:p-5">
                  <div className="w-full overflow-hidden rounded-[18px] border border-stone-200/80 bg-white aspect-[4/3]">
                    <BouquetImageLightbox
                      src={review.image || ""}
                      alt={`${review.name} review photo`}
                      className="block h-full w-full"
                      imageClassName="h-full w-full object-cover object-center"
                      previewWidth={640}
                      previewHeight={480}
                      lightboxWidth={1600}
                      lightboxHeight={1200}
                      canOpen={() => !blockImageOpenRef.current}
                      onOpen={pauseAutoscroll}
                    />
                  </div>
                  <div className="flex h-full min-w-0 flex-col gap-3 pt-4 sm:pt-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-stone-900">
                          {review.name}
                        </p>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500">
                          {formatDate(review.createdAt)}
                        </p>
                      </div>
                      <ReviewStars
                        value={review.rating}
                        size="sm"
                        readOnly
                        className="shrink-0"
                      />
                    </div>
                    <p className="h-[8.8rem] overflow-y-auto pr-1 text-sm leading-relaxed text-stone-700">
                      {review.text}
                    </p>
                  </div>
                </article>
              </div>
            ))}
          </div>
        </div>

        <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-2 sm:px-3">
          <button
            type="button"
            onClick={handlePrev}
            disabled={!canScrollPrev}
            className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/85 text-stone-700 shadow-sm backdrop-blur transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-45 sm:h-11 sm:w-11"
            aria-label="Previous review"
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
            disabled={!canScrollNext}
            className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/85 text-stone-700 shadow-sm backdrop-blur transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-45 sm:h-11 sm:w-11"
            aria-label="Next review"
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
      </div>

      <p className="mt-3 text-center text-[10px] uppercase tracking-[0.24em] text-stone-500">
        Swipe to browse
      </p>

      <div className="mt-4 flex justify-center gap-2">
        {Array.from({ length: pageCount }).map((_, idx) => (
          <button
            key={`review-dot-${idx}`}
            type="button"
            onClick={() => goToIndex(idx)}
            className={`h-2 w-2 rounded-full transition ${
              idx === clampedActiveIndex ? "bg-[color:var(--brand)]" : "bg-stone-300"
            }`}
            aria-label={`Go to page ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
