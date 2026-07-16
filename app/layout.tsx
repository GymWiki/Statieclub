import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { cn } from "@/lib/utils";
import "./globals.css";

const display = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Statieclub — Jouw lege flessen. Hun nieuwe doeltjes.",
  description:
    "Geef je statiegeld aan een sportclub in de buurt. Jeugdteams komen het juichend ophalen en strijden om de hoogste opbrengst.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0f172a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={cn(display.variable, body.variable)}>
      <body className="min-h-dvh font-body antialiased">{children}</body>
    </html>
  );
}
