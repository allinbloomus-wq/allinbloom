import Image from "next/image";
import type { Bouquet } from "@prisma/client";
import { formatLabel, formatMoney } from "@/lib/format";
import AddToCartControls from "@/components/add-to-cart-controls";

export default function BouquetCard({ bouquet }: { bouquet: Bouquet }) {
  return (
    <div className="glass flex h-full flex-col gap-4 rounded-[28px] border border-white/80 p-5">
      <div className="overflow-hidden rounded-[22px] border border-white/80 bg-white">
        <Image
          src={bouquet.image}
          alt={bouquet.name}
          width={420}
          height={520}
          className="h-60 w-full object-cover"
        />
      </div>
      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.24em] text-stone-500">
          <span>{formatLabel(bouquet.style)}</span>
          <span>{bouquet.isMixed ? "Mixed" : "Mono"}</span>
        </div>
        <h3 className="text-xl font-semibold text-stone-900">
          {bouquet.name}
        </h3>
        <p className="text-sm leading-relaxed text-stone-600">
          {bouquet.description}
        </p>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-lg font-semibold text-stone-900">
          {formatMoney(bouquet.priceCents)}
        </p>
        <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
          {formatLabel(bouquet.flowerType)}
        </p>
      </div>
      <AddToCartControls
        item={{
          id: bouquet.id,
          name: bouquet.name,
          priceCents: bouquet.priceCents,
          image: bouquet.image,
        }}
      />
    </div>
  );
}
