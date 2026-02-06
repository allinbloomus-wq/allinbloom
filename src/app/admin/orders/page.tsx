import { getAdminOrders } from "@/lib/data/orders";
import AdminOrderRow from "@/components/admin-order-row";

export default async function AdminOrdersPage() {
  const orders = await getAdminOrders();

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
      <div className="grid gap-4">
        {orders.length ? (
          orders.map((order) => (
            <AdminOrderRow key={order.id} order={order} />
          ))
        ) : (
          <div className="glass rounded-[28px] border border-white/80 p-8 text-center text-sm text-stone-600">
            No orders yet.
          </div>
        )}
      </div>
    </div>
  );
}
