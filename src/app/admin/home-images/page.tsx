import { getStoreSettings } from "@/lib/data/settings";
import { updateHomeImages } from "@/app/admin/home-images/actions";
import AdminHomeImagesForm from "@/components/admin-home-images-form";
import { AdminPageHeader } from "@/components/admin-ui";

export default async function AdminHomeImagesPage() {
  const settings = await getStoreSettings();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Homepage images"
        description="Hero image and category tiles on the homepage and catalog."
      />
      <AdminHomeImagesForm settings={settings} action={updateHomeImages} />
    </div>
  );
}
