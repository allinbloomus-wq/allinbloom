import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import SignOutButton from "@/components/sign-out-button";
import { getOrdersByEmail } from "@/lib/data/orders";
import { formatDateTime, formatMoney } from "@/lib/format";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth");
  }

  const email = session.user.email;
  const orders = email ? await getOrdersByEmail(email) : [];

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
        <p>Name: {session.user.name || "—"}</p>
        <p>Email: {session.user.email}</p>
        {session.user.role === "ADMIN" ? (
          <p>Role: {session.user.role}</p>
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
                  Order {order.id.slice(0, 8)} - {order.status}
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
      {session.user.role === "ADMIN" ? (
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
