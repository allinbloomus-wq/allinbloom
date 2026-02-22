import type { Metadata } from "next";
import CartView from "@/components/cart-view";
import { getStoreSettings } from "@/lib/data/settings";
import { cancelCheckoutOrder, countOrdersByEmail } from "@/lib/data/orders";
import { getAuthSession } from "@/lib/auth-session";

export const metadata: Metadata = {
  title: "Cart",
  robots: {
    index: false,
    follow: false,
  },
};

type CartSearchParams = Promise<{
  checkoutCanceled?: string | string[];
  orderId?: string | string[];
  cancelToken?: string | string[];
}>;

const pickFirst = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default async function CartPage({
  searchParams,
}: {
  searchParams: CartSearchParams;
}) {
  const params = await searchParams;
  const { user } = await getAuthSession();
  const email = user?.email || null;
  const checkoutCanceledParam = pickFirst(params.checkoutCanceled);
  const canceledOrderId = pickFirst(params.orderId);
  const canceledCheckoutToken = pickFirst(params.cancelToken);
  const canceledCheckoutStatus =
    checkoutCanceledParam === "1" && canceledOrderId
      ? await cancelCheckoutOrder(canceledOrderId, canceledCheckoutToken)
      : null;

  const settings = await getStoreSettings();
  const orderCount = email ? await countOrdersByEmail(email) : 0;
  const isFirstOrderEligible = Boolean(email && orderCount === 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.32em] text-stone-500">
          Cart
        </p>
        <h1 className="text-3xl font-semibold text-stone-900 sm:text-5xl">
          Your bouquet selections
        </h1>
      </div>
      <CartView
        isAuthenticated={Boolean(user)}
        userEmail={email}
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
        canceledCheckoutStatus={canceledCheckoutStatus}
      />
    </div>
  );
}
