"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type TidioEvent = "ready" | "open" | "close";

type TidioChatApi = {
  on: (event: TidioEvent, callback: () => void) => void;
  show: () => void;
  hide: () => void;
  open: () => void;
  close: () => void;
  adjustStyles: (styles: string) => string;
};

declare global {
  interface Window {
    tidioChatApi?: TidioChatApi;
  }
}

const TIDIO_SCRIPT_ID = "tidio-live-chat-script";
const MOBILE_BREAKPOINT = 768;

const DESKTOP_CHAT_STYLES = `
  #tidio {
    right: 24px !important;
    bottom: 24px !important;
    left: auto !important;
  }

  #tidio-chat,
  #tidio-chat-iframe {
    width: min(390px, calc(100vw - 32px)) !important;
    height: min(620px, calc(100vh - 108px)) !important;
    max-width: 390px !important;
    max-height: 620px !important;
    border-radius: 20px !important;
    overflow: hidden !important;
  }

  #tidio-chat iframe,
  #tidio-chat-iframe iframe {
    border-radius: 20px !important;
  }
`;

const MOBILE_CHAT_STYLES = `
  #tidio {
    right: 0 !important;
    bottom: 0 !important;
    left: 0 !important;
  }

  #tidio-chat,
  #tidio-chat-iframe {
    top: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    max-width: 100vw !important;
    height: 100dvh !important;
    max-height: 100dvh !important;
    border-radius: 0 !important;
  }

  #tidio-chat iframe,
  #tidio-chat-iframe iframe {
    border-radius: 0 !important;
  }
`;

function isMobileViewport() {
  return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`).matches;
}

export default function TidioChatWidget() {
  const publicKey = process.env.NEXT_PUBLIC_TIDIO_PUBLIC_KEY;
  const [isReady, setIsReady] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const apiRef = useRef<TidioChatApi | null>(null);
  const listenersBoundRef = useRef(false);

  const applyViewportStyles = useCallback(() => {
    const api = apiRef.current;
    if (!api) return;

    api.adjustStyles(isMobileViewport() ? MOBILE_CHAT_STYLES : DESKTOP_CHAT_STYLES);
  }, []);

  useEffect(() => {
    if (!publicKey) return;

    let mounted = true;

    const bindChatApi = () => {
      const api = window.tidioChatApi;
      if (!api || !mounted) return;

      apiRef.current = api;
      applyViewportStyles();
      api.hide();
      setIsReady(true);

      if (!listenersBoundRef.current) {
        api.on("open", () => {
          if (!mounted) return;
          setIsOpen(true);
        });

        api.on("close", () => {
          api.hide();
          if (!mounted) return;
          setIsOpen(false);
        });

        listenersBoundRef.current = true;
      }
    };

    const onTidioReady = () => {
      bindChatApi();
    };

    if (window.tidioChatApi) {
      bindChatApi();
    } else {
      document.addEventListener("tidioChat-ready", onTidioReady);
    }

    if (!document.getElementById(TIDIO_SCRIPT_ID)) {
      const script = document.createElement("script");
      script.id = TIDIO_SCRIPT_ID;
      script.src = `https://code.tidio.co/${publicKey}.js`;
      script.async = true;
      document.body.appendChild(script);
    }

    const onResize = () => {
      applyViewportStyles();
    };

    window.addEventListener("resize", onResize);

    return () => {
      mounted = false;
      window.removeEventListener("resize", onResize);
      document.removeEventListener("tidioChat-ready", onTidioReady);
    };
  }, [applyViewportStyles, publicKey]);

  const handleOpenChat = () => {
    const api = apiRef.current ?? window.tidioChatApi;
    if (!api) return;

    apiRef.current = api;
    applyViewportStyles();
    api.show();
    api.open();
    setIsOpen(true);
  };

  if (!publicKey) return null;

  return (
    <button
      type="button"
      aria-label="Open support chat"
      onClick={handleOpenChat}
      disabled={!isReady}
      className={`fixed bottom-5 right-5 z-[60] flex h-14 w-14 items-center justify-center rounded-full border border-white/70 bg-[var(--brand)] text-white shadow-[0_16px_34px_rgba(108,20,10,0.35)] transition duration-200 hover:-translate-y-0.5 hover:bg-[var(--brand-dark)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2 sm:bottom-6 sm:right-6 ${
        isOpen ? "pointer-events-none opacity-0" : "opacity-100"
      } ${!isReady ? "cursor-wait opacity-65" : ""}`}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        className="h-6 w-6"
      >
        <path
          d="M6 7.25h12a1.75 1.75 0 0 1 1.75 1.75v7a1.75 1.75 0 0 1-1.75 1.75H11l-4.75 3v-3H6A1.75 1.75 0 0 1 4.25 16v-7A1.75 1.75 0 0 1 6 7.25Z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M8.4 11.4h7.2M8.4 14h4.8" strokeLinecap="round" />
      </svg>
    </button>
  );
}
