import Link from "next/link";
import { getAuthSession } from "@/lib/auth-session";
import CartBadge from "@/components/cart-badge";
import AdminOrdersBadge from "@/components/admin-orders-badge";

export default async function Header() {
  const { user } = await getAuthSession();
  const isAdmin = user?.role === "ADMIN";
  const isSignedIn = Boolean(user);

  return (
    <header className="site-header sticky top-0 z-50 border-b border-white/60 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto w-full max-w-6xl px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-4 sm:gap-6">
            <Link
              href="/"
              className="truncate font-[family-name:var(--font-serif)] text-lg font-semibold tracking-[-0.02em] text-[color:var(--brand)] sm:text-xl"
            >
              All in Bloom
            </Link>
            <nav className="hidden items-center gap-4 text-xs uppercase tracking-[0.28em] text-stone-500 md:flex">
              <Link href="/catalog" className="hover:text-stone-700">
                Catalog
              </Link>
              <Link href="/contact" className="hover:text-stone-700">
                Contact
              </Link>
              {isAdmin ? (
                <Link
                  href="/admin"
                  className="relative inline-flex items-center hover:text-stone-700"
                >
                  Admin
                  <AdminOrdersBadge />
                </Link>
              ) : null}
            </nav>
          </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href={isSignedIn ? "/account" : "/auth"}
            className="rounded-full border border-stone-200 bg-white/80 px-3 py-2 text-[11px] uppercase tracking-[0.22em] text-stone-600 sm:px-4 sm:text-xs sm:tracking-[0.3em]"
          >
            {isSignedIn ? "Account" : "Sign in"}
          </Link>
          <CartBadge />
        </div>
        </div>
        <nav className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] uppercase tracking-[0.22em] text-stone-500 sm:text-xs sm:tracking-[0.28em] md:hidden">
          <Link href="/catalog" className="hover:text-stone-700">
            Catalog
          </Link>
          <Link href="/contact" className="hover:text-stone-700">
            Contact
          </Link>
          {isAdmin ? (
            <Link
              href="/admin"
              className="relative inline-flex items-center hover:text-stone-700"
            >
              Admin
              <AdminOrdersBadge />
            </Link>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
