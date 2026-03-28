import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { AppNav } from "@/components/shared/AppNav";
import { Providers } from "@/components/shared/Providers";

import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Logs Dashboard",
  description: "Logs management and analytics dashboard",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Providers>
          <AppNav />
          <div className="mx-auto max-w-[min(1520px,calc(100vw-40px))] px-[clamp(1.25rem,3vw,2.5rem)] pb-[72px]">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
