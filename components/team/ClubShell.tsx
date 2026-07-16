"use client";

import { Repeat } from "lucide-react";
import { useTeam } from "@/components/team/TeamContext";
import { TeamKiezer } from "@/components/team/TeamKiezer";
import { BottomNav } from "@/components/team/BottomNav";

export function ClubShell({
  clubSlug,
  clubNaam,
  children,
}: {
  clubSlug: string;
  clubNaam: string;
  children: React.ReactNode;
}) {
  const { gekozenTeam, wisselTeam } = useTeam();

  if (!gekozenTeam) {
    return <TeamKiezer clubNaam={clubNaam} />;
  }

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

      <main>{children}</main>

      <BottomNav clubSlug={clubSlug} />
    </div>
  );
}
