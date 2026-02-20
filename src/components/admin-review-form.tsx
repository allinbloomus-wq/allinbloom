import type { AdminReview } from "@/lib/api-types";
import AdminImageUpload from "@/components/admin-image-upload";

type AdminReviewFormProps = {
  review?: AdminReview;
  action: (formData: FormData) => Promise<void>;
};

const ADMIN_TIMEZONE = "America/Chicago";

const fieldClass =
  "h-11 w-full min-w-0 max-w-full rounded-2xl border border-stone-200 bg-white/80 px-4 py-0 text-sm text-stone-800 outline-none focus:border-stone-400";

const textareaClass =
  "w-full min-w-0 rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-sm text-stone-800 outline-none focus:border-stone-400";

const dateTimeFieldWrapClass =
  "relative h-11 w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-stone-200 bg-white/80 transition-colors focus-within:border-stone-400";

const dateTimeFieldClass =
  "admin-datetime-input block h-full w-full min-w-0 max-w-full border-0 bg-transparent py-0 pl-4 pr-10 text-left text-sm text-stone-800 outline-none [inline-size:100%] [min-inline-size:0] [max-inline-size:100%]";

const REVIEW_TEXT_MAX_LENGTH = 1024;

function formatDateTimeLocal(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: ADMIN_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(date);
  const values: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  }

  if (
    !values.year ||
    !values.month ||
    !values.day ||
    !values.hour ||
    !values.minute
  ) {
    return "";
  }

  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
}

export default function AdminReviewForm({ review, action }: AdminReviewFormProps) {
  const defaultCreatedAt = formatDateTimeLocal(review?.createdAt);

  return (
    <form
      action={action}
      className="glass relative z-10 max-w-full space-y-6 rounded-[28px] border border-white/80 p-4 sm:p-6"
    >
      {review ? <input type="hidden" name="id" value={review.id} /> : null}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="min-w-0 space-y-4">
          <label className="flex min-w-0 flex-col gap-2 text-sm text-stone-700">
            Name
            <input
              name="name"
              defaultValue={review?.name || ""}
              required
              className={fieldClass}
            />
          </label>
          <label className="flex min-w-0 flex-col gap-2 text-sm text-stone-700">
            Email
            <input
              name="email"
              type="email"
              defaultValue={review?.email || ""}
              required
              className={fieldClass}
            />
          </label>
          <label className="flex min-w-0 flex-col gap-2 text-sm text-stone-700">
            Rating
            <input
              name="rating"
              type="number"
              min="1"
              max="5"
              defaultValue={review?.rating ?? 5}
              required
              className={fieldClass}
            />
          </label>
          <label className="flex min-w-0 max-w-full flex-col gap-2 text-sm text-stone-700">
            Created at
            <div className={dateTimeFieldWrapClass}>
              <input
                name="createdAt"
                type="datetime-local"
                defaultValue={defaultCreatedAt}
                className={dateTimeFieldClass}
                lang="en-CA"
              />
            </div>
          </label>
          <label className="flex min-w-0 flex-col gap-2 text-sm text-stone-700">
            Review text
            <textarea
              name="text"
              rows={6}
              defaultValue={review?.text || ""}
              required
              maxLength={REVIEW_TEXT_MAX_LENGTH}
              className={textareaClass}
            />
          </label>
          <p className="text-xs text-stone-500">
            Maximum review length: 1024 characters.
          </p>
          <div className="grid gap-2">
            <label className="flex items-center gap-2 text-sm text-stone-700">
              <input
                type="checkbox"
                name="isActive"
                defaultChecked={review ? review.isActive : true}
              />
              Visible in public reviews
            </label>
            <label className="flex items-center gap-2 text-sm text-stone-700">
              <input
                type="checkbox"
                name="isRead"
                defaultChecked={review ? review.isRead : true}
              />
              Mark as read
            </label>
          </div>
        </div>
        <div className="min-w-0 space-y-4">
          <AdminImageUpload
            defaultValue={review?.image || ""}
            required={false}
            urlLabel="Image URL (optional)"
            previewAlt="Review image preview"
            recommendedSize="1200x900"
            previewClassName="w-full max-w-[17rem] aspect-[4/3]"
          />
          <p className="text-xs text-stone-500">
            Email is only visible in admin. Image is optional for customer cards.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          className="inline-flex h-11 w-full items-center justify-center rounded-full bg-[color:var(--brand)] px-6 text-xs uppercase tracking-[0.3em] text-white transition hover:bg-[color:var(--brand-dark)] sm:w-auto"
        >
          Save review
        </button>
      </div>
    </form>
  );
}
