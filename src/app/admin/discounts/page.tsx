import { getStoreSettings } from "@/lib/data/settings";
import { updateDiscountSettings } from "@/app/admin/discounts/actions";
import AdminDiscountsForm from "@/components/admin-discounts-form";
import { AdminPageHeader } from "@/components/admin-ui";

export default async function AdminDiscountsPage() {
  const settings = await getStoreSettings();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Discounts"
        description="Store-wide discount rules applied at checkout."
      />
      <AdminDiscountsForm settings={settings} action={updateDiscountSettings} />
    </div>
  );
}
