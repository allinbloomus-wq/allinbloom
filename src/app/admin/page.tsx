import { getAdminBouquets } from "@/lib/data/bouquets";
import AdminBouquetsPanel from "@/components/admin-bouquets-panel";
import { AdminPageHeader, AdminPanel } from "@/components/admin-ui";

export default async function AdminPage() {
  const bouquets = await getAdminBouquets();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Bouquets"
        description="Manage the bouquet catalog, prices and visibility."
        action={{ href: "/admin/bouquets/new", label: "New bouquet" }}
      />
      <AdminPanel>
        <AdminBouquetsPanel bouquets={bouquets} />
      </AdminPanel>
    </div>
  );
}
