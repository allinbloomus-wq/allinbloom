"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import ImageWithFallback from "@/components/image-with-fallback";

export type GalleryLightboxItem = {
  src: string;
  alt: string;
  lightboxWidth?: number;
  lightboxHeight?: number;
};

type GalleryImageLightboxProps = {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  previewWidth?: number;
  previewHeight?: number;
  items: GalleryLightboxItem[];
  startIndex: number;
  canOpen?: () => boolean;
  onOpen?: () => void;
};

export default function GalleryImageLightbox({
  src,
  alt,
  className,
  imageClassName,
  previewWidth = 520,
  previewHeight = 520,
  items,
  startIndex,
  canOpen,
  onOpen,
}: GalleryImageLightboxProps) {
  const [open, setOpen] = useState(false);
  const [headerOffset, setHeaderOffset] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<"next" | "prev" | null>(null);
  const [transitionTick, setTransitionTick] = useState(0);

  const overlayRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const currentIndexRef = useRef(0);

  const portalRoot =
    typeof document !== "undefined" ? document.getElementById("lightbox-root") : null;

  const lightboxItems = useMemo(() => {
    return items.length
      ? items
      : [
          {
            src,
            alt,
            lightboxWidth: 1600,
            lightboxHeight: 1600,
          },
        ];
  }, [alt, items, src]);

  const clampIndex = useCallback(
    (index: number) => Math.max(0, Math.min(index, lightboxItems.length - 1)),
    [lightboxItems.length]
  );

  const hasMultiple = lightboxItems.length > 1;
  const active = lightboxItems[currentIndex] || lightboxItems[0];
  const canGoPrev = hasMultiple && currentIndex > 0;
  const canGoNext = hasMultiple && currentIndex < lightboxItems.length - 1;
  const animation = direction
    ? direction === "next"
      ? "lightbox-slide-next 240ms cubic-bezier(0.22, 1, 0.36, 1)"
      : "lightbox-slide-prev 240ms cubic-bezier(0.22, 1, 0.36, 1)"
    : "lightbox-fade-in 180ms ease-out";

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  const close = useCallback(() => {
    setOpen(false);
    swipeStartRef.current = null;
  }, []);

  const goTo = useCallback(
    (targetIndex: number) => {
      const current = currentIndexRef.current;
      const next = clampIndex(targetIndex);
      if (next === current) return;
      setDirection(next > current ? "next" : "prev");
      setTransitionTick((value) => value + 1);
      currentIndexRef.current = next;
      setCurrentIndex(next);
    },
    [clampIndex]
  );

  useEffect(() => {
    if (!open) return;
    const updateOffset = () => {
      const header = document.querySelector("header");
      const height = header ? header.getBoundingClientRect().height : 0;
      setHeaderOffset(height);
    };
    updateOffset();
    window.addEventListener("resize", updateOffset);
    return () => window.removeEventListener("resize", updateOffset);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.dataset.lightboxOpen = "true";

    return () => {
      document.body.style.overflow = previousOverflow;
      delete document.body.dataset.lightboxOpen;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key === "ArrowLeft" && canGoPrev) {
        event.preventDefault();
        goTo(currentIndexRef.current - 1);
        return;
      }
      if (event.key === "ArrowRight" && canGoNext) {
        event.preventDefault();
        goTo(currentIndexRef.current + 1);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canGoNext, canGoPrev, close, goTo, open]);

  const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (document.body.dataset.lightboxOpen === "true") {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (canOpen && !canOpen()) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (!portalRoot) {
      return;
    }

    const nextIndex = clampIndex(startIndex);
    setDirection(null);
    setTransitionTick((value) => value + 1);
    currentIndexRef.current = nextIndex;
    setCurrentIndex(nextIndex);
    setOpen(true);
    onOpen?.();
  };

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (closeRef.current?.contains(event.target as Node)) {
      return;
    }
    if (overlayRef.current && event.target === overlayRef.current) {
      close();
    }
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || !hasMultiple) return;
    swipeStartRef.current = { x: event.clientX, y: event.clientY };
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || !hasMultiple || !swipeStartRef.current) return;

    const deltaX = event.clientX - swipeStartRef.current.x;
    const deltaY = event.clientY - swipeStartRef.current.y;
    swipeStartRef.current = null;

    const isHorizontalSwipe =
      Math.abs(deltaX) > 48 && Math.abs(deltaX) > Math.abs(deltaY) + 10;
    if (!isHorizontalSwipe) return;

    if (deltaX < 0) {
      goTo(currentIndexRef.current + 1);
    } else {
      goTo(currentIndexRef.current - 1);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={className}
        aria-label="Open image"
      >
        <ImageWithFallback
          src={src}
          alt={alt}
          width={previewWidth}
          height={previewHeight}
          className={imageClassName || "aspect-square w-full object-cover"}
        />
      </button>

      {open && portalRoot
        ? createPortal(
            <div
              ref={overlayRef}
              className="fixed bg-black/75 flex items-center justify-center p-4"
              style={{
                top: headerOffset,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 50,
              }}
              role="dialog"
              aria-modal="true"
              onClick={handleOverlayClick}
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerCancel={() => {
                swipeStartRef.current = null;
              }}
            >
              <button
                type="button"
                onClick={close}
                ref={closeRef}
                className="absolute right-4 top-4 z-20 rounded-full bg-white/70 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.15em] text-stone-800 shadow-lg hover:bg-white/90 transition-colors backdrop-blur-sm"
                aria-label="Close image"
              >
                Close
              </button>

              {hasMultiple ? (
                <>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      goTo(currentIndexRef.current - 1);
                    }}
                    disabled={!canGoPrev}
                    className="hidden sm:flex absolute left-4 top-1/2 z-20 -translate-y-1/2 h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/85 text-stone-700 shadow-sm backdrop-blur transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Previous image"
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
                      goTo(currentIndexRef.current + 1);
                    }}
                    disabled={!canGoNext}
                    className="hidden sm:flex absolute right-4 top-1/2 z-20 -translate-y-1/2 h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/85 text-stone-700 shadow-sm backdrop-blur transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Next image"
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

                  <div className="pointer-events-none absolute bottom-16 left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/40 bg-black/35 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/95 backdrop-blur sm:bottom-4">
                    {currentIndex + 1} / {lightboxItems.length}
                  </div>

                  <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex items-center justify-between px-4 sm:hidden">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        goTo(currentIndexRef.current - 1);
                      }}
                      disabled={!canGoPrev}
                      className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/85 text-stone-700 shadow-sm backdrop-blur transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-35"
                      aria-label="Previous image"
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
                    <div className="rounded-full border border-white/35 bg-black/30 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-white/90 backdrop-blur">
                      Swipe
                    </div>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        goTo(currentIndexRef.current + 1);
                      }}
                      disabled={!canGoNext}
                      className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/85 text-stone-700 shadow-sm backdrop-blur transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-35"
                      aria-label="Next image"
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
                </>
              ) : null}

              <div
                key={`${currentIndex}-${transitionTick}`}
                className="relative"
                style={{ animation }}
              >
                <ImageWithFallback
                  src={active.src}
                  alt={active.alt}
                  width={active.lightboxWidth || 1600}
                  height={active.lightboxHeight || 1600}
                  className="max-h-[85vh] max-w-[90vw] block h-auto w-auto object-contain"
                  draggable={false}
                />
              </div>
            </div>,
            portalRoot
          )
        : null}
    </>
  );
}
