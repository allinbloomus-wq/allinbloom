import { AdminPageHeader, AdminPanel } from "@/components/admin-ui";
import type { CatalogType } from "@/lib/api-types";
import { getAdminBouquets } from "@/lib/data/bouquets";
import AdminCatalogProductsPanel from "@/components/admin-catalog-products-panel";

type ManagedCatalogType = Extract<CatalogType, "BALOONS" | "GIFTS" | "EVENT_SPACE">;

type AdminCatalogManagementPageProps = {
  catalogType: ManagedCatalogType;
  title: string;
  label: string;
  basePath: string;
};

export default async function AdminCatalogManagementPage({
  catalogType,
  title,
  label,
  basePath,
}: AdminCatalogManagementPageProps) {
  const products = await getAdminBouquets(catalogType);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={title}
        action={{ href: `${basePath}/new`, label: `New ${label.slice(0, -1)}` }}
      />
      <AdminPanel>
        <AdminCatalogProductsPanel
          products={products}
          catalogType={catalogType}
          editPath={basePath}
          label={label}
        />
      </AdminPanel>
    </div>
  );
}
