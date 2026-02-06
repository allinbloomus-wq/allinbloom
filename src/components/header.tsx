import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import CartBadge from "@/components/cart-badge";

export default async function Header() {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <header className="sticky top-0 z-30 border-b border-white/60 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="text-lg font-semibold text-[color:var(--brand)]"
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
                <Link href="/admin" className="hover:text-stone-700">
                  Admin
                </Link>
              ) : null}
            </nav>
          </div>
        <div className="flex items-center gap-3">
          <Link
            href={session ? "/account" : "/auth"}
            className="rounded-full border border-stone-200 bg-white/80 px-4 py-2 text-xs uppercase tracking-[0.3em] text-stone-600"
          >
            {session ? "Account" : "Sign in"}
          </Link>
          <CartBadge />
        </div>
        </div>
        <nav className="mt-3 flex items-center gap-4 text-xs uppercase tracking-[0.28em] text-stone-500 md:hidden">
          <Link href="/catalog" className="hover:text-stone-700">
            Catalog
          </Link>
          <Link href="/contact" className="hover:text-stone-700">
            Contact
          </Link>
          {isAdmin ? (
            <Link href="/admin" className="hover:text-stone-700">
              Admin
            </Link>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
