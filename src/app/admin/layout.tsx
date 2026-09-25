import type { Metadata } from "next";
import AdminSidebar from "@/components/admin-sidebar";
import Header from "@/components/header";
import { requireAdmin } from "@/lib/auth-session";

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
    <div className="min-h-screen bg-stone-50">
      <Header />
      <main className="admin-shell mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-24 pt-4 sm:px-6 sm:pt-6 lg:flex-row lg:gap-8 lg:items-start lg:px-8">
        <AdminSidebar />
        <div className="min-w-0 flex-1 tabular-nums">{children}</div>
      </main>
    </div>
  );
}
