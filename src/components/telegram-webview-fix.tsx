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

    return () => {
      delete root.dataset.telegramWebview;
    };
  }, []);

  return null;
}
