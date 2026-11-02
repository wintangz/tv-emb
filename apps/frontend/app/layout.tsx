import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import EmbroideryStudio from "@/components/EmbroideryStudio";
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
  title: "Tuong Vinh Embroidery | Commercial Embroidery Production & Shop ERP",
  description:
    "Full-stack embroidery business management system for Tuong Vinh Embroidery (Xưởng Thêu Vi Tính Tường Vinh): work orders, printable job sheets & invoices, digitizing catalog, multi-head machine telemetry, Madeira thread inventory, and stitch quote calculator.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="tv-bg tv-text min-h-full flex flex-col">
        <EmbroideryStudio>{children}</EmbroideryStudio>
      </body>
    </html>
  );
}
