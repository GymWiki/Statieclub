"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, PinIcon, Camera, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav({ clubSlug }: { clubSlug: string }) {
  const pathname = usePathname();

  const items = [
    { href: `/club/${clubSlug}/leaderboard`, label: "Scorebord", icon: Trophy },
    { href: `/club/${clubSlug}/prikbord`, label: "Prikbord", icon: PinIcon },
    { href: `/club/${clubSlug}/upload`, label: "Bonnetje", icon: Camera },
    { href: `/club/${clubSlug}/profiel`, label: "Profiel", icon: UserRound },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-lg items-stretch justify-around">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium",
                active ? "text-brand-600" : "text-gray-400"
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
