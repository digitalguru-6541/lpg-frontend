import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import GlobalHeader from "./components/GlobalHeader";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LahorePropertyGuide.com | AI Real Estate",
  description: "Pakistan's First AI-Powered Real Estate Portal.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.className} bg-brand-dark text-white min-h-screen antialiased flex flex-col`}
        suppressHydrationWarning
      >
        {/* 🚀 The Smart Auth Header is injected here */}
        <GlobalHeader />

        <main className="flex-grow flex flex-col relative">
          {children}
        </main>
      </body>
    </html>
  );
}