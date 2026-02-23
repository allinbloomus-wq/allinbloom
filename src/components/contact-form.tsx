"use client";

import { useState } from "react";

export default function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("sending");

    const form = event.currentTarget; // Keep a reference to the form.
    const formData = new FormData(form);
    const payload = {
      name: formData.get("name"),
      email: formData.get("email"),
      message: formData.get("message"),
      website: formData.get("website"),
    };

    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      setStatus("sent");
      form.reset(); // Reuse the same form reference.
    } else {
      setStatus("error");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="glass max-w-full space-y-4 rounded-[28px] border border-white/80 p-5 sm:p-6"
    >
      <div
        className="absolute left-[-10000px] top-auto h-0 w-0 overflow-hidden"
        aria-hidden="true"
      >
        <label className="flex flex-col gap-2 text-sm text-stone-700">
          Website
          <input
            name="website"
            tabIndex={-1}
            autoComplete="off"
            className="w-full min-w-0 rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-sm text-stone-800 outline-none"
          />
        </label>
      </div>
      <label className="flex flex-col gap-2 text-sm text-stone-700">
        Name
        <input
          name="name"
          required
          className="w-full min-w-0 rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-sm text-stone-800 outline-none focus:border-stone-400"
        />
      </label>
      <label className="flex flex-col gap-2 text-sm text-stone-700">
        Email
        <input
          name="email"
          type="email"
          required
          className="w-full min-w-0 rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-sm text-stone-800 outline-none focus:border-stone-400"
        />
      </label>
      <label className="flex flex-col gap-2 text-sm text-stone-700">
        Message
        <textarea
          name="message"
          rows={5}
          required
          className="w-full min-w-0 rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-sm text-stone-800 outline-none focus:border-stone-400"
        />
      </label>
      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full rounded-full bg-[color:var(--brand)] px-6 py-3 text-xs uppercase tracking-[0.3em] text-white transition hover:bg-[color:var(--brand-dark)] disabled:opacity-60"
      >
        {status === "sending" ? "Sending..." : "Send message"}
      </button>
      {status === "sent" ? (
        <p className="text-xs uppercase tracking-[0.24em] text-emerald-700">
          Message sent. We will reply shortly.
        </p>
      ) : null}
      {status === "error" ? (
        <p className="text-xs uppercase tracking-[0.24em] text-rose-700">
          Something went wrong. Please try again.
        </p>
      ) : null}
    </form>
  );
}
