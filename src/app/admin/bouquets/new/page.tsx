import { createBouquet } from "@/app/admin/actions";
import AdminBouquetForm from "@/components/admin-bouquet-form";
import { AdminPageHeader } from "@/components/admin-ui";

export default function NewBouquetPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader title="New bouquet" back={{ href: "/admin", label: "Bouquets" }} />
      <AdminBouquetForm action={createBouquet} />
    </div>
  );
}
