import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: {
    default: "Sanaa Thrumylens — Art Through My Lens",
    template: "%s · Sanaa Thrumylens",
  },
  description:
    "A Kenyan creative-arts blog covering music, literature, culture and the people shaping East Africa's creative economy.",
  keywords: [
    "Sanaa Thrumylens",
    "Kenyan art",
    "Kenyan music",
    "Kenyan literature",
    "East Africa creative",
    "Kodong Klan",
    "Nikita Kering",
    "creative economy Kenya",
  ],
  authors: [{ name: "Sanaa Thrumylens" }],
  metadataBase: new URL("https://www.saaathrumylens.co.ke"),
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  openGraph: {
    title: "Sanaa Thrumylens — Art Through My Lens",
    description:
      "A Kenyan creative-arts blog covering music, literature, culture and the people shaping East Africa's creative economy.",
    url: "https://www.saaathrumylens.co.ke",
    siteName: "Sanaa Thrumylens",
    type: "website",
    locale: "en_KE",
    images: [
      {
        url: "/icons/icon-512.png",
        width: 512,
        height: 512,
        alt: "Sanaa Thrumylens",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sanaa Thrumylens",
    description:
      "A Kenyan creative-arts blog covering music, literature, culture and the people shaping East Africa's creative economy.",
    images: ["/icons/icon-512.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#A0421C",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* PWA splash screen for iOS */}
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Sanaa Thrumylens" />
        <link rel="apple-touch-startup-image" href="/icons/splash.png" />
      </head>
      <body
        className={`${inter.variable} ${playfair.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <SonnerToaster position="bottom-right" />
      </body>
    </html>
  );
}
