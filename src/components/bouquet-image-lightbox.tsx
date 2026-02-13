"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import ImageWithFallback from "@/components/image-with-fallback";
import { lockLightboxScroll } from "@/lib/lightbox-scroll-lock";

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
};

type TelegramViewport = {
  top: number;
  left: number;
  width: number;
  height: number;
};

function detectTelegramWebview(): boolean {
  const w = window as Window & {
    TelegramWebviewProxy?: unknown;
    Telegram?: { WebApp?: unknown };
  };

  const ua = navigator.userAgent || "";
  if (/telegram|tgwebview|telegrambot|telegram-android|telegram-ios/i.test(ua)) {
    return true;
  }

  if (w.TelegramWebviewProxy || w.Telegram?.WebApp) {
    return true;
  }

  return document.documentElement.dataset.telegramWebview === "true";
}

function getTelegramViewport(): TelegramViewport {
  const viewport = window.visualViewport;
  return {
    top: Math.max(0, Math.round(viewport?.offsetTop ?? 0)),
    left: Math.max(0, Math.round(viewport?.offsetLeft ?? 0)),
    width: Math.max(0, Math.round(viewport?.width ?? window.innerWidth)),
    height: Math.max(0, Math.round(viewport?.height ?? window.innerHeight)),
  };
}

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
}: BouquetImageLightboxProps) {
  const [open, setOpen] = useState(false);
  const [telegramViewport, setTelegramViewport] = useState<TelegramViewport | null>(null);
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const startDistanceRef = useRef<number | null>(null);
  const startScaleRef = useRef(1);
  const startPositionRef = useRef({ x: 0, y: 0 });
  const lastSinglePointerRef = useRef<{ x: number; y: number } | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const imageContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof document === "undefined") return;
    setPortalRoot(document.getElementById("lightbox-root") ?? document.body);
  }, []);

  const close = () => {
    setOpen(false);
    setScale(1);
    setPosition({ x: 0, y: 0 });
    pointersRef.current.clear();
    startDistanceRef.current = null;
    lastSinglePointerRef.current = null;
  };

  useEffect(() => {
    if (!open) return;
    const updateViewport = () => {
      if (detectTelegramWebview()) {
        setTelegramViewport(getTelegramViewport());
        return;
      }
      setTelegramViewport(null);
    };
    updateViewport();
    const delayedUpdate = window.setTimeout(updateViewport, 120);
    window.visualViewport?.addEventListener("resize", updateViewport);
    window.visualViewport?.addEventListener("scroll", updateViewport);
    window.addEventListener("resize", updateViewport);
    window.addEventListener("scroll", updateViewport, { passive: true });
    return () => {
      window.clearTimeout(delayedUpdate);
      window.visualViewport?.removeEventListener("resize", updateViewport);
      window.visualViewport?.removeEventListener("scroll", updateViewport);
      window.removeEventListener("resize", updateViewport);
      window.removeEventListener("scroll", updateViewport);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    return lockLightboxScroll({ isTelegram: detectTelegramWebview() });
  }, [open]);

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

  const handleOpenClick = (event: React.MouseEvent<HTMLButtonElement>) => {
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

    if (typeof document === "undefined") {
      return;
    }
    const root = document.getElementById("lightbox-root") ?? document.body;
    setPortalRoot(root);

    setScale(1);
    setPosition({ x: 0, y: 0 });
    setOpen(true);
    onOpen?.();
  };

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
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
    if (closeRef.current?.contains(event.target as Node)) {
      return;
    }

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

    if (pointersRef.current.size === 2) {
      const [p1, p2] = Array.from(pointersRef.current.values());
      const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      startDistanceRef.current = dist;
      startScaleRef.current = scale;
      startPositionRef.current = { ...position };
      lastSinglePointerRef.current = null;
    } else if (pointersRef.current.size === 1 && scale > 1) {
      lastSinglePointerRef.current = {
        x: event.clientX,
        y: event.clientY,
      };
      startPositionRef.current = { ...position };
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.has(event.pointerId)) return;

    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });

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
      const deltaX = event.clientX - lastSinglePointerRef.current.x;
      const deltaY = event.clientY - lastSinglePointerRef.current.y;

      setPosition({
        x: startPositionRef.current.x + deltaX,
        y: startPositionRef.current.y + deltaY,
      });
    }
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(event.pointerId);
    if (pointersRef.current.size < 2) {
      startDistanceRef.current = null;
    }
    if (pointersRef.current.size === 0) {
      lastSinglePointerRef.current = null;
    }
  };

  const isTelegramLightbox = open && detectTelegramWebview();

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
              className={`lightbox-overlay fixed flex items-center justify-center p-4 ${
                isTelegramLightbox ? "bg-black" : "bg-black/70"
              }`}
              style={
                telegramViewport
                  ? {
                      top: 0,
                      left: 0,
                      width: telegramViewport.left + telegramViewport.width + 2,
                      height: telegramViewport.top + telegramViewport.height + 2,
                      right: "auto",
                      bottom: "auto",
                      zIndex: 120,
                    }
                  : {
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      zIndex: 120,
                    }
              }
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
                  src={src}
                  alt={alt}
                  width={lightboxWidth}
                  height={lightboxHeight}
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
