import type { Metadata, Viewport } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Momentum",
  description: "Build habits. Track progress. Gain momentum.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico?v=20261111" },
      { url: "/favicon-16x16.png?v=20261111", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png?v=20261111", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png?v=20261111", sizes: "180x180", type: "image/png" }],
  },
};

// Add viewport configuration for PWA theme colors
export const viewport: Viewport = {
  themeColor: "#f6f1e7",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${fraunces.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
