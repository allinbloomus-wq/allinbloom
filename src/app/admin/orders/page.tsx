import { getAdminOrdersByDay } from "@/lib/data/orders";
import {
  addDaysToDayKey,
  getDayKey,
} from "@/lib/admin-orders";
import AdminOrdersList from "@/components/admin-orders-list";

export default async function AdminOrdersPage() {
  const todayKey = getDayKey(new Date());
  const yesterdayKey = addDaysToDayKey(todayKey, -1);

  const [todayOrders, yesterdayOrders] = await Promise.all([
    getAdminOrdersByDay(todayKey, "active"),
    getAdminOrdersByDay(yesterdayKey, "active"),
  ]);

  const [todayDeletedOrders, yesterdayDeletedOrders] = await Promise.all([
    getAdminOrdersByDay(todayKey, "deleted"),
    getAdminOrdersByDay(yesterdayKey, "deleted"),
  ]);

  const initialDays = [
    { dayKey: todayKey, orders: todayOrders },
    { dayKey: yesterdayKey, orders: yesterdayOrders },
  ];
  const initialDeletedDays = [
    { dayKey: todayKey, orders: todayDeletedOrders },
    { dayKey: yesterdayKey, orders: yesterdayDeletedOrders },
  ];
  const initialOldestDayKey = addDaysToDayKey(yesterdayKey, -1);

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
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-900">Active orders</h2>
        <AdminOrdersList
          initialDays={initialDays}
          initialOldestDayKey={initialOldestDayKey}
          mode="active"
        />
      </div>
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-900">Deleted orders</h2>
        <AdminOrdersList
          initialDays={initialDeletedDays}
          initialOldestDayKey={initialOldestDayKey}
          mode="deleted"
        />
      </div>
    </div>
  );
}
