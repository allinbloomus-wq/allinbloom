import { AdminPageHeader } from "@/components/admin-ui";
import AdminReviewForm from "@/components/admin-review-form";
import { createAdminReview } from "@/app/admin/reviews/actions";

export default function NewAdminReviewPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="New review"
        back={{ href: "/admin/reviews", label: "Reviews" }}
      />
      <AdminReviewForm action={createAdminReview} />
    </div>
  );
}
