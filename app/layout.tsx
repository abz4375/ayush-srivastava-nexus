import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Suspense } from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ayush Srivastava - Full Stack Developer",
  description:
    "Building scalable web applications and innovative solutions with modern technologies",
  icons: {
    icon: '/ayush.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <Suspense>{children}</Suspense>
        </Providers>
      </body>
    </html>
  );
}
