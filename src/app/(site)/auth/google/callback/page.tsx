import type { Metadata } from "next";
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
      <GoogleAuthCallback />
    </div>
  );
}
