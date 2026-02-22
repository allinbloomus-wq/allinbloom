import type { Metadata } from "next";
import { Suspense } from "react";
import GoogleAuthCallback from "@/components/google-auth-callback";

export const metadata: Metadata = {
  title: "Google sign in",
  robots: {
    index: false,
    follow: false,
  },
};

export default function GoogleAuthCallbackPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <Suspense fallback={<div className="text-sm text-stone-600">Loading...</div>}>
        <GoogleAuthCallback />
      </Suspense>
    </div>
  );
}
