import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Providers from "./providers";
import TelegramWebviewFix from "@/components/telegram-webview-fix";
import {
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_ORIGIN,
  SITE_TAGLINE,
} from "@/lib/site";

const display = localFont({
  src: [
    {
      path: "../../public/fonts/Unbounded-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/Unbounded-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/fonts/Unbounded-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/fonts/Unbounded-ExtraBold.ttf",
      weight: "800",
      style: "normal",
    },
  ],
  variable: "--font-serif",
  display: "swap",
  fallback: ["Segoe UI", "Trebuchet MS", "Arial", "sans-serif"],
});

const sans = localFont({
  src: [
    {
      path: "../../public/fonts/Unbounded-ExtraLight.ttf",
      weight: "200",
      style: "normal",
    },
    {
      path: "../../public/fonts/Unbounded-Light.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../public/fonts/Unbounded-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/Unbounded-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/Unbounded-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/fonts/Unbounded-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-sans",
  display: "swap",
  fallback: ["Segoe UI", "system-ui", "Arial", "sans-serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: {
    default: "All in Bloom Floral Studio | Chicago Flower Delivery",
    template: "%s | All in Bloom Floral Studio",
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  applicationName: SITE_NAME,
  creator: SITE_NAME,
  publisher: SITE_NAME,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    title: "All in Bloom Floral Studio | Chicago Flower Delivery",
    description: SITE_DESCRIPTION,
    siteName: SITE_NAME,
    locale: "en_US",
    images: [
      {
        url: "/images/hero-bouquet.webp",
        alt: SITE_TAGLINE,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "All in Bloom Floral Studio | Chicago Flower Delivery",
    description: SITE_DESCRIPTION,
    images: ["/images/hero-bouquet.webp"],
  },
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="antialiased">
        <TelegramWebviewFix />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
