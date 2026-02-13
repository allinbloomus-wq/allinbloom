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
  const [locationKey, setLocationKey] = useState("");
  const timeoutRef = useRef<number | null>(null);
  const handledUrlToastRef = useRef<string | null>(null);

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
    const notifyLocationChange = () => {
      setLocationKey(`${window.location.pathname}${window.location.search}`);
    };

    notifyLocationChange();

    const originalPushState = window.history.pushState.bind(window.history);
    const originalReplaceState = window.history.replaceState.bind(window.history);

    window.history.pushState = ((data, unused, url) => {
      originalPushState(data, unused, url);
      notifyLocationChange();
    }) as History["pushState"];

    window.history.replaceState = ((data, unused, url) => {
      originalReplaceState(data, unused, url);
      notifyLocationChange();
    }) as History["replaceState"];

    window.addEventListener("popstate", notifyLocationChange);

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener("popstate", notifyLocationChange);
    };
  }, []);

  useEffect(() => {
    if (!locationKey) return;

    const currentUrl = new URL(window.location.href);
    const toastKey = currentUrl.searchParams.get("toast");
    if (!toastKey) {
      handledUrlToastRef.current = null;
      return;
    }

    const urlMarker = `${currentUrl.pathname}?${currentUrl.searchParams.toString()}`;
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

    currentUrl.searchParams.delete("toast");
    const nextQuery = currentUrl.searchParams.toString();
    const nextRelativeUrl = `${currentUrl.pathname}${
      nextQuery ? `?${nextQuery}` : ""
    }${currentUrl.hash}`;
    window.history.replaceState(window.history.state, "", nextRelativeUrl);

    return () => window.clearTimeout(timerId);
  }, [locationKey, showToast]);

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
