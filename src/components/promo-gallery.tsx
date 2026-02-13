"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  const [index, setIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isAutoPaused, setIsAutoPaused] = useState(false);
  const dragStartX = useRef<number | null>(null);
  const directionRef = useRef(1);
  const viewportRef = useRef<HTMLDivElement>(null);
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragStartY = useRef<number | null>(null);
  const horizontalDragRef = useRef(false);
  const [perView, setPerView] = useState(1);
  const hasTouchSupport = useRef(false);

  useEffect(() => {
    // Определяем поддержку touch событий
    hasTouchSupport.current = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }, []);

  useEffect(() => {
    const updatePerView = () => {
      setPerView(window.innerWidth >= 1024 ? 3 : 1);
    };
    updatePerView();
    window.addEventListener("resize", updatePerView);
    return () => window.removeEventListener("resize", updatePerView);
  }, []);

  useEffect(() => {
    return () => {
      if (pauseTimerRef.current) {
        clearTimeout(pauseTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (items.length < 2 || isDragging || isAutoPaused) return;
    const interval = setInterval(() => {
      setIndex((prev) => {
        const maxIndex = Math.max(0, items.length - perView);
        const next = prev + directionRef.current;
        if (next > maxIndex) {
          directionRef.current = -1;
          return Math.max(prev - 1, 0);
        }
        if (next < 0) {
          directionRef.current = 1;
          return Math.min(prev + 1, maxIndex);
        }
        return next;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [items.length, isDragging, perView, isAutoPaused]);

  const pauseAutoscroll = () => {
    setIsAutoPaused(true);
    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current);
    }
    pauseTimerRef.current = setTimeout(() => {
      setIsAutoPaused(false);
    }, 20000);
  };

  const handlePrev = () => {
    directionRef.current = -1;
    setIndex((prev) => Math.max(prev - 1, 0));
    pauseAutoscroll();
  };

  const handleNext = () => {
    directionRef.current = 1;
    setIndex((prev) => Math.min(prev + 1, Math.max(0, items.length - perView)));
    pauseAutoscroll();
  };

  const beginDrag = (x: number, y: number) => {
    if (items.length < 2) return;
    dragStartX.current = x;
    dragStartY.current = y;
    horizontalDragRef.current = false;
    setIsDragging(true);
    setDragOffset(0);
  };

  const updateDrag = (x: number, y: number): boolean => {
    if (!isDragging || dragStartX.current === null || dragStartY.current === null) return false;
    
    const deltaX = x - dragStartX.current;
    const deltaY = y - dragStartY.current;

    // Определяем направление свайпа только после значительного движения
    if (!horizontalDragRef.current && (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)) {
      // Вычисляем угол движения
      // Если |deltaY| / |deltaX| > 1, значит угол больше 45°, это вертикальный жест
      const isVertical = Math.abs(deltaY) > Math.abs(deltaX);
      
      if (isVertical) {
        // Это вертикальный скролл, отменяем перехват
        setIsDragging(false);
        setDragOffset(0);
        dragStartX.current = null;
        dragStartY.current = null;
        horizontalDragRef.current = false;
        return false;
      } else {
        // Это горизонтальный свайп (включая диагональные до 45°)
        horizontalDragRef.current = true;
      }
    }

    // Если уже определили горизонтальный свайп, продолжаем его независимо от вертикального смещения
    if (horizontalDragRef.current) {
      setDragOffset(deltaX);
      return true;
    }

    return false;
  };

  const finishDrag = (x: number) => {
    if (dragStartX.current === null) return;
    
    // Если это был горизонтальный свайп, меняем слайд
    if (isDragging && horizontalDragRef.current) {
      const delta = x - dragStartX.current;
      const width = viewportRef.current?.offsetWidth ?? 1;
      const threshold = Math.min(120, width * 0.2);

      setIndex((prev) => {
        const maxIndex = Math.max(0, items.length - perView);
        if (delta > threshold) {
          directionRef.current = -1;
          return Math.max(prev - 1, 0);
        }
        if (delta < -threshold) {
          directionRef.current = 1;
          return Math.min(prev + 1, maxIndex);
        }
        return prev;
      });
      
      pauseAutoscroll();
    }

    // Всегда сбрасываем состояние
    setIsDragging(false);
    setDragOffset(0);
    dragStartX.current = null;
    dragStartY.current = null;
    horizontalDragRef.current = false;
  };

  // Touch события - используем только их на мобильных устройствах
  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (event.touches.length !== 1 || items.length < 2) return;
    const touch = event.touches[0];
    if (!touch) return;
    beginDrag(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (event.touches.length !== 1) return;
    const touch = event.touches[0];
    if (!touch) return;
    
    const consumed = updateDrag(touch.clientX, touch.clientY);
    
    // Предотвращаем скролл ТОЛЬКО если это подтверждённый горизонтальный свайп
    if (consumed && horizontalDragRef.current && isDragging) {
      event.preventDefault();
    }
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.changedTouches[0];
    if (!touch) return;
    finishDrag(touch.clientX);
  };

  // Pointer события - только для десктопа
  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    // Игнорируем pointer события на устройствах с touch
    if (hasTouchSupport.current || event.pointerType === 'touch') return;
    if (items.length < 2) return;
    
    if (event.currentTarget.setPointerCapture) {
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Ignore
      }
    }
    beginDrag(event.clientX, event.clientY);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (hasTouchSupport.current || event.pointerType === 'touch') return;
    updateDrag(event.clientX, event.clientY);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (hasTouchSupport.current || event.pointerType === 'touch') return;
    finishDrag(event.clientX);
  };

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

      <div
        ref={viewportRef}
        className="relative mt-6 select-none overflow-hidden rounded-[28px] border border-white/80 px-0"
      >
        <div
          className={`flex gap-0 ${isDragging ? "" : "transition-transform duration-700 ease-out"} will-change-transform lg:gap-4`}
          style={{
            transform: `translateX(calc(-${index * (100 / perView)}% + ${dragOffset}px))`,
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
        >
          {items.map((slide) => (
            <div
              key={slide.id}
              className="w-full flex-shrink-0 cursor-grab active:cursor-grabbing lg:w-1/3"
            >
              <div className="relative w-full overflow-hidden rounded-[24px] border border-white/80 aspect-[9/16] sm:aspect-[9/16] lg:aspect-[9/16]">
                <ImageWithFallback
                  src={slide.image}
                  alt={slide.title || "Promo slide"}
                  fill
                  className="object-cover pointer-events-none"
                  sizes="(max-width: 768px) 100vw, 900px"
                  draggable={false}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/10 to-transparent pointer-events-none" />
                {(slide.title || slide.subtitle || slide.link) && (
                  <div className="absolute left-6 top-6 max-w-md text-white">
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
                        className="mt-4 inline-flex rounded-full border border-white/60 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white backdrop-blur"
                        onClick={(e) => {
                          // Предотвращаем переход по ссылке если был драг
                          if (isDragging || Math.abs(dragOffset) > 10) {
                            e.preventDefault();
                          }
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

        {items.length > 1 ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-3">
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

      {items.length > 1 ? (
        <div className="mt-4 flex justify-center gap-2">
          {items.map((slide, idx) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => {
                setIndex(idx);
                pauseAutoscroll();
              }}
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
