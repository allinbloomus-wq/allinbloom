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
  let refHost = "";
  if (referrer) {
    try {
      refHost = new URL(referrer).hostname;
    } catch {
      refHost = "";
    }
  }
  const offsetTop = window.visualViewport?.offsetTop ?? 0;

  return TELEGRAM_REFERRER_PATTERN.test(refHost) && offsetTop > 12;
}

function setTelegramViewportVars(root: HTMLElement) {
  const viewport = window.visualViewport;
  const top = Math.max(0, Math.round(viewport?.offsetTop ?? 0));
  const left = Math.max(0, Math.round(viewport?.offsetLeft ?? 0));
  const width = Math.max(0, Math.round(viewport?.width ?? window.innerWidth));
  const height = Math.max(0, Math.round(viewport?.height ?? window.innerHeight));

  root.style.setProperty("--tg-vv-top", `${top}px`);
  root.style.setProperty("--tg-vv-left", `${left}px`);
  root.style.setProperty("--tg-vv-width", `${width}px`);
  root.style.setProperty("--tg-vv-height", `${height}px`);
}

function clearTelegramViewportVars(root: HTMLElement) {
  root.style.removeProperty("--tg-vv-top");
  root.style.removeProperty("--tg-vv-left");
  root.style.removeProperty("--tg-vv-width");
  root.style.removeProperty("--tg-vv-height");
}

export default function TelegramWebviewFix() {
  useEffect(() => {
    const root = document.documentElement;

    const syncMode = () => {
      if (isTelegramWebview()) {
        root.dataset.telegramWebview = "true";
        setTelegramViewportVars(root);
      } else {
        delete root.dataset.telegramWebview;
        clearTelegramViewportVars(root);
      }
    };

    syncMode();
    window.visualViewport?.addEventListener("resize", syncMode);
    window.visualViewport?.addEventListener("scroll", syncMode);
    window.addEventListener("resize", syncMode);
    window.addEventListener("scroll", syncMode, { passive: true });

    return () => {
      window.visualViewport?.removeEventListener("resize", syncMode);
      window.visualViewport?.removeEventListener("scroll", syncMode);
      window.removeEventListener("resize", syncMode);
      window.removeEventListener("scroll", syncMode);
      delete root.dataset.telegramWebview;
      clearTelegramViewportVars(root);
    };
  }, []);

  return null;
}
