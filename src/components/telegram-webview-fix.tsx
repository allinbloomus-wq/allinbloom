"use client";

import { useEffect } from "react";

const TELEGRAM_UA_PATTERN = /\bTelegram\b/i;

export default function TelegramWebviewFix() {
  useEffect(() => {
    const root = document.documentElement;
    const userAgent = navigator.userAgent || "";

    if (!TELEGRAM_UA_PATTERN.test(userAgent)) {
      return;
    }

    root.dataset.telegramWebview = "true";

    const viewportOffsetTop = window.visualViewport?.offsetTop ?? 0;
    const offset = Math.max(0, Math.round(viewportOffsetTop));
    root.style.setProperty("--telegram-offset-top", `${offset}px`);

    return () => {
      delete root.dataset.telegramWebview;
      root.style.removeProperty("--telegram-offset-top");
    };
  }, []);

  return null;
}
