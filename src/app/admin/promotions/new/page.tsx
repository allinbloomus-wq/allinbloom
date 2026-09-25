import { AdminPageHeader } from "@/components/admin-ui";
import AdminPromoForm from "@/components/admin-promo-form";
import { createPromoSlide } from "@/app/admin/promotions/actions";

export default function NewPromoSlidePage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="New slide"
        back={{ href: "/admin/promotions", label: "Promotions" }}
      />
      <AdminPromoForm action={createPromoSlide} />
    </div>
  );
}
