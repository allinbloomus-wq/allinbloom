import { AdminPageHeader } from "@/components/admin-ui";
import { notFound } from "next/navigation";
import type { CatalogType } from "@/lib/api-types";
import { getBouquetById } from "@/lib/data/bouquets";
import { createCatalogProduct, updateCatalogProduct } from "@/app/admin/actions";
import AdminCatalogProductForm from "@/components/admin-catalog-product-form";

type ManagedCatalogType = Extract<CatalogType, "BALOONS" | "GIFTS" | "EVENT_SPACE">;

type AdminCatalogProductEditorPageProps = {
  catalogType: ManagedCatalogType;
  label: string;
  basePath: string;
  id?: string;
};

export default async function AdminCatalogProductEditorPage({
  catalogType,
  label,
  basePath,
  id,
}: AdminCatalogProductEditorPageProps) {
  const product = id ? await getBouquetById(id, catalogType) : undefined;
  if (id && !product) notFound();
  const isEditing = Boolean(product);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={isEditing ? product?.name : `New ${label}`} description={isEditing ? `Edit ${label}` : undefined}
        back={{ href: basePath, label: `${label.charAt(0).toUpperCase()}${label.slice(1)}s` }}
      />
      <AdminCatalogProductForm
        key={product?.id || `new-${catalogType}`}
        catalogType={catalogType}
        product={product || undefined}
        action={isEditing ? updateCatalogProduct : createCatalogProduct}
      />
    </div>
  );
}
