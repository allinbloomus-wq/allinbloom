import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import {
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_ORIGIN,
  SITE_TAGLINE,
} from "@/lib/site";

const display = Sora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-serif",
  display: "swap",
});

const sans = Manrope({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
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
        url: "/images/hero-bouquet.png",
        alt: SITE_TAGLINE,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "All in Bloom Floral Studio | Chicago Flower Delivery",
    description: SITE_DESCRIPTION,
    images: ["/images/hero-bouquet.png"],
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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
