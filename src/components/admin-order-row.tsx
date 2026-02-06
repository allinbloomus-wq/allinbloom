import type { Order, OrderItem } from "@prisma/client";
import Link from "next/link";
import { formatDateTime, formatMoney } from "@/lib/format";

type AdminOrderRowProps = {
  order: Order & { items: OrderItem[] };
};

export default function AdminOrderRow({ order }: AdminOrderRowProps) {
  return (
    <div className="rounded-[24px] border border-white/80 bg-white/70 p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
            Order {order.id.slice(0, 8)}
          </p>
          <p className="text-sm font-semibold text-stone-900">
            {formatMoney(order.totalCents)} - {order.status}
          </p>
          <p className="text-xs text-stone-500">
            {formatDateTime(order.createdAt)}
          </p>
          {order.email ? (
            <p className="text-xs text-stone-500">{order.email}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="rounded-full border border-stone-200 bg-white/80 px-4 py-2 text-xs uppercase tracking-[0.3em] text-stone-600">
            {order.items.length} items
          </div>
          <Link
            href={`/admin/orders/${order.id}`}
            className="rounded-full border border-stone-300 bg-white/80 px-4 py-2 text-xs uppercase tracking-[0.3em] text-stone-600"
          >
            Details
          </Link>
        </div>
      </div>
      <div className="mt-4 grid gap-2 text-sm text-stone-600">
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between">
            <span>
              {item.quantity} x {item.name}
            </span>
            <span>{formatMoney(item.priceCents)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
