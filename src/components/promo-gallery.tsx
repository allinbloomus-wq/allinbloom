"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import ImageWithFallback from "@/components/image-with-fallback";

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

const DRAG_SPRING_MAX_OFFSET = 92;
const DRAG_SPRING_MAX_OFFSET_MOBILE = 58;
const DRAG_SPRING_FACTOR = 0.85;
const SWIPE_AXIS_LOCK_THRESHOLD = 8;
const SWIPE_CHANGE_MIN_PX = 24;
const SWIPE_CHANGE_RATIO = 0.14;
const SWIPE_FLICK_MIN_PX = 10;
const SWIPE_FLICK_VELOCITY = 0.2;

const FALLBACK_SLIDES: PromoSlide[] = [
  {
    id: "fallback-1",
    title: "",
    subtitle: "",
    image: "/images/promo-1.webp",
    link: "",
  },
  {
    id: "fallback-2",
    title: "",
    subtitle: "",
    image: "/images/promo-2.webp",
    link: "",
  },
  {
    id: "fallback-3",
    title: "Gift-ready details",
    subtitle: "Handwritten notes and satin ribbon.",
    image: "/images/promo-3.webp",
    link: "/catalog",
  },
];

export default function PromoGallery({ slides }: PromoGalleryProps) {
  const items = useMemo(
    () => (slides.length ? slides : FALLBACK_SLIDES),
    [slides]
  );
  const [index, setIndex] = useState(0);
  const [isAutoPaused, setIsAutoPaused] = useState(false);
  const [perView, setPerView] = useState(1);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const hasSlides = items.length > 0;
  const maxIndex = Math.max(0, items.length - perView);
  const canSlide = maxIndex > 0;
  const pageCount = maxIndex + 1;
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
  const dragPointerIdRef = useRef<number | null>(null);
  const dragStartXRef = useRef(0);
  const dragStartYRef = useRef(0);
  const dragStartScrollLeftRef = useRef(0);
  const dragStartIndexRef = useRef(0);
  const dragStartTimeRef = useRef(0);
  const dragLastScrollLeftRef = useRef(0);
  const touchGestureActiveRef = useRef(false);
  const touchGestureAxisRef = useRef<"x" | "y" | null>(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);

  useEffect(() => {
    slideRefs.current = slideRefs.current.slice(0, items.length);
  }, [items.length]);

  useEffect(() => {
    const updatePerView = () => {
      if (window.innerWidth >= 1024) {
        setPerView(3);
        return;
      }
      if (window.innerWidth >= 768) {
        setPerView(2);
        return;
      }
      setPerView(1);
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

  const getSpringOffset = useCallback((overflow: number) => {
    if (overflow === 0) return 0;
    const sign = Math.sign(overflow);
    const absOverflow = Math.abs(overflow);
    const viewportWidth = viewportRef.current?.clientWidth ?? 0;
    const maxOffset =
      viewportWidth > 0 && viewportWidth < 768
        ? DRAG_SPRING_MAX_OFFSET_MOBILE
        : DRAG_SPRING_MAX_OFFSET;
    const scaled = absOverflow * DRAG_SPRING_FACTOR;
    const softened =
      maxOffset *
      (1 - Math.exp(-scaled / maxOffset));
    return sign * softened;
  }, []);

  const applyDragPosition = useCallback(
    (clientX: number) => {
      const viewport = viewportRef.current;
      if (!viewport) return;

      const distanceX = clientX - dragStartXRef.current;
      const nextScrollLeft = dragStartScrollLeftRef.current - distanceX;
      const maxScrollLeft = Math.max(
        0,
        viewport.scrollWidth - viewport.clientWidth
      );
      const clampedScrollLeft = Math.max(0, Math.min(nextScrollLeft, maxScrollLeft));
      viewport.scrollLeft = clampedScrollLeft;
      dragLastScrollLeftRef.current = clampedScrollLeft;

      const overflow = nextScrollLeft - clampedScrollLeft;
      const nextOffset =
        maxScrollLeft === 0 ? getSpringOffset(distanceX) : getSpringOffset(-overflow);
      setDragOffset(nextOffset);
    },
    [getSpringOffset]
  );

  const handleViewportScroll = useCallback(() => {
    if (isDraggingRef.current) return;
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

  const settleToNearestIndex = useCallback(
    (behavior: ScrollBehavior) => {
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

      directionRef.current = nearestIndex >= indexRef.current ? 1 : -1;
      indexRef.current = nearestIndex;
      setIndex(nearestIndex);
      scrollToIndex(nearestIndex, behavior);
    },
    [maxIndex, scrollToIndex]
  );

  const settleAfterDrag = useCallback(
    (distance: number) => {
      if (!canSlide) return;

      const startedAtFirst = dragStartIndexRef.current <= 0;
      const startedAtLast = dragStartIndexRef.current >= maxIndex;

      // Keep edge overscroll perfectly symmetric: always return to the same edge.
      if ((startedAtFirst && distance <= 0) || (startedAtLast && distance >= 0)) {
        goToIndex(dragStartIndexRef.current);
        return;
      }

      settleToNearestIndex("smooth");
    },
    [canSlide, goToIndex, maxIndex, settleToNearestIndex]
  );

  const getSlideTravelDistance = useCallback(
    (baseIndex: number) => {
      const viewport = viewportRef.current;
      if (!viewport) return 1;

      const current = slideRefs.current[baseIndex] || null;
      const next = slideRefs.current[Math.min(baseIndex + 1, maxIndex)] || null;
      const prev = slideRefs.current[Math.max(baseIndex - 1, 0)] || null;

      if (current && next && next !== current) {
        return Math.max(1, Math.abs(next.offsetLeft - current.offsetLeft));
      }
      if (current && prev && prev !== current) {
        return Math.max(1, Math.abs(current.offsetLeft - prev.offsetLeft));
      }

      return Math.max(1, viewport.clientWidth / Math.max(1, perView));
    },
    [maxIndex, perView]
  );

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || !hasSlides || event.pointerType === "touch") return;
    beginInteraction(event.clientX, event.clientY);

    const viewport = viewportRef.current;
    if (!viewport) return;

    dragPointerIdRef.current = event.pointerId;
    dragStartXRef.current = event.clientX;
    dragStartYRef.current = event.clientY;
    dragStartScrollLeftRef.current = viewport.scrollLeft;
    dragStartIndexRef.current = indexRef.current;
    dragStartTimeRef.current = performance.now();
    dragLastScrollLeftRef.current = viewport.scrollLeft;
    isDraggingRef.current = true;
    setIsDragging(true);
    if (typeof viewport.setPointerCapture === "function") {
      viewport.setPointerCapture(event.pointerId);
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || event.pointerType === "touch") return;
    moveInteraction(event.clientX, event.clientY);
    if (dragPointerIdRef.current !== event.pointerId) return;
    applyDragPosition(event.clientX);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch") return;
    if (
      dragPointerIdRef.current !== null &&
      dragPointerIdRef.current === event.pointerId
    ) {
      const viewport = viewportRef.current;
      if (
        viewport &&
        typeof viewport.hasPointerCapture === "function" &&
        viewport.hasPointerCapture(event.pointerId) &&
        typeof viewport.releasePointerCapture === "function"
      ) {
        viewport.releasePointerCapture(event.pointerId);
      }
      dragPointerIdRef.current = null;
    }

    isDraggingRef.current = false;
    setIsDragging(false);
    setDragOffset(0);
    const distance =
      dragLastScrollLeftRef.current - dragStartScrollLeftRef.current;
    settleAfterDrag(distance);
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
    const viewport = viewportRef.current;
    if (!viewport) return;

    const onTouchStart = (event: TouchEvent) => {
      if (!hasSlides || event.touches.length !== 1) return;
      const touch = event.touches[0];
      beginInteraction(touch.clientX, touch.clientY);

      touchGestureActiveRef.current = true;
      touchGestureAxisRef.current = null;
      dragStartXRef.current = touch.clientX;
      dragStartYRef.current = touch.clientY;
      dragStartScrollLeftRef.current = viewport.scrollLeft;
      dragStartIndexRef.current = indexRef.current;
      dragStartTimeRef.current = performance.now();
      dragLastScrollLeftRef.current = viewport.scrollLeft;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!touchGestureActiveRef.current || event.touches.length !== 1) return;
      const touch = event.touches[0];
      moveInteraction(touch.clientX, touch.clientY);

      if (touchGestureAxisRef.current === null) {
        const movedX = Math.abs(touch.clientX - dragStartXRef.current);
        const movedY = Math.abs(touch.clientY - dragStartYRef.current);
        if (
          movedX < SWIPE_AXIS_LOCK_THRESHOLD &&
          movedY < SWIPE_AXIS_LOCK_THRESHOLD
        ) {
          return;
        }
        touchGestureAxisRef.current = movedX > movedY ? "x" : "y";
      }

      if (touchGestureAxisRef.current !== "x") return;
      if (event.cancelable) {
        event.preventDefault();
      }
      if (!isDraggingRef.current) {
        isDraggingRef.current = true;
        setIsDragging(true);
      }
      applyDragPosition(touch.clientX);
    };

    const onTouchEnd = () => {
      if (!touchGestureActiveRef.current) return;
      const hadHorizontalDrag = touchGestureAxisRef.current === "x";
      const distance =
        dragLastScrollLeftRef.current - dragStartScrollLeftRef.current;
      touchGestureActiveRef.current = false;
      touchGestureAxisRef.current = null;
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setIsDragging(false);
      }
      setDragOffset(0);

      let switchedBySwipe = false;
      if (canSlide && hadHorizontalDrag) {
        const elapsed = Math.max(1, performance.now() - dragStartTimeRef.current);
        const velocity = distance / elapsed;
        const stepDistance = getSlideTravelDistance(dragStartIndexRef.current);
        const swipeThreshold = Math.max(
          SWIPE_CHANGE_MIN_PX,
          stepDistance * SWIPE_CHANGE_RATIO
        );
        const isFlick =
          Math.abs(distance) >= SWIPE_FLICK_MIN_PX &&
          Math.abs(velocity) >= SWIPE_FLICK_VELOCITY;

        if (distance >= swipeThreshold || (distance > 0 && isFlick)) {
          goToIndex(dragStartIndexRef.current + 1);
          switchedBySwipe = true;
        } else if (distance <= -swipeThreshold || (distance < 0 && isFlick)) {
          goToIndex(dragStartIndexRef.current - 1);
          switchedBySwipe = true;
        }
      }

      if (!switchedBySwipe) {
        settleAfterDrag(distance);
      }
      endInteraction();
    };

    viewport.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      viewport.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [
    applyDragPosition,
    beginInteraction,
    canSlide,
    endInteraction,
    getSlideTravelDistance,
    goToIndex,
    hasSlides,
    moveInteraction,
    settleAfterDrag,
  ]);

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
      <div className="flex flex-wrap items-end justify-between gap-3 sm:gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-stone-500">
            Studio offers
          </p>
          <h2 className="text-2xl font-semibold text-stone-900 sm:text-4xl">
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
          className="touch-pan-y overscroll-x-contain select-none overflow-x-auto rounded-[28px] border border-white/80 snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          onScroll={handleViewportScroll}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{
            scrollBehavior: isDragging ? "auto" : "smooth",
            scrollSnapType: isDragging ? "none" : "x mandatory",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <div
            className="flex gap-0 md:gap-4"
            style={{
              transform: `translate3d(${dragOffset}px, 0, 0)`,
              transition: isDragging
                ? "none"
                : "transform 460ms cubic-bezier(0.22, 0.9, 0.24, 1)",
            }}
          >
            {items.map((slide, idx) => (
              <div
                key={slide.id}
                ref={(node) => {
                  slideRefs.current[idx] = node;
                }}
                className="w-full flex-shrink-0 snap-start cursor-grab active:cursor-grabbing md:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-2rem)/3)]"
              >
                <div className="relative w-full overflow-hidden rounded-[24px] border border-white/40 sm:border-white/80 aspect-[9/16] sm:aspect-[9/16] lg:aspect-[9/16]">
                  <ImageWithFallback
                    src={slide.image}
                    alt={slide.title || "Promo slide"}
                    width={900}
                    height={1600}
                    className="h-full w-full object-cover pointer-events-none"
                    draggable={false}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/10 to-transparent pointer-events-none" />
                  {(slide.title || slide.subtitle || slide.link) && (
                    <div className="pointer-events-none absolute left-4 right-4 top-4 text-white sm:left-6 sm:right-auto sm:top-6 sm:max-w-md">
                      {slide.title && (
                        <>
                          <p className="text-xs uppercase tracking-[0.3em] text-white/70">
                            Promotion
                          </p>
                          <h3 className="mt-2 text-xl font-semibold sm:text-3xl">
                            {slide.title}
                          </h3>
                        </>
                      )}
                      {slide.subtitle && (
                        <p className="mt-2 text-xs text-white/80 sm:text-sm">
                          {slide.subtitle}
                        </p>
                      )}
                      {slide.link && (
                        <Link
                          href={slide.link}
                          className="pointer-events-auto mt-3 inline-flex rounded-full border border-white/60 bg-white/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.24em] text-white backdrop-blur sm:mt-4 sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.3em]"
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

        <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-2 sm:px-3">
          <button
            type="button"
            onClick={handlePrev}
            disabled={!canSlide}
            className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/85 text-stone-700 shadow-sm backdrop-blur transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-45 sm:h-11 sm:w-11"
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
            disabled={!canSlide}
            className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/85 text-stone-700 shadow-sm backdrop-blur transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-45 sm:h-11 sm:w-11"
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
      </div>

      {hasSlides ? (
        <p className="mt-3 text-center text-[10px] uppercase tracking-[0.24em] text-stone-500">
          Swipe to browse
        </p>
      ) : null}

      {hasSlides ? (
        <div className="mt-4 flex justify-center gap-2">
          {Array.from({ length: pageCount }).map((_, idx) => (
            <button
              key={`promo-dot-${idx}`}
              type="button"
              onClick={() => goToIndex(idx)}
              className={`h-2 w-2 rounded-full transition ${
                idx === activeIndex ? "bg-[color:var(--brand)]" : "bg-stone-300"
              }`}
              aria-label={`Go to page ${idx + 1}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

