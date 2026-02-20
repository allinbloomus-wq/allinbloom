import type { AdminReview } from "@/lib/api-types";
import AdminImageUpload from "@/components/admin-image-upload";

type AdminReviewFormProps = {
  review?: AdminReview;
  action: (formData: FormData) => Promise<void>;
};

const fieldClass =
  "h-11 w-full min-w-0 rounded-2xl border border-stone-200 bg-white/80 px-4 py-0 text-sm text-stone-800 outline-none focus:border-stone-400";

const textareaClass =
  "w-full min-w-0 rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-sm text-stone-800 outline-none focus:border-stone-400";

export default function AdminReviewForm({ review, action }: AdminReviewFormProps) {
  return (
    <form
      action={action}
      className="glass relative z-10 max-w-full space-y-6 rounded-[28px] border border-white/80 p-4 sm:p-6"
    >
      {review ? <input type="hidden" name="id" value={review.id} /> : null}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <label className="flex flex-col gap-2 text-sm text-stone-700">
            Name
            <input
              name="name"
              defaultValue={review?.name || ""}
              required
              className={fieldClass}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-stone-700">
            Email
            <input
              name="email"
              type="email"
              defaultValue={review?.email || ""}
              required
              className={fieldClass}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-stone-700">
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
          <label className="flex flex-col gap-2 text-sm text-stone-700">
            Review text
            <textarea
              name="text"
              rows={6}
              defaultValue={review?.text || ""}
              required
              className={textareaClass}
            />
          </label>
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
        <div className="space-y-4">
          <AdminImageUpload
            defaultValue={review?.image || ""}
            required={false}
            urlLabel="Image URL (optional)"
            previewAlt="Review image preview"
            recommendedSize="800x800"
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
