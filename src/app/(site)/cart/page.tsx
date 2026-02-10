import type { Metadata } from "next";
import CartView from "@/components/cart-view";
import { getStoreSettings } from "@/lib/data/settings";
import { countOrdersByEmail } from "@/lib/data/orders";
import { getAuthSession } from "@/lib/auth-session";

export const metadata: Metadata = {
  title: "Cart",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function CartPage() {
  const { user } = getAuthSession();
  const settings = await getStoreSettings();
  const email = user?.email || null;
  const orderCount = email ? await countOrdersByEmail(email) : 0;
  const isFirstOrderEligible = Boolean(email && orderCount === 0);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.32em] text-stone-500">
          Cart
        </p>
        <h1 className="text-4xl font-semibold text-stone-900 sm:text-5xl">
          Your bouquet selections
        </h1>
      </div>
      <CartView
        isAuthenticated={Boolean(user)}
        globalDiscount={
          settings.globalDiscountPercent > 0
            ? {
                percent: settings.globalDiscountPercent,
                note: settings.globalDiscountNote || "Discount",
              }
            : null
        }
        categoryDiscount={
          settings.categoryDiscountPercent > 0
            ? {
                percent: settings.categoryDiscountPercent,
                note: settings.categoryDiscountNote || "Discount",
                flowerType: settings.categoryFlowerType,
                style: settings.categoryStyle,
                mixed: settings.categoryMixed,
                color: settings.categoryColor,
                minPriceCents: settings.categoryMinPriceCents,
                maxPriceCents: settings.categoryMaxPriceCents,
              }
            : null
        }
        firstOrderDiscount={
          isFirstOrderEligible && settings.firstOrderDiscountPercent > 0
            ? {
                percent: settings.firstOrderDiscountPercent,
                note:
                  settings.firstOrderDiscountNote ||
                  "10% off your first order",
              }
            : null
        }
      />
    </div>
  );
}
