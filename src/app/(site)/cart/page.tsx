import { getServerSession } from "next-auth";
import CartView from "@/components/cart-view";
import { authOptions } from "@/lib/auth";
import { getStoreSettings } from "@/lib/data/settings";
import { countOrdersByEmail } from "@/lib/data/orders";

export default async function CartPage() {
  const session = await getServerSession(authOptions);
  const settings = await getStoreSettings();
  const email = session?.user?.email || null;
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
        isAuthenticated={Boolean(session?.user)}
        globalDiscount={
          settings.globalDiscountPercent > 0
            ? {
                percent: settings.globalDiscountPercent,
                note: settings.globalDiscountNote || "Скидка",
              }
            : null
        }
        categoryDiscount={
          settings.categoryDiscountPercent > 0
            ? {
                percent: settings.categoryDiscountPercent,
                note: settings.categoryDiscountNote || "Скидка",
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
                  "Скидка 10% на первый заказ",
              }
            : null
        }
      />
    </div>
  );
}
