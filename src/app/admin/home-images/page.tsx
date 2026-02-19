import Link from "next/link";
import { getStoreSettings } from "@/lib/data/settings";
import { updateHomeImages } from "@/app/admin/home-images/actions";
import AdminHomeImagesForm from "@/components/admin-home-images-form";

export default async function AdminHomeImagesPage() {
  const settings = await getStoreSettings();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-stone-500">
            Homepage images
          </p>
          <h1 className="text-2xl font-semibold text-stone-900 sm:text-3xl">
            Manage homepage gallery
          </h1>
        </div>
        <Link
          href="/admin"
          className="inline-flex h-11 w-full items-center justify-center rounded-full border border-stone-300 bg-white/80 px-4 text-center text-xs uppercase tracking-[0.3em] text-stone-600 sm:w-auto"
        >
          Back to admin
        </Link>
      </div>

      <AdminHomeImagesForm settings={settings} action={updateHomeImages} />
    </div>
  );
}
