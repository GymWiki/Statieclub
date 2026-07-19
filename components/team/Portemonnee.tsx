"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useTeam } from "@/components/team/TeamContext";
import { StatiegeldRegistreren } from "@/components/team/StatiegeldRegistreren";
import { StatiegeldSaldo } from "@/components/team/StatiegeldSaldo";
import type { StatiegeldInlevering } from "@/lib/types";

/**
 * Virtuele Portemonnee: een clublid dat zelf flessen inlevert bij de
 * supermarkt spaart hier het bedrag op (i.p.v. het meteen af te
 * dragen) en rekent het pas af zodra het de €20-drempel haalt — zie
 * migratie 0016 voor waarom dit een ander mechanisme is dan "Scan
 * Eigen Statiegeld".
 */
export function Portemonnee() {
  const { gekozenTeam, spelerId } = useTeam();
  const searchParams = useSearchParams();
  const betalingGelukt = searchParams.get("betaling") === "gelukt";

  const [inleveringen, setInleveringen] = useState<StatiegeldInlevering[]>([]);
  const [ladend, setLadend] = useState(true);

  const laadInleveringen = useCallback(async () => {
    if (!spelerId) return;
    const res = await fetch(`/api/statiegeld-inleveringen?speler_id=${spelerId}`);
    if (res.ok) {
      const json = await res.json();
      setInleveringen(json.inleveringen ?? []);
    }
    setLadend(false);
  }, [spelerId]);

  useEffect(() => {
    laadInleveringen();
  }, [laadInleveringen]);

  // Na een geslaagde afrekening moet de webhook nog de rijen op 'paid'
  // zetten — dat gebeurt meestal binnen een seconde, maar niet
  // gegarandeerd vóór de browser terug is. Ververs daarom kort nog een
  // paar keer op de achtergrond, zodat het saldo niet blijft
  // hangen op het oude (nog niet afgerekende) bedrag.
  useEffect(() => {
    if (!betalingGelukt) return;
    let pogingen = 0;
    const interval = setInterval(() => {
      pogingen += 1;
      laadInleveringen();
      if (pogingen >= 5) clearInterval(interval);
    }, 1500);
    return () => clearInterval(interval);
  }, [betalingGelukt, laadInleveringen]);

  if (!gekozenTeam) return null;

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <div>
        <h1 className="text-lg font-bold text-gray-900">Mijn portemonnee</h1>
        <p className="text-sm text-gray-500">Spaar je eigen statiegeld op en reken het gebundeld af.</p>
      </div>

      {betalingGelukt && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> Betaling gelukt — je saldo is bijgewerkt.
        </div>
      )}

      {ladend ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          <StatiegeldSaldo spelerId={spelerId} inleveringen={inleveringen} />
          <StatiegeldRegistreren
            spelerId={spelerId}
            clubId={gekozenTeam.club_id}
            onGeregistreerd={(nieuw) => setInleveringen((prev) => [nieuw, ...prev])}
          />
        </>
      )}
    </div>
  );
}
