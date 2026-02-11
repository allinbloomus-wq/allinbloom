import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth-session";
import SignOutButton from "@/components/sign-out-button";
import { getOrdersByEmail } from "@/lib/data/orders";
import { formatDateTime, formatMoney, formatOrderStatus } from "@/lib/format";
import { getCurrentUser } from "@/lib/data/users";

export const metadata: Metadata = {
  title: "Account",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AccountPage() {
  const { user } = await requireAuth();
  if (!user) {
    redirect("/auth");
  }

  const [orders, currentUser] = await Promise.all([
    getOrdersByEmail(user.email),
    getCurrentUser(),
  ]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <p className="text-xs uppercase tracking-[0.32em] text-stone-500">
          Account
        </p>
        <h1 className="text-4xl font-semibold text-stone-900 sm:text-5xl">
          Welcome back
        </h1>
      </div>
      <div className="glass rounded-[28px] border border-white/80 p-6 text-sm text-stone-600">
        <p>Name: {currentUser?.name || user.name || "-"}</p>
        <p>Email: {currentUser?.email || user.email}</p>
        {currentUser?.phone ? <p>Phone: {currentUser.phone}</p> : null}
        {user.role === "ADMIN" ? (
          <p>Role: {user.role}</p>
        ) : null}
      </div>
      <div className="glass rounded-[28px] border border-white/80 p-6 text-sm text-stone-600">
        <h2 className="text-lg font-semibold text-stone-900">
          Order history
        </h2>
        <div className="mt-4 space-y-3">
          {orders.length ? (
            orders.map((order) => (
              <div
                key={order.id}
                className="rounded-2xl border border-white/80 bg-white/70 p-4"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
                  Order {order.id.slice(0, 8)} -{" "}
                  {formatOrderStatus(order.status)}
                </p>
                <p className="text-sm font-semibold text-stone-900">
                  {formatMoney(order.totalCents)}
                </p>
                <p className="text-xs text-stone-500">
                  {formatDateTime(order.createdAt)}
                </p>
                <div className="mt-2 space-y-1 text-xs text-stone-600">
                  {order.items.map((item) => (
                    <div key={item.id}>
                      {item.quantity} x {item.name}
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p>No orders yet.</p>
          )}
        </div>
      </div>
      {user.role === "ADMIN" ? (
        <div className="glass rounded-[28px] border border-white/80 p-6 text-sm text-stone-600">
          <p>You have admin access.</p>
          <a
            href="/admin"
            className="mt-3 inline-block rounded-full border border-stone-300 bg-white/80 px-4 py-2 text-xs uppercase tracking-[0.3em] text-stone-600"
          >
            Open admin panel
          </a>
        </div>
      ) : null}
      <div className="max-w-xs">
        <SignOutButton />
      </div>
    </div>
  );
}
