"use client";

import { useState } from "react";
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
      <div>
        <h1 className="text-xl font-bold text-gray-900">Penningmeester-dashboard</h1>
        <p className="text-sm text-gray-500">{club.naam}</p>
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
