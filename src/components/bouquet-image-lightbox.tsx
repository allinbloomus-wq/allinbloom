"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import ImageWithFallback from "@/components/image-with-fallback";
import BouquetPlaceholder from "@/components/bouquet-placeholder";

type BouquetImageLightboxProps = {
  src: string;
  alt: string;
  className?: string;
};

export default function BouquetImageLightbox({
  src,
  alt,
  className,
}: BouquetImageLightboxProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  const [headerOffset, setHeaderOffset] = useState(0);
  const [scale, setScale] = useState(1);
  const [lightboxError, setLightboxError] = useState(false);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const startDistanceRef = useRef<number | null>(null);
  const startScaleRef = useRef(1);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const imageContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
    setPortalRoot(document.getElementById("lightbox-root"));
  }, []);

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
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const close = () => {
    setOpen(false);
    setScale(1);
    pointersRef.current.clear();
    startDistanceRef.current = null;
    setLightboxError(false);
  };

  const handleOpenClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    // Avoid opening multiple lightboxes.
    if (document.body.dataset.lightboxOpen === "true") {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    setScale(1);
    setOpen(true);
    setLightboxError(false);
  };

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    // Only close when clicking outside the image container.
    if (
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
      } catch (e) {
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
      setScale(nextScale);
    }
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(event.pointerId);
    if (pointersRef.current.size < 2) {
      startDistanceRef.current = null;
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
          width={520}
          height={520}
          className="aspect-square w-full object-cover"
        />
      </button>
      {open && mounted && portalRoot
        ? createPortal(
            <div
              className="fixed bg-black/70 flex items-center justify-center p-4"
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
              <div
                ref={imageContainerRef}
                className="relative touch-none"
                onPointerDown={handleImageContainerPointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                style={{
                  transform: `scale(${scale})`,
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
                {lightboxError ? (
                  <div className="flex h-[70vh] w-[70vw] max-w-[90vw] items-center justify-center rounded-3xl border border-white/30 bg-white/80 text-[color:var(--brand)] opacity-40">
                    <BouquetPlaceholder className="h-24 w-24" />
                  </div>
                ) : (
                  <img
                    src={src}
                    alt={alt}
                    className="max-h-[85vh] max-w-[90vw] block"
                    style={{
                      objectFit: "contain",
                      height: "auto",
                      width: "auto",
                    }}
                    draggable={false}
                    onError={() => setLightboxError(true)}
                  />
                )}
              </div>
            </div>,
            portalRoot
          )
        : null}
    </>
  );
}
