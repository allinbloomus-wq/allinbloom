"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { AdminReview } from "@/lib/api-types";
import ImageWithFallback from "@/components/image-with-fallback";
import ReviewStars from "@/components/review-stars";
import { formatDateTime } from "@/lib/format";
import { ADMIN_REVIEWS_BADGE_EVENT } from "@/lib/admin-reviews";
import { clientFetch } from "@/lib/api-client";

type AdminReviewRowProps = {
  review: AdminReview;
  onRemoved: (reviewId: string) => void;
};

const badgeClass =
  "inline-flex h-8 items-center justify-center rounded-full border px-3 text-[10px] uppercase tracking-[0.24em] whitespace-nowrap";

export default function AdminReviewRow({ review, onRemoved }: AdminReviewRowProps) {
  const [isRead, setIsRead] = useState(review.isRead);
  const [isActive, setIsActive] = useState(review.isActive);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const isBusy = isLoading || isDeleting;

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

  const toggleRead = async () => {
    if (isBusy) return;
    setIsLoading(true);
    try {
      const response = await clientFetch(
        `/api/admin/reviews/${review.id}/toggle-read`,
        {
          method: "PATCH",
        },
        true
      );
      if (!response.ok) {
        return;
      }
      const data = (await response.json()) as { isRead?: boolean };
      setIsRead(Boolean(data?.isRead));
      window.dispatchEvent(new Event(ADMIN_REVIEWS_BADGE_EVENT));
    } finally {
      setIsLoading(false);
    }
  };

  const toggleActive = async () => {
    if (isBusy) return;
    setIsLoading(true);
    try {
      const response = await clientFetch(
        `/api/admin/reviews/${review.id}/toggle-active`,
        {
          method: "PATCH",
        },
        true
      );
      if (!response.ok) {
        return;
      }
      const data = (await response.json()) as { isActive?: boolean };
      setIsActive(Boolean(data?.isActive));
    } finally {
      setIsLoading(false);
    }
  };

  const deleteReview = async () => {
    if (isBusy) return;
    setIsMenuOpen(false);

    const confirmed = window.confirm(
      "Delete this review permanently? This action cannot be undone."
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const response = await clientFetch(
        `/api/admin/reviews/${review.id}`,
        { method: "DELETE" },
        true
      );
      if (!response.ok) {
        return;
      }
      onRemoved(review.id);
      window.dispatchEvent(new Event(ADMIN_REVIEWS_BADGE_EVENT));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="relative rounded-[24px] border border-white/80 bg-white/70 p-4 shadow-sm">
      <div ref={menuRef} className="absolute right-4 top-4 z-20">
        <button
          type="button"
          aria-label="Review actions"
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((current) => !current)}
          disabled={isBusy}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 bg-white/90 transition hover:border-stone-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="inline-flex items-center gap-0.5">
            <span className="h-1 w-1 rounded-full bg-stone-600" />
            <span className="h-1 w-1 rounded-full bg-stone-600" />
            <span className="h-1 w-1 rounded-full bg-stone-600" />
          </span>
        </button>
        {isMenuOpen ? (
          <div className="absolute right-0 top-10 min-w-[190px] rounded-2xl border border-stone-200 bg-white p-1.5 shadow-lg">
            <button
              type="button"
              onClick={deleteReview}
              disabled={isBusy}
              className="flex w-full items-center rounded-xl px-3 py-2 text-left text-xs uppercase tracking-[0.18em] text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDeleting ? "Deleting..." : "Delete Forever"}
            </button>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-4 pr-10">
        <div className="flex min-w-0 items-start gap-3">
          <div className="h-16 w-16 overflow-hidden rounded-2xl border border-white/80 bg-white">
            <ImageWithFallback
              src={review.image || ""}
              alt={`${review.name} review photo`}
              width={128}
              height={128}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-stone-900">{review.name}</p>
            <p className="break-all text-xs text-stone-500">{review.email}</p>
            <p className="text-xs text-stone-500">{formatDateTime(review.createdAt)}</p>
            <ReviewStars value={review.rating} size="sm" readOnly className="mt-1" />
          </div>
        </div>

        <p className="text-sm leading-relaxed text-stone-700">{review.text}</p>

        <div className="flex w-full flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={toggleRead}
            disabled={isBusy}
            className={`${badgeClass} transition ${
              isRead
                ? "border-emerald-200 bg-emerald-100 text-emerald-700"
                : "border-stone-200 bg-white/80 text-stone-600"
            } ${isBusy ? "cursor-not-allowed opacity-70" : ""}`}
          >
            {isRead ? "Read" : "Unread"}
          </button>
          <button
            type="button"
            onClick={toggleActive}
            disabled={isBusy}
            className={`${badgeClass} transition ${
              isActive
                ? "border-emerald-200 bg-emerald-100 text-emerald-700"
                : "border-stone-300 bg-stone-200 text-stone-700"
            } ${isBusy ? "cursor-not-allowed opacity-70" : ""}`}
          >
            {isActive ? "Visible" : "Hidden"}
          </button>
          <Link
            href={`/admin/reviews/${review.id}/edit`}
            className={`${badgeClass} border-stone-300 bg-white/80 text-stone-600 transition hover:border-stone-400`}
          >
            Edit
          </Link>
        </div>
      </div>
    </div>
  );
}
