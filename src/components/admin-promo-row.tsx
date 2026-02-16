"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import type { PromoSlide } from "@/lib/api-types";
import { deletePromoSlide } from "@/app/admin/promotions/actions";
import ImageWithFallback from "@/components/image-with-fallback";

export default function AdminPromoRow({ slide }: { slide: PromoSlide }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isMenuOpen) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (
        menuRef.current &&
        event.target instanceof Node &&
        !menuRef.current.contains(event.target)
      ) {
        setIsMenuOpen(false);
      }
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("mousedown", closeOnOutsideClick);
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      window.removeEventListener("mousedown", closeOnOutsideClick);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isMenuOpen]);

  const confirmPermanentDelete = (event: FormEvent<HTMLFormElement>) => {
    const confirmed = window.confirm(
      "Delete this promotion permanently? The record will be removed forever and cannot be restored."
    );
    if (!confirmed) {
      event.preventDefault();
      return;
    }
    setIsMenuOpen(false);
  };

  return (
    <div className="relative rounded-[24px] border border-white/80 bg-white/70 p-4 shadow-sm">
      <div ref={menuRef} className="absolute right-4 top-4 z-20">
        <button
          type="button"
          aria-label="Promotion actions"
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((current) => !current)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 bg-white/90 transition hover:border-stone-300"
        >
          <span className="inline-flex items-center gap-0.5">
            <span className="h-1 w-1 rounded-full bg-stone-600" />
            <span className="h-1 w-1 rounded-full bg-stone-600" />
            <span className="h-1 w-1 rounded-full bg-stone-600" />
          </span>
        </button>
        {isMenuOpen ? (
          <div className="absolute right-0 top-10 min-w-[190px] rounded-2xl border border-stone-200 bg-white p-1.5 shadow-lg">
            <form action={deletePromoSlide} onSubmit={confirmPermanentDelete}>
              <input type="hidden" name="id" value={slide.id} />
              <button
                type="submit"
                className="flex w-full items-center rounded-xl px-3 py-2 text-left text-xs uppercase tracking-[0.18em] text-rose-700 transition hover:bg-rose-50"
              >
                Delete Forever
              </button>
            </form>
          </div>
        ) : null}
      </div>
      <div className="flex max-w-full flex-col gap-4 pr-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="h-16 w-24 overflow-hidden rounded-2xl border border-white/80 bg-white">
            <ImageWithFallback
              src={slide.image}
              alt={slide.title || "Promo slide"}
              width={120}
              height={80}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-stone-900">
              {slide.title || "Untitled slide"}
            </p>
            <p className="break-words text-xs text-stone-500">
              Position: {slide.position}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {!slide.isActive ? (
            <span className="rounded-full bg-stone-200 px-3 py-1 text-stone-600">
              Hidden
            </span>
          ) : null}
          {slide.link ? (
            <span className="rounded-full border border-stone-200 bg-white/80 px-3 py-1 text-stone-600">
              Linked
            </span>
          ) : null}
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
          <Link
            href={`/admin/promotions/${slide.id}/edit`}
            className="inline-flex h-11 w-full items-center justify-center rounded-full border border-stone-300 bg-white/80 px-4 text-center text-xs uppercase tracking-[0.3em] text-stone-600 sm:w-auto"
          >
            Edit
          </Link>
        </div>
      </div>
    </div>
  );
}
