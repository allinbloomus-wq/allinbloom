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
    getAdminOrdersByDay(todayKey),
    getAdminOrdersByDay(yesterdayKey),
  ]);

  const initialDays = [
    { dayKey: todayKey, orders: todayOrders },
    { dayKey: yesterdayKey, orders: yesterdayOrders },
  ];
  const initialOldestDayKey = addDaysToDayKey(yesterdayKey, -1);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.32em] text-stone-500">
          Admin studio
        </p>
        <h1 className="text-3xl font-semibold text-stone-900">
          Customer orders
        </h1>
      </div>
      <AdminOrdersList
        initialDays={initialDays}
        initialOldestDayKey={initialOldestDayKey}
      />
    </div>
  );
}
