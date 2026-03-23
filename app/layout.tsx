import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Momentum",
  description: "Build habits. Track progress. Gain momentum.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico?v=20260323" },
      { url: "/favicon-16x16.png?v=20260323", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png?v=20260323", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png?v=20260323", sizes: "180x180", type: "image/png" }],
  },
};

// Add viewport configuration for PWA theme colors
export const viewport: Viewport = {
  themeColor: "#121418",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${plusJakarta.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
