type PromoCardProps = {
  title: string;
  description: string;
  tone?: "rose" | "leaf";
};

export default function PromoCard({
  title,
  description,
  tone = "rose",
}: PromoCardProps) {
  const toneClasses =
    tone === "leaf"
      ? "from-[#f4ede8] to-[#ead9d2] text-[color:var(--brand)]"
      : "from-[color:var(--soft-rose)] to-[color:var(--accent)] text-[color:var(--brand)]";

  return (
    <div
      className={`rounded-[28px] border border-white/80 bg-gradient-to-br ${toneClasses} p-6 shadow-sm`}
    >
      <p className="text-xs uppercase tracking-[0.32em] text-stone-500">
        Exclusive
      </p>
      <h3 className="mt-2 text-2xl font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-stone-600">
        {description}
      </p>
    </div>
  );
}
