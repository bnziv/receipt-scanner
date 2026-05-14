import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Receipt Splitter",
  description: "Split restaurant bills fairly with AI receipt scanning",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
