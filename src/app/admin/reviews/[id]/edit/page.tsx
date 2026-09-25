import { AdminPageHeader } from "@/components/admin-ui";
import { notFound } from "next/navigation";
import { getAdminReviewById } from "@/lib/data/reviews";
import AdminReviewForm from "@/components/admin-review-form";
import { updateAdminReview } from "@/app/admin/reviews/actions";

export default async function EditAdminReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const review = await getAdminReviewById(id);

  if (!review) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={review.name} description="Edit review"
        back={{ href: "/admin/reviews", label: "Reviews" }}
      />
      <AdminReviewForm action={updateAdminReview} review={review} />
    </div>
  );
}
