"use client";

import { useEffect } from "react";

const TELEGRAM_UA_PATTERN = /telegram|tgwebview|telegrambot|telegram-android|telegram-ios/i;
const TELEGRAM_REFERRER_PATTERN = /(^|\.)t\.me$/i;

function isTelegramWebview(): boolean {
  const w = window as Window & {
    TelegramWebviewProxy?: unknown;
    Telegram?: { WebApp?: unknown };
  };

  const ua = navigator.userAgent || "";
  if (TELEGRAM_UA_PATTERN.test(ua)) {
    return true;
  }

  if (w.TelegramWebviewProxy || w.Telegram?.WebApp) {
    return true;
  }

  const params = new URLSearchParams(window.location.search);
  if (
    params.has("tgWebAppData") ||
    params.has("tgWebAppVersion") ||
    params.has("tgWebAppPlatform")
  ) {
    return true;
  }

  const referrer = document.referrer || "";
  const refHost = referrer ? new URL(referrer).hostname : "";
  const offsetTop = window.visualViewport?.offsetTop ?? 0;

  return TELEGRAM_REFERRER_PATTERN.test(refHost) && offsetTop > 12;
}

export default function TelegramWebviewFix() {
  useEffect(() => {
    const root = document.documentElement;

    const syncMode = () => {
      if (isTelegramWebview()) {
        root.dataset.telegramWebview = "true";
      } else {
        delete root.dataset.telegramWebview;
      }
    };

    syncMode();
    window.visualViewport?.addEventListener("resize", syncMode);
    window.addEventListener("resize", syncMode);

    return () => {
      window.visualViewport?.removeEventListener("resize", syncMode);
      window.removeEventListener("resize", syncMode);
      delete root.dataset.telegramWebview;
    };
  }, []);

  return null;
}
