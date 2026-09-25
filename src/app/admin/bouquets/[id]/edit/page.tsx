import { notFound } from "next/navigation";
import { getBouquetById } from "@/lib/data/bouquets";
import AdminBouquetForm from "@/components/admin-bouquet-form";
import { updateBouquet } from "@/app/admin/actions";
import { AdminPageHeader } from "@/components/admin-ui";

export default async function EditBouquetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bouquet = await getBouquetById(id);

  if (!bouquet) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={bouquet.name}
        description="Edit bouquet"
        back={{ href: "/admin", label: "Bouquets" }}
      />
      <AdminBouquetForm action={updateBouquet} bouquet={bouquet} />
    </div>
  );
}
