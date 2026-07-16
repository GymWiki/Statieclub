"use client";

import Link from "next/link";
import { useState } from "react";
import { Users } from "lucide-react";
import { SaldoOverzicht } from "@/components/admin/SaldoOverzicht";
import { VerificatieLijst, type TeVerifierenBonnetje } from "@/components/admin/VerificatieLijst";
import { CampagneAfronden } from "@/components/admin/CampagneAfronden";
import { PlatformFactuur } from "@/components/admin/PlatformFactuur";
import type { Club, Factuur, Team } from "@/lib/types";

export function PenningmeesterPaneel({
  club,
  teams,
  initialBonnetjes,
  initialFacturen,
  huidigePeriode,
}: {
  club: Club;
  teams: Team[];
  initialBonnetjes: TeVerifierenBonnetje[];
  initialFacturen: Factuur[];
  huidigePeriode: { periodeStart: string; totaal: number };
}) {
  const [bonnetjes, setBonnetjes] = useState(initialBonnetjes);

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Clubbeheer</h1>
          <p className="text-sm text-gray-500">{club.naam}</p>
        </div>
        <Link
          href="/admin"
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100"
        >
          <Users className="h-3.5 w-3.5" /> Mijn clubs
        </Link>
      </div>

      <SaldoOverzicht club={club} initialTeams={teams} />
      <VerificatieLijst
        bonnetjes={bonnetjes}
        onVerwerkt={(id) => setBonnetjes((prev) => prev.filter((b) => b.id !== id))}
      />
      <CampagneAfronden clubNaam={club.naam} teams={teams} />
      <PlatformFactuur
        clubSlug={club.slug}
        initialFacturen={initialFacturen}
        initialPeriodeStart={huidigePeriode.periodeStart}
        initialTotaal={huidigePeriode.totaal}
      />
    </div>
  );
}
