import CartView from "@/components/cart-view";

export default function CartPage() {
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
      <CartView />
    </div>
  );
}
