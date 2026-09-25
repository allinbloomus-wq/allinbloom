import { getAdminPromoSlides } from "@/lib/data/promotions";
import AdminPromoRow from "@/components/admin-promo-row";
import { AdminEmptyState, AdminPageHeader, AdminPanel } from "@/components/admin-ui";

export default async function AdminPromotionsPage() {
  const slides = await getAdminPromoSlides();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Promotions"
        description="Slides shown in the homepage promotions gallery."
        action={{ href: "/admin/promotions/new", label: "New slide" }}
      />
      <AdminPanel>
        <div className="grid gap-3">
          {slides.length ? (
            slides.map((slide) => <AdminPromoRow key={slide.id} slide={slide} />)
          ) : (
            <AdminEmptyState
              message="No slides yet. Add a promotion to feature it on the homepage."
              action={{ href: "/admin/promotions/new", label: "New slide" }}
            />
          )}
        </div>
      </AdminPanel>
    </div>
  );
}
