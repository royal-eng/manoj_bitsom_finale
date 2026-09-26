import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "ScamShield — A little pause. A lot of protection.",
  description: "A calm companion for conversations that don’t feel right.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
