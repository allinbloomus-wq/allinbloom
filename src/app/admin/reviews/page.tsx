import { getAdminReviews } from "@/lib/data/reviews";
import AdminReviewsList from "@/components/admin-reviews-list";
import { AdminPageHeader, AdminPanel } from "@/components/admin-ui";

export default async function AdminReviewsPage() {
  const reviews = await getAdminReviews();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Reviews"
        description="Approve, edit and publish customer reviews."
        action={{ href: "/admin/reviews/new", label: "New review" }}
      />
      <AdminPanel>
        <AdminReviewsList initialReviews={reviews} />
      </AdminPanel>
    </div>
  );
}
