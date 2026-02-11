"use client";

import { clearAuthSession } from "@/lib/auth-client";
import { clientFetch } from "@/lib/api-client";

export default function SignOutButton() {
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await clientFetch("/api/auth/logout", { method: "POST" });
        } finally {
          clearAuthSession();
          window.location.href = "/";
        }
      }}
      className="w-full rounded-full border border-stone-300 bg-white/80 px-4 py-2 text-xs uppercase tracking-[0.3em] text-stone-600 transition hover:border-stone-400"
    >
      Sign out
    </button>
  );
}
