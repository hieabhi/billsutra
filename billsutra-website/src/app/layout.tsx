import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "BillSutra | Enterprise Business Operating System",
  description: "The world's most advanced operating system for Hotels, Restaurants, and Pharmacies.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={cn(inter.variable, "font-sans bg-gray-950 text-white antialiased selection:bg-blue-500/30")}>
        <div className="fixed inset-0 -z-10 aurora-bg" />
        {children}
      </body>
    </html>
  );
}
