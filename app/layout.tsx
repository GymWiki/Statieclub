import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Statieclub — Statiegeld ophalen voor je favoriete club",
  description:
    "Koppel je statiegeld aan een lokale sportclub. Buurtbewoners doneren, teams strijden om de meeste flessen op te halen.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#1db874",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
