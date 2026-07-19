"use client";

import { Repeat, Camera } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTeam } from "@/components/team/TeamContext";
import { TeamKiezer } from "@/components/team/TeamKiezer";
import { BottomNav } from "@/components/team/BottomNav";
import { BetaalverzoekBanner } from "@/components/team/BetaalverzoekBanner";

export function ClubShell({
  clubSlug,
  clubNaam,
  children,
}: {
  clubSlug: string;
  clubNaam: string;
  children: React.ReactNode;
}) {
  const { gekozenTeam, wisselTeam, spelerId } = useTeam();
  const pathname = usePathname();

  if (!gekozenTeam) {
    return <TeamKiezer clubNaam={clubNaam} />;
  }

  const scanPad = `/club/${clubSlug}/scan-eigen`;
  // Ook verbergen op een ritchat-scherm: de FAB zou daar het
  // verstuur-knopje van de chat overlappen.
  const opChatscherm = pathname?.startsWith(`/club/${clubSlug}/rit/`) ?? false;
  const toonScanFab = pathname !== scanPad && !opChatscherm;

  return (
    <div className="min-h-dvh pb-20">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <div>
          <p className="text-xs text-gray-500">{clubNaam}</p>
          <p className="font-semibold text-gray-900">{gekozenTeam.team_naam}</p>
        </div>
        <button
          onClick={wisselTeam}
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100"
        >
          <Repeat className="h-3.5 w-3.5" /> Wissel team
        </button>
      </header>

      <BetaalverzoekBanner spelerId={spelerId} />

      <main>{children}</main>

      {toonScanFab && (
        <Link
          href={scanPad}
          aria-label="Scan eigen statiegeld"
          className="fixed bottom-20 right-4 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg shadow-brand-600/40 transition-transform active:scale-90"
        >
          <Camera className="h-6 w-6" />
        </Link>
      )}

      <BottomNav clubSlug={clubSlug} />
    </div>
  );
}
