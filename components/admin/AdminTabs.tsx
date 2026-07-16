"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShieldAlert, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminTabs({ slug }: { slug: string }) {
  const pathname = usePathname();

  const tabs = [
    { href: `/admin/${slug}`, label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: `/admin/${slug}/controle`, label: "Controle", icon: ShieldAlert, exact: false },
    { href: `/admin/${slug}/campagne-beheer`, label: "Campagnebeheer", icon: Users, exact: false },
  ];

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-gray-200 px-4">
      {tabs.map(({ href, label, icon: Icon, exact }) => {
        const actief = exact ? pathname === href : pathname?.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-3 text-sm font-medium transition-colors",
              actief ? "border-brand-600 text-brand-700" : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            <Icon className="h-4 w-4" /> {label}
          </Link>
        );
      })}
    </nav>
  );
}
