import { AdminPageHeader } from "@/components/admin-ui";
import { notFound } from "next/navigation";
import { getPromoSlideById } from "@/lib/data/promotions";
import AdminPromoForm from "@/components/admin-promo-form";
import { updatePromoSlide } from "@/app/admin/promotions/actions";

export default async function EditPromoSlidePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const slide = await getPromoSlideById(id);

  if (!slide) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={slide.title} description="Edit slide"
        back={{ href: "/admin/promotions", label: "Promotions" }}
      />
      <AdminPromoForm action={updatePromoSlide} slide={slide} />
    </div>
  );
}
