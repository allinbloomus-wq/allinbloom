import Link from "next/link";
import { getAdminOrdersByWeek } from "@/lib/data/orders";
import {
  addWeeksToWeekStartKey,
  getCurrentWeekStartKey,
} from "@/lib/admin-orders";
import { AdminPageHeader } from "@/components/admin-ui";
import AdminOrdersList from "@/components/admin-orders-list";

type OrdersSearchParams = {
  tab?: string;
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<OrdersSearchParams>;
}) {
  const params = await searchParams;
  const activeTab = params.tab === "deleted" ? "deleted" : "active";
  const latestWeekStartKey = getCurrentWeekStartKey(new Date());

  const latestWeekOrders = await getAdminOrdersByWeek(
    latestWeekStartKey,
    activeTab
  );

  const initialWeeks = [
    { weekStartKey: latestWeekStartKey, orders: latestWeekOrders },
  ];
  const initialOldestWeekStartKey = addWeeksToWeekStartKey(
    latestWeekStartKey,
    -1
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Orders" description="Orders grouped by week, newest first." />
      <div className="inline-flex rounded-full border border-stone-200 bg-white p-1 shadow-sm">
        <Link
          href="/admin/orders?tab=active"
          prefetch={false}
          className={`inline-flex h-8 items-center justify-center whitespace-nowrap rounded-full px-3 text-sm font-medium transition sm:px-4 ${
            activeTab === "active"
              ? "bg-[color:var(--brand)] text-white"
              : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
          }`}
        >
          Active orders
        </Link>
        <Link
          href="/admin/orders?tab=deleted"
          prefetch={false}
          className={`inline-flex h-8 items-center justify-center whitespace-nowrap rounded-full px-3 text-sm font-medium transition sm:px-4 ${
            activeTab === "deleted"
              ? "bg-[color:var(--brand)] text-white"
              : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
          }`}
        >
          Deleted orders
        </Link>
      </div>
      <div className="space-y-4">
        <h2 className="sr-only">
          {activeTab === "deleted" ? "Deleted orders" : "Active orders"}
        </h2>
        <AdminOrdersList
          key={activeTab}
          initialWeeks={initialWeeks}
          initialOldestWeekStartKey={initialOldestWeekStartKey}
          mode={activeTab}
        />
      </div>
    </div>
  );
}
