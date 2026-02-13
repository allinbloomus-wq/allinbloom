"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import ImageWithFallback from "@/components/image-with-fallback";

type LightboxGalleryItem = {
  src: string;
  alt: string;
  lightboxWidth?: number;
  lightboxHeight?: number;
};

type BouquetImageLightboxProps = {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  previewWidth?: number;
  previewHeight?: number;
  lightboxWidth?: number;
  lightboxHeight?: number;
  canOpen?: () => boolean;
  onOpen?: () => void;
  galleryItems?: LightboxGalleryItem[];
  galleryStartIndex?: number;
};

export default function BouquetImageLightbox({
  src,
  alt,
  className,
  imageClassName,
  previewWidth = 520,
  previewHeight = 520,
  lightboxWidth = 1600,
  lightboxHeight = 1600,
  canOpen,
  onOpen,
  galleryItems,
  galleryStartIndex = 0,
}: BouquetImageLightboxProps) {
  const [open, setOpen] = useState(false);
  const [headerOffset, setHeaderOffset] = useState(0);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [currentIndex, setCurrentIndex] = useState(0);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const startDistanceRef = useRef<number | null>(null);
  const startScaleRef = useRef(1);
  const startPositionRef = useRef({ x: 0, y: 0 });
  const lastSinglePointerRef = useRef<{ x: number; y: number } | null>(null);
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const currentIndexRef = useRef(0);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const imageContainerRef = useRef<HTMLDivElement | null>(null);
  const portalRoot =
    typeof document !== "undefined" ? document.getElementById("lightbox-root") : null;

  const lightboxItems = useMemo(() => {
    if (galleryItems?.length) {
      return galleryItems;
    }
    return [
      {
        src,
        alt,
        lightboxWidth,
        lightboxHeight,
      },
    ];
  }, [alt, galleryItems, lightboxHeight, lightboxWidth, src]);

  const hasGallery = lightboxItems.length > 1;

  const clampIndex = useCallback(
    (index: number) => Math.max(0, Math.min(index, lightboxItems.length - 1)),
    [lightboxItems.length]
  );

  const resetInteraction = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    pointersRef.current.clear();
    startDistanceRef.current = null;
    lastSinglePointerRef.current = null;
    swipeStartRef.current = null;
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    resetInteraction();
  }, [resetInteraction]);

  const goToIndex = useCallback(
    (targetIndex: number) => {
      const nextIndex = clampIndex(targetIndex);
      if (nextIndex === currentIndexRef.current) {
        return;
      }
      currentIndexRef.current = nextIndex;
      setCurrentIndex(nextIndex);
      resetInteraction();
    },
    [clampIndex, resetInteraction]
  );

  const activeItem = lightboxItems[currentIndex] || lightboxItems[0];
  const canGoPrev = hasGallery && currentIndex > 0 && scale === 1;
  const canGoNext = hasGallery && currentIndex < lightboxItems.length - 1 && scale === 1;

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

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

  // Lock body scroll and set the lightbox flag.
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

  // Close on Escape.
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
        goToIndex(currentIndexRef.current - 1);
        return;
      }

      if (event.key === "ArrowRight" && canGoNext) {
        event.preventDefault();
        goToIndex(currentIndexRef.current + 1);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canGoNext, canGoPrev, close, goToIndex, open]);

  const handleOpenClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    // Avoid opening multiple lightboxes.
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

    const nextIndex = clampIndex(galleryStartIndex);
    currentIndexRef.current = nextIndex;
    setCurrentIndex(nextIndex);
    resetInteraction();
    setOpen(true);
    onOpen?.();
  };

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    // Only close when clicking outside the image container and not zoomed.
    if (
      scale === 1 &&
      imageContainerRef.current &&
      !imageContainerRef.current.contains(event.target as Node)
    ) {
      close();
    }
  };

  const handleImageContainerPointerDown = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    // Ignore clicks on the Close button.
    if (closeRef.current?.contains(event.target as Node)) {
      return;
    }

    // Prevent bubbling so the overlay does not close.
    event.stopPropagation();

    const target = event.currentTarget as HTMLDivElement;
    if (target.setPointerCapture) {
      try {
        target.setPointerCapture(event.pointerId);
      } catch {
        // Ignore setPointerCapture errors.
      }
    }

    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });

    // Start pinch-to-zoom when two pointers are active.
    if (pointersRef.current.size === 2) {
      const [p1, p2] = Array.from(pointersRef.current.values());
      const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      startDistanceRef.current = dist;
      startScaleRef.current = scale;
      startPositionRef.current = { ...position };
      lastSinglePointerRef.current = null;
      swipeStartRef.current = null;
    } else if (pointersRef.current.size === 1 && scale > 1) {
      // Start panning when zoomed in with single pointer
      lastSinglePointerRef.current = {
        x: event.clientX,
        y: event.clientY,
      };
      startPositionRef.current = { ...position };
      swipeStartRef.current = null;
    } else if (pointersRef.current.size === 1 && scale === 1 && hasGallery) {
      swipeStartRef.current = {
        x: event.clientX,
        y: event.clientY,
      };
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.has(event.pointerId)) return;

    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });

    // Scale only when two pointers are active.
    if (pointersRef.current.size === 2 && startDistanceRef.current) {
      const [p1, p2] = Array.from(pointersRef.current.values());
      const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      const nextScale = Math.min(
        3,
        Math.max(1, startScaleRef.current * (dist / startDistanceRef.current))
      );

      if (scale !== 1 && nextScale === 1) {
        setPosition({ x: 0, y: 0 });
      }

      setScale(nextScale);
    } else if (
      pointersRef.current.size === 1 &&
      scale > 1 &&
      lastSinglePointerRef.current
    ) {
      // Pan when zoomed in with single pointer
      const deltaX = event.clientX - lastSinglePointerRef.current.x;
      const deltaY = event.clientY - lastSinglePointerRef.current.y;

      setPosition({
        x: startPositionRef.current.x + deltaX,
        y: startPositionRef.current.y + deltaY,
      });
    }
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const swipeStart = swipeStartRef.current;
    const isSinglePointerGesture =
      pointersRef.current.size === 1 && pointersRef.current.has(event.pointerId);

    if (scale === 1 && hasGallery && isSinglePointerGesture && swipeStart) {
      const deltaX = event.clientX - swipeStart.x;
      const deltaY = event.clientY - swipeStart.y;
      const horizontalSwipe =
        Math.abs(deltaX) > 52 && Math.abs(deltaX) > Math.abs(deltaY) + 10;

      if (horizontalSwipe) {
        if (deltaX < 0) {
          goToIndex(currentIndexRef.current + 1);
        } else {
          goToIndex(currentIndexRef.current - 1);
        }
      }
    }

    pointersRef.current.delete(event.pointerId);
    if (pointersRef.current.size < 2) {
      startDistanceRef.current = null;
    }
    if (pointersRef.current.size === 0) {
      lastSinglePointerRef.current = null;
      swipeStartRef.current = null;
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpenClick}
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
              className="fixed relative bg-black/70 flex items-center justify-center p-4"
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
            >
              {hasGallery ? (
                <>
                  <button
                    type="button"
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => {
                      event.stopPropagation();
                      goToIndex(currentIndexRef.current - 1);
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
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => {
                      event.stopPropagation();
                      goToIndex(currentIndexRef.current + 1);
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
                  <div className="pointer-events-none absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/40 bg-black/35 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/95 backdrop-blur">
                    {currentIndex + 1} / {lightboxItems.length}
                  </div>
                </>
              ) : null}
              <div
                ref={imageContainerRef}
                className="relative touch-none"
                onPointerDown={handleImageContainerPointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                  transformOrigin: "center",
                  transition: scale === 1 ? "transform 0.2s ease-out" : "none",
                }}
              >
                <button
                  type="button"
                  onClick={close}
                  ref={closeRef}
                  className="absolute right-[15px] top-[15px] z-10 rounded-full bg-white/60 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.15em] text-stone-800 shadow-lg hover:bg-white/80 transition-colors backdrop-blur-sm"
                  aria-label="Close image"
                >
                  Close
                </button>
                <ImageWithFallback
                  src={activeItem.src}
                  alt={activeItem.alt}
                  width={activeItem.lightboxWidth || lightboxWidth}
                  height={activeItem.lightboxHeight || lightboxHeight}
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
