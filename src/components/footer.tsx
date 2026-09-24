import Link from "next/link";
import FooterLegal from "@/components/footer-legal";
import {
  SITE_ADDRESS_LINE_1,
  SITE_CITY,
  SITE_EMAIL,
  SITE_HOURS,
  SITE_NAME,
  SITE_PHONE,
  SITE_PHONE_DISPLAY,
  SITE_POSTAL_CODE,
  SITE_REGION,
} from "@/lib/site";

export default function Footer() {
  return (
    <footer className="border-t border-white/60 bg-white/70">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 sm:py-12 lg:px-8 md:grid-cols-[1.2fr_1fr_1fr]">
        <div className="space-y-3">
          <p className="font-[family-name:var(--font-script)] text-[1.75rem] leading-[0.95] text-[color:var(--brand)] sm:text-[1.9rem]">
            {SITE_NAME}
          </p>
          <p className="text-sm text-stone-600">
            Elegant bouquets curated daily in Wheeling with gentle, feminine
            palettes and modern floral artistry.
          </p>
        </div>
        <div className="space-y-2 text-sm text-stone-600">
          <p className="text-xs uppercase tracking-[0.32em] text-stone-500">
            Boutique
          </p>
          <Link href="/catalog" className="block hover:text-stone-800">
            Flowers
          </Link>
          <Link href="/balloons" className="block hover:text-stone-800">
            Balloons
          </Link>
          <Link href="/gifts" className="block hover:text-stone-800">
            Gift Box
          </Link>
          <Link href="/event-space" className="block hover:text-stone-800">
            Event space
          </Link>
          <Link href="/reviews" className="block hover:text-stone-800">
            Reviews
          </Link>
          <Link href="/contact" className="block hover:text-stone-800">
            Contact
          </Link>
          <Link href="/account" className="block hover:text-stone-800">
            Account
          </Link>
        </div>
        <div className="space-y-2 text-sm text-stone-600">
          <p className="text-xs uppercase tracking-[0.32em] text-stone-500">
            Atelier
          </p>
          <p>{SITE_NAME}</p>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              `${SITE_ADDRESS_LINE_1}, ${SITE_CITY}, ${SITE_REGION} ${SITE_POSTAL_CODE}`
            )}`}
            target="_blank"
            rel="noreferrer"
            className="block hover:text-stone-800"
          >
            {SITE_ADDRESS_LINE_1}
            <br />
            {SITE_CITY}, {SITE_REGION} {SITE_POSTAL_CODE}
          </a>
          <a href={`tel:${SITE_PHONE}`} className="block hover:text-stone-800">
            {SITE_PHONE_DISPLAY}
          </a>
          <div>
            {SITE_HOURS.map(({ label, hours }) => (
              <p key={label}>
                {label}: {hours}
              </p>
            ))}
          </div>
          <p className="break-all">{SITE_EMAIL}</p>
        </div>
      </div>
      <div className="border-t border-white/60 py-4 text-center text-[10px] uppercase tracking-[0.2em] text-stone-500 sm:text-xs sm:tracking-[0.3em]">
        <div className="flex flex-col items-center gap-1">
          <p>
            (c) {new Date().getFullYear()} {SITE_NAME}. All rights
            reserved.
          </p>
          <FooterLegal />
          <a
            href="https://t.me/otdamgololobov"
            target="_blank"
            rel="noreferrer"
            className="transition hover:text-stone-700"
          >
            created by otdamgololobov
          </a>
        </div>
      </div>
    </footer>
  );
}
