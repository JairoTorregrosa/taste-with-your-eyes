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
  title: "Taste with Your Eyes",
  description:
    "Upload a photo of a restaurant menu and get an interactive, visual menu in seconds.",
  openGraph: {
    title: "Taste with Your Eyes",
    description:
      "Upload a photo of a restaurant menu and get an interactive, visual menu in seconds.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Taste with Your Eyes",
    description:
      "Upload a photo of a restaurant menu and get an interactive, visual menu in seconds.",
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
