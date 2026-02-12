"use client";

import { useEffect } from "react";
import { CartProvider } from "@/lib/cart";
import { getClientAuthToken, getClientUser, getUsableAuthToken } from "@/lib/auth-client";

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const hasSessionCookie = Boolean(getClientAuthToken() || getClientUser());
    if (!hasSessionCookie) return;

    void getUsableAuthToken(15 * 60);

    const interval = window.setInterval(() => {
      void getUsableAuthToken(15 * 60);
    }, 5 * 60 * 1000);

    return () => window.clearInterval(interval);
  }, []);

  return <CartProvider>{children}</CartProvider>;
}
