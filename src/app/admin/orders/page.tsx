import Link from "next/link";
import { getAdminOrdersByWeek } from "@/lib/data/orders";
import {
  addWeeksToWeekStartKey,
  getCurrentWeekStartKey,
} from "@/lib/admin-orders";
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
      <div>
        <p className="text-xs uppercase tracking-[0.32em] text-stone-500">
          Admin studio
        </p>
        <h1 className="text-2xl font-semibold text-stone-900 sm:text-3xl">
          Customer orders
        </h1>
      </div>
      <div className="inline-flex rounded-full border border-stone-200 bg-white/80 p-1">
        <Link
          href="/admin/orders?tab=active"
          prefetch={false}
          className={`inline-flex h-10 items-center justify-center rounded-full px-5 text-xs uppercase tracking-[0.28em] transition ${
            activeTab === "active"
              ? "bg-stone-900 text-white"
              : "text-stone-600 hover:bg-stone-100"
          }`}
        >
          Active orders
        </Link>
        <Link
          href="/admin/orders?tab=deleted"
          prefetch={false}
          className={`inline-flex h-10 items-center justify-center rounded-full px-5 text-xs uppercase tracking-[0.28em] transition ${
            activeTab === "deleted"
              ? "bg-stone-900 text-white"
              : "text-stone-600 hover:bg-stone-100"
          }`}
        >
          Deleted orders
        </Link>
      </div>
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-900">
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
