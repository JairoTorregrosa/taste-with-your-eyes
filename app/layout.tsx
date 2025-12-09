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
  title: "Modern Landing Page",
  description:
    "Transform your ideas into reality with our modern platform. Experience the future of innovation today.",
  openGraph: {
    title: "Modern Landing Page",
    description:
      "Transform your ideas into reality with our modern platform. Experience the future of innovation today.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Modern Landing Page",
    description:
      "Transform your ideas into reality with our modern platform. Experience the future of innovation today.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scheme-light dark:scheme-dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
