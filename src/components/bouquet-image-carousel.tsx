"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import GalleryImageLightbox from "@/components/gallery-image-lightbox";

type BouquetImageCarouselProps = {
  images: string[];
  alt: string;
};

const INTERACTION_CLICK_THRESHOLD = 8;

export default function BouquetImageCarousel({
  images,
  alt,
}: BouquetImageCarouselProps) {
  const safeImages = useMemo(
    () => (images.length ? images : ["/images/mock.webp"]),
    [images]
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [pageCount, setPageCount] = useState(1);
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

  const activeIndexRef = useRef(0);
  const pageCountRef = useRef(1);
  const interactionStartRef = useRef<{ x: number; y: number } | null>(null);
  const blockImageOpenRef = useRef(false);
  const resetOpenBlockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const canSlide = pageCount > 1;
  const maxIndex = Math.max(0, pageCount - 1);
  const clampedActiveIndex = Math.min(activeIndex, maxIndex);

  const syncCarouselState = useCallback(() => {
    if (!emblaApi) return;

    const nextPageCount = Math.max(1, emblaApi.scrollSnapList().length);
    const nextIndex = Math.max(
      0,
      Math.min(emblaApi.selectedScrollSnap(), nextPageCount - 1)
    );

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
      emblaApi.scrollTo(nextIndex);
    },
    [emblaApi]
  );

  const handlePrev = useCallback(() => {
    if (!canSlide) return;
    goToIndex(activeIndexRef.current - 1);
  }, [canSlide, goToIndex]);

  const handleNext = useCallback(() => {
    if (!canSlide) return;
    goToIndex(activeIndexRef.current + 1);
  }, [canSlide, goToIndex]);

  const beginInteraction = useCallback((x: number, y: number) => {
    interactionStartRef.current = { x, y };
    blockImageOpenRef.current = false;
  }, []);

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

  const lightboxItems = useMemo(
    () =>
      safeImages.map((src, index) => ({
        src,
        alt: `${alt} ${index + 1}`,
        lightboxWidth: 1600,
        lightboxHeight: 1600,
      })),
    [alt, safeImages]
  );

  useEffect(() => {
    if (!emblaApi) return;

    emblaApi.on("select", syncCarouselState);
    emblaApi.on("reInit", syncCarouselState);
    syncCarouselState();

    return () => {
      emblaApi.off("select", syncCarouselState);
      emblaApi.off("reInit", syncCarouselState);
    };
  }, [emblaApi, syncCarouselState]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.reInit();
  }, [emblaApi, safeImages.length]);

  useEffect(() => {
    return () => {
      if (resetOpenBlockTimerRef.current) {
        clearTimeout(resetOpenBlockTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      <div
        ref={emblaRef}
        className="touch-pan-y select-none overflow-hidden"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={endInteraction}
      >
        <div className="flex">
          {safeImages.map((src, index) => (
            <div
              key={`${src}-${index}`}
              className="w-full min-w-0 flex-shrink-0 snap-start cursor-grab active:cursor-grabbing"
            >
              <GalleryImageLightbox
                src={src}
                alt={alt}
                className="block w-full"
                imageClassName="aspect-square w-full object-cover"
                previewWidth={520}
                previewHeight={520}
                items={lightboxItems}
                startIndex={index}
                canOpen={() => !blockImageOpenRef.current}
                onOpen={endInteraction}
              />
            </div>
          ))}
        </div>
      </div>

      {canSlide ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-2 sm:px-3">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              handlePrev();
            }}
            disabled={!canScrollPrev}
            className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/85 text-stone-700 shadow-sm backdrop-blur transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-45 sm:h-11 sm:w-11"
            aria-label="Previous bouquet photo"
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
            onClick={(event) => {
              event.stopPropagation();
              handleNext();
            }}
            disabled={!canScrollNext}
            className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/85 text-stone-700 shadow-sm backdrop-blur transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-45 sm:h-11 sm:w-11"
            aria-label="Next bouquet photo"
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

      {canSlide ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center gap-2">
          {Array.from({ length: pageCount }).map((_, index) => (
            <button
              key={`bouquet-dot-${index}`}
              type="button"
              onClick={() => goToIndex(index)}
              className={`pointer-events-auto h-2 w-2 rounded-full transition ${
                index === clampedActiveIndex ? "bg-white" : "bg-white/45"
              }`}
              aria-label={`Go to bouquet photo ${index + 1}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
