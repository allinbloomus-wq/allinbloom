"use client";

import { useId, useState } from "react";
import FormError from "@/components/form-error";
import ImageWithFallback from "@/components/image-with-fallback";
import ReviewStars from "@/components/review-stars";
import { clientFetch } from "@/lib/api-client";
import { inputClass, labelClass, textareaClass } from "@/lib/ui-classes";

type ReviewFormState = {
  name: string;
  email: string;
  text: string;
  rating: number;
  image: string;
};

const REVIEW_TEXT_MAX_LENGTH = 1024;
const REVIEW_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const REVIEW_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const initialState: ReviewFormState = {
  name: "",
  email: "",
  text: "",
  rating: 5,
  image: "",
};

export default function ReviewForm() {
  const fileInputId = useId();
  const [formState, setFormState] = useState<ReviewFormState>(initialState);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const updateField = <T extends keyof ReviewFormState>(
    key: T,
    value: ReviewFormState[T]
  ) => {
    setFormState((current) => ({ ...current, [key]: value }));
  };
  const textLength = formState.text.length;

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploadError(null);
    if (!REVIEW_IMAGE_TYPES.includes(file.type)) {
      setUploadError("Please choose a JPG, PNG or WebP photo.");
      return;
    }
    if (file.size > REVIEW_IMAGE_MAX_BYTES) {
      setUploadError("This photo is larger than 5 MB. Please choose a smaller one.");
      return;
    }

    setUploading(true);
    const payload = new FormData();
    payload.append("file", file);

    try {
      const response = await clientFetch("/api/upload/review", {
        method: "POST",
        body: payload,
      });
      const data = (await response.json().catch(() => null)) as
        | { url?: string; detail?: string }
        | null;

      if (!response.ok || !data?.url) {
        setUploadError(
          data?.detail || "We couldn't upload this photo. Please try another one."
        );
      } else {
        updateField("image", data.url);
      }
    } catch {
      setUploadError("We couldn't upload this photo. Check your connection and try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (uploading) return;

    setSubmitStatus("sending");
    const response = await clientFetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formState.name.trim(),
        email: formState.email.trim(),
        text: formState.text.trim().slice(0, REVIEW_TEXT_MAX_LENGTH),
        rating: formState.rating,
        image: formState.image.trim() || null,
      }),
    }).catch(() => null);

    if (!response?.ok) {
      setSubmitStatus("error");
      return;
    }

    setSubmitStatus("sent");
    setFormState(initialState);
    setUploadError(null);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="glass max-w-full space-y-6 rounded-[30px] border border-white/85 p-5 shadow-[0_20px_45px_rgba(63,40,36,0.14)] sm:space-y-7 sm:p-8"
    >
      <h2 className="text-2xl font-semibold text-stone-900 sm:text-3xl">
        Tell us about your bouquet
      </h2>

      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="min-w-0 space-y-3">
          <span className={labelClass}>Photo (optional)</span>
          {formState.image ? (
            <div className="relative overflow-hidden rounded-2xl border border-stone-300 bg-white aspect-[4/3]">
              <ImageWithFallback
                src={formState.image}
                alt="Your review photo"
                width={800}
                height={600}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => updateField("image", "")}
                className="absolute right-3 top-3 inline-flex h-9 items-center rounded-full bg-white/90 px-4 text-sm font-medium text-stone-700 shadow-sm transition hover:bg-white"
              >
                Remove
              </button>
            </div>
          ) : (
            <label
              htmlFor={fileInputId}
              className={`flex aspect-[4/3] w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-stone-300 bg-white/70 px-6 text-center transition ${
                uploading
                  ? "cursor-wait opacity-70"
                  : "cursor-pointer hover:border-[color:var(--brand)] hover:bg-white"
              }`}
            >
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-8 w-8 text-[color:var(--brand)]"
              >
                <rect x="3" y="5" width="18" height="14" rx="3" />
                <circle cx="9" cy="10" r="1.6" />
                <path d="m21 16-5-5-8 8" />
              </svg>
              <span className="text-sm font-medium text-stone-800">
                {uploading ? "Uploading photo…" : "Add a photo of your bouquet"}
              </span>
              <span className="text-xs text-stone-500">JPG, PNG or WebP, up to 5 MB</span>
            </label>
          )}
          <input
            id={fileInputId}
            type="file"
            accept={REVIEW_IMAGE_TYPES.join(",")}
            onChange={handleFileChange}
            disabled={uploading}
            className="sr-only"
          />
          {uploadError ? <FormError>{uploadError}</FormError> : null}
        </div>

        <div className="min-w-0 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              Name
              <input
                name="name"
                required
                autoComplete="name"
                value={formState.name}
                onChange={(event) => updateField("name", event.target.value)}
                className={inputClass()}
              />
            </label>
            <label className={labelClass}>
              Email
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                value={formState.email}
                onChange={(event) => updateField("email", event.target.value)}
                className={inputClass()}
              />
            </label>
          </div>
          <div className="space-y-2">
            <span className={labelClass}>Your rating</span>
            <ReviewStars
              value={formState.rating}
              onChange={(value) => updateField("rating", value)}
              size="lg"
            />
          </div>
          <label className={labelClass}>
            Review
            <textarea
              name="text"
              required
              rows={6}
              value={formState.text}
              maxLength={REVIEW_TEXT_MAX_LENGTH}
              onChange={(event) =>
                updateField("text", event.target.value.slice(0, REVIEW_TEXT_MAX_LENGTH))
              }
              className={`${textareaClass()} min-h-[9.5rem]`}
            />
          </label>
          <p className="text-right text-xs tabular-nums text-stone-500">
            {textLength} / {REVIEW_TEXT_MAX_LENGTH}
          </p>
        </div>
      </div>

      {submitStatus === "error" ? (
        <FormError>We couldn&apos;t send your review. Please try again in a moment.</FormError>
      ) : null}

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={submitStatus === "sending" || uploading}
          className="inline-flex h-11 w-full items-center justify-center rounded-full bg-[color:var(--brand)] px-6 text-xs uppercase tracking-[0.3em] text-white transition hover:bg-[color:var(--brand-dark)] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {submitStatus === "sending" ? "Sending..." : "Submit review"}
        </button>
        {submitStatus === "sent" ? (
          <p role="status" className="text-sm text-emerald-700">
            Thank you! Your review was sent.
          </p>
        ) : null}
      </div>
    </form>
  );
}
