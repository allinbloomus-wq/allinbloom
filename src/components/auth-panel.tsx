"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";

export default function AuthPanel() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [needsName, setNeedsName] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_ENABLED === "true";

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
    const response = await fetch("/api/auth/request-code", {
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
    setStatus(payload?.error || "Unable to send code.");
  };

  const verifyCode = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (needsName && !name.trim()) {
      setStatus("Please enter your name to finish signup.");
      return;
    }
    setStatus("Verifying...");

    const result = await signIn("credentials", {
      email,
      name,
      code,
      redirect: false,
      callbackUrl: "/",
    });

    if (result?.error) {
      if (result.error === "NAME_REQUIRED" || !name.trim()) {
        setNeedsName(true);
        setStatus("Please enter your name to finish signup.");
        return;
      }
      setStatus("Invalid code. Please try again.");
      return;
    }

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
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="w-full rounded-full border border-stone-200 bg-white/80 px-4 py-3 text-xs uppercase tracking-[0.3em] text-stone-600"
          >
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
