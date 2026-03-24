import type { Metadata, Viewport } from "next";
import { Rubik } from "next/font/google";

import { AppNav } from "@/components/AppNav";
import { PwaInstallBanner } from "@/components/PwaInstallBanner";

import { AppProviders } from "./providers";
import "./globals.css";

const rubik = Rubik({
  subsets: ["hebrew", "latin"],
  display: "swap",
  variable: "--font-rubik",
});

/** Same as `manifest.ts` theme_color for status bar / splash tint. */
const THEME_COLOR = "#171717";

export const viewport: Viewport = {
  themeColor: THEME_COLOR,
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "ServiceOS",
  description: "ניהול תלמידים, שיעורים והגדרות — ServiceOS",
  applicationName: "ServiceOS",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ServiceOS",
  },
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className={rubik.variable}>
      <body className="font-sans antialiased">
        <AppProviders>
          <AppNav />
          {children}
          <PwaInstallBanner />
        </AppProviders>
      </body>
    </html>
  );
}
