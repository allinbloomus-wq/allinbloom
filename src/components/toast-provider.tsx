"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const URL_TOAST_MESSAGES: Record<string, string> = {
  "bouquet-added": "Bouquet added successfully.",
  "discounts-saved": "Discounts saved successfully.",
  "promotion-added": "Promotion added successfully.",
};

type ToastContextValue = {
  showToast: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const handledUrlToastRef = useRef<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const showToast = useCallback((nextMessage: string) => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }
    setMessage(nextMessage);
    timeoutRef.current = window.setTimeout(() => {
      setMessage(null);
      timeoutRef.current = null;
    }, 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const toastKey = searchParams.get("toast");
    if (!toastKey) {
      handledUrlToastRef.current = null;
      return;
    }

    const urlMarker = `${pathname}?${searchParams.toString()}`;
    if (handledUrlToastRef.current === urlMarker) {
      return;
    }

    const mappedMessage = URL_TOAST_MESSAGES[toastKey];
    if (!mappedMessage) {
      return;
    }

    handledUrlToastRef.current = urlMarker;
    const timerId = window.setTimeout(() => {
      showToast(mappedMessage);
    }, 0);

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("toast");
    const query = nextParams.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });

    return () => window.clearTimeout(timerId);
  }, [pathname, router, searchParams, showToast]);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex justify-center px-4">
        <div
          role="status"
          aria-live="polite"
          className={`rounded-full border border-stone-300/70 bg-white/95 px-4 py-2 text-xs text-stone-700 shadow-[0_10px_28px_rgba(42,26,24,0.18)] backdrop-blur transition-all duration-300 ${
            message
              ? "pointer-events-auto translate-y-0 opacity-100"
              : "pointer-events-none translate-y-2 opacity-0"
          }`}
        >
          {message}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
