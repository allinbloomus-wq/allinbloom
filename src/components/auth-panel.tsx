"use client";

import { useEffect, useState } from "react";
import { setAuthSession } from "@/lib/auth-client";
import { clientFetch } from "@/lib/api-client";

export default function AuthPanel() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [needsName, setNeedsName] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
  const googleEnabled =
    process.env.NEXT_PUBLIC_GOOGLE_ENABLED === "true" && Boolean(googleClientId);

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

  useEffect(() => {
    if (!googleEnabled || !googleClientId) return;
    if (document.getElementById("google-identity")) return;

    const script = document.createElement("script");
    script.id = "google-identity";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      const google = (window as any).google;
      if (!google?.accounts?.id) return;
      google.accounts.id.initialize({
        client_id: googleClientId,
        use_fedcm_for_prompt: false,
        callback: async (response: { credential?: string }) => {
          if (!response?.credential) {
            setStatus("Unable to sign in with Google.");
            return;
          }
          setStatus("Signing in...");
          const verify = await clientFetch("/api/auth/google", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken: response.credential }),
          });
          const payload = await verify.json().catch(() => ({}));
          if (!verify.ok) {
            setStatus(payload?.detail || "Unable to sign in with Google.");
            return;
          }
          const token = payload?.accessToken || payload?.access_token;
          const user = payload?.user;
          if (!token || !user) {
            setStatus("Unable to sign in with Google.");
            return;
          }
          setAuthSession(token, user);
          window.location.href = "/";
        },
      });
    };
    document.head.appendChild(script);
  }, [googleEnabled, googleClientId]);

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
    <div className="glass w-full max-w-md space-y-4 rounded-[32px] border border-white/80 p-6 text-sm">
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
            className="rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-sm text-stone-800"
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
        <form onSubmit={verifyCode} className="space-y-3">
          {needsName ? (
            <label className="flex flex-col gap-2 text-sm text-stone-700">
              Full name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                type="text"
                placeholder="Jane Doe"
                className="rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-sm text-stone-800"
              />
            </label>
          ) : null}
          <label className="flex flex-col gap-2 text-sm text-stone-700">
            Verification code
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="6-digit code"
              className="rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-sm text-stone-800"
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
          <button
            type="button"
            onClick={() => {
              const google = (window as any).google;
              if (!google?.accounts?.id) {
                setStatus("Google sign-in is not ready yet.");
                return;
              }
              google.accounts.id.prompt((notification: any) => {
                if (notification?.isNotDisplayed?.()) {
                  setStatus(
                    "Google sign-in is unavailable in this browser. Use email code or try another browser."
                  );
                }
              });
            }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-stone-200 bg-white/80 px-4 py-3 text-xs uppercase tracking-[0.3em] text-stone-600"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-4 w-4"
            >
              <path
                fill="#EA4335"
                d="M12 10.2v3.9h5.4c-.2 1.4-1.6 4.1-5.4 4.1-3.2 0-5.8-2.7-5.8-6s2.6-6 5.8-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.6 3.6 14.5 2.7 12 2.7 7.7 2.7 4.2 6.2 4.2 10.5S7.7 18.3 12 18.3c5 0 6.9-3.5 6.9-5.3 0-.4-.1-.7-.1-.9H12z"
              />
              <path
                fill="#34A853"
                d="M6.4 14.4l-2.8 2.1C5.1 19.5 8.3 21.3 12 21.3c2.8 0 5.1-1 6.8-2.8l-3.3-2.7c-.9.6-2.1 1-3.5 1-2.8 0-5.1-1.8-5.9-4.4z"
              />
              <path
                fill="#FBBC05"
                d="M3.4 8.5c-.2.6-.3 1.3-.3 2s.1 1.4.3 2l3.1-2.4-3.1-2.4z"
              />
              <path
                fill="#4285F4"
                d="M12 5.5c1.7 0 3.1.6 4.1 1.7l3.1-3.1C17.3 2.4 14.9 1.3 12 1.3 8.3 1.3 5.1 3.1 3.6 6.5l2.8 2.1C7 6.9 9.3 5.5 12 5.5z"
              />
            </svg>
            Continue with Google
          </button>
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
