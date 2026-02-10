import type { Metadata } from "next";
import AdminSidebar from "@/components/admin-sidebar";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 pb-24 pt-10 sm:px-6 lg:flex-row lg:px-8">
      <AdminSidebar />
      <div className="flex-1">{children}</div>
    </div>
  );
}
