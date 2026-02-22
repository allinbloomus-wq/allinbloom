"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { setAuthSession } from "@/lib/auth-client";
import { clientFetch } from "@/lib/api-client";

type GoogleCredentialResponse = {
  credential?: string;
};

type GoogleCodeResponse = {
  code?: string;
  error?: string;
};

type GoogleButtonConfig = Record<string, string | number | boolean>;

type GoogleAccountsId = {
  initialize: (config: {
    client_id: string;
    use_fedcm_for_prompt?: boolean;
    use_fedcm_for_button?: boolean;
    callback: (response: GoogleCredentialResponse) => void;
  }) => void;
  renderButton: (element: HTMLElement, config: GoogleButtonConfig) => void;
};

type GoogleCodeClient = {
  requestCode: () => void;
};

type GoogleAccountsOauth2 = {
  initCodeClient: (config: {
    client_id: string;
    scope: string;
    ux_mode?: "popup" | "redirect";
    callback: (response: GoogleCodeResponse) => void;
    error_callback?: () => void;
  }) => GoogleCodeClient;
};

type GoogleWindow = Window & {
  google?: {
    accounts?: {
      id?: GoogleAccountsId;
      oauth2?: GoogleAccountsOauth2;
    };
  };
};

export default function AuthPanel() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [needsName, setNeedsName] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  const [googlePopupBusy, setGooglePopupBusy] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
  const googleEnabled =
    process.env.NEXT_PUBLIC_GOOGLE_ENABLED === "true" && Boolean(googleClientId);

  const completeGoogleSignIn = useCallback(
    async (path: string, body: Record<string, string>, fallbackMessage: string) => {
      setStatus("Signing in...");
      const verify = await clientFetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await verify.json().catch(() => ({}));
      if (!verify.ok) {
        setStatus(payload?.detail || fallbackMessage);
        return;
      }

      const token = payload?.accessToken || payload?.access_token;
      const user = payload?.user;
      if (!token || !user) {
        setStatus(fallbackMessage);
        return;
      }

      setAuthSession(token, user);
      window.location.href = "/";
    },
    []
  );

  const onGoogleCredential = useCallback(async (response: GoogleCredentialResponse) => {
    if (!response?.credential) {
      setStatus("Unable to sign in with Google.");
      return;
    }

    await completeGoogleSignIn(
      "/api/auth/google",
      { idToken: response.credential },
      "Unable to sign in with Google."
    );
  }, [completeGoogleSignIn]);

  const onGoogleCode = useCallback(
    async (response: GoogleCodeResponse) => {
      if (response?.error || !response?.code) {
        setStatus("Google fallback sign-in was canceled or blocked.");
        return;
      }

      await completeGoogleSignIn(
        "/api/auth/google/code",
        { code: response.code },
        "Unable to sign in with Google fallback."
      );
    },
    [completeGoogleSignIn]
  );

  const requestGoogleFallback = useCallback(() => {
    const google = (window as GoogleWindow).google;
    const googleOauth2 = google?.accounts?.oauth2;
    if (!googleOauth2) {
      setStatus("Google sign-in is not ready yet. Refresh and try again.");
      return;
    }

    setGooglePopupBusy(true);
    try {
      const codeClient = googleOauth2.initCodeClient({
        client_id: googleClientId,
        scope: "openid email profile",
        ux_mode: "popup",
        callback: (response) => {
          setGooglePopupBusy(false);
          void onGoogleCode(response);
        },
        error_callback: () => {
          setGooglePopupBusy(false);
          setStatus("Google fallback popup was closed or blocked.");
        },
      });
      codeClient.requestCode();
    } catch {
      setGooglePopupBusy(false);
      setStatus("Unable to open Google fallback sign-in.");
    }
  }, [googleClientId, onGoogleCode]);

  const initializeGoogle = useCallback(() => {
    const google = (window as GoogleWindow).google;
    const googleAccounts = google?.accounts?.id;
    if (!googleAccounts) return false;

    googleAccounts.initialize({
      client_id: googleClientId,
      use_fedcm_for_prompt: true,
      use_fedcm_for_button: true,
      callback: onGoogleCredential,
    });

    if (googleButtonRef.current) {
      googleButtonRef.current.innerHTML = "";
      googleAccounts.renderButton(googleButtonRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "pill",
        logo_alignment: "left",
      });
    }

    return true;
  }, [googleClientId, onGoogleCredential]);

  useEffect(() => {
    if (!googleEnabled || !googleClientId) return;

    const onLoaded = () => {
      initializeGoogle();
    };

    const onLoadFailed = () => {
      setStatus(
        "Unable to load Google sign-in. Disable blockers and refresh the page."
      );
    };

    const existing = document.getElementById("google-identity") as HTMLScriptElement | null;
    if (existing) {
      if ((window as GoogleWindow).google?.accounts?.id) {
        onLoaded();
        return;
      }
      existing.addEventListener("load", onLoaded, { once: true });
      existing.addEventListener("error", onLoadFailed, { once: true });
      return () => {
        existing.removeEventListener("load", onLoaded);
        existing.removeEventListener("error", onLoadFailed);
      };
    }

    const script = document.createElement("script");
    script.id = "google-identity";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = onLoaded;
    script.onerror = onLoadFailed;
    document.head.appendChild(script);
  }, [googleEnabled, googleClientId, initializeGoogle]);

  useEffect(() => {
    if (!retryAfter) return;
    const timer = setInterval(() => {
      setRetryAfter((prev) => {
        if (!prev || prev <= 1) {
          clearInterval(timer);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [retryAfter]);

  const requestCode = async () => {
    setStatus("Sending code...");
    const response = await clientFetch("/api/auth/request-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const payload = await response.json().catch(() => ({}));

    if (response.ok) {
      setNeedsName(false);
      setCodeSent(true);
      setRetryAfter(null);
      setStatus("Code sent. Check your email.");
      return;
    }

    if (response.status === 429 && payload?.retryAfterSec) {
      setRetryAfter(payload.retryAfterSec);
    }
    setStatus(payload?.error || payload?.detail || "Unable to send code.");
  };

  const verifyCode = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (needsName && !name.trim()) {
      setStatus("Please enter your name to finish signup.");
      return;
    }
    setStatus("Verifying...");

    const response = await clientFetch("/api/auth/verify-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        code,
        name: name.trim() || undefined,
      }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message =
        payload?.detail || payload?.error || "Invalid code. Please try again.";
      if (String(message).toLowerCase().includes("name")) {
        setNeedsName(true);
        setStatus("Please enter your name to finish signup.");
        return;
      }
      setStatus(message);
      return;
    }

    const token = payload?.accessToken || payload?.access_token;
    const user = payload?.user;
    if (!token || !user) {
      setStatus("Unable to sign in.");
      return;
    }
    setAuthSession(token, user);
    window.location.href = "/";
  };

  return (
    <div className="glass w-full max-w-md space-y-4 rounded-[32px] border border-white/80 p-5 text-sm sm:p-6">
      <div className="space-y-2 text-center">
        <p className="text-xs uppercase tracking-[0.32em] text-stone-500">
          Secure sign in
        </p>
        <h1 className="text-3xl font-semibold text-stone-900">
          Welcome back
        </h1>
        <p className="text-sm text-stone-600">
          Use a one-time email code or Google.
        </p>
      </div>
      <div className="space-y-3">
        <label className="flex flex-col gap-2 text-sm text-stone-700">
          Email
          <input
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setName("");
              setCode("");
              setCodeSent(false);
              setNeedsName(false);
              setStatus(null);
            }}
            type="email"
            placeholder="you@example.com"
            className="w-full min-w-0 rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-sm text-stone-800 outline-none focus:border-stone-400"
          />
        </label>
        <button
          type="button"
          onClick={requestCode}
          disabled={!email || Boolean(retryAfter)}
          className="w-full rounded-full border border-stone-200 bg-white/80 px-4 py-2 text-xs uppercase tracking-[0.3em] text-stone-600 disabled:opacity-50"
        >
          {retryAfter
            ? `Resend in ${retryAfter}s`
            : codeSent
            ? "Resend code"
            : "Send code"}
        </button>
      </div>
      {codeSent ? (
        <form onSubmit={verifyCode} className="min-w-0 space-y-3">
          {needsName ? (
            <label className="flex flex-col gap-2 text-sm text-stone-700">
              Full name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                type="text"
                placeholder="Jane Doe"
                className="w-full min-w-0 rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-sm text-stone-800 outline-none focus:border-stone-400"
              />
            </label>
          ) : null}
          <label className="flex flex-col gap-2 text-sm text-stone-700">
            Verification code
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="6-digit code"
              className="w-full min-w-0 rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-sm text-stone-800 outline-none focus:border-stone-400"
            />
          </label>
          <button
            type="submit"
            disabled={!email || !code || (needsName && !name.trim())}
            className="w-full rounded-full bg-[color:var(--brand)] px-4 py-3 text-xs uppercase tracking-[0.3em] text-white disabled:opacity-50"
          >
            Verify & sign in
          </button>
        </form>
      ) : null}
      {googleEnabled ? (
        <>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-stone-400">
            <div className="h-px flex-1 bg-stone-200" />
            or
            <div className="h-px flex-1 bg-stone-200" />
          </div>
          <div className="flex justify-center">
            <div ref={googleButtonRef} />
          </div>
          <button
            type="button"
            onClick={requestGoogleFallback}
            disabled={googlePopupBusy}
            className="w-full rounded-full border border-stone-200 bg-white/80 px-4 py-2 text-xs uppercase tracking-[0.24em] text-stone-600 disabled:opacity-50"
          >
            {googlePopupBusy ? "Opening Google..." : "Google fallback sign-in"}
          </button>
          <p className="text-center text-xs text-stone-500">
            If FedCM fails on desktop, use fallback sign-in.
          </p>
        </>
      ) : null}
      {status ? (
        <p className="text-center text-xs uppercase tracking-[0.24em] text-stone-500">
          {status}
        </p>
      ) : null}
    </div>
  );
}
