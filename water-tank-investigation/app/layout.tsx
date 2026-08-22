import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Water Tank Investigation",
  description:
    "Discover slope and y-intercept by connecting a water tank, table, graph, and equation.",
  openGraph: {
    title: "The Water Tank Investigation",
    description: "Starting amount. Rate. One linear pattern.",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Water Tank Investigation",
    description: "Starting amount. Rate. One linear pattern.",
    images: ["/og.png"],
  },
  other: { "codex-preview": "development" },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
