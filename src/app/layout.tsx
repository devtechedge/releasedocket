import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "ReleaseDocket — Delivery receipts clients can trust",
  description:
    "Connect delivery claims to source evidence and client acceptance.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
