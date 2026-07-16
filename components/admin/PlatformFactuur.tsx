"use client";

import { useState } from "react";
import { FileText, Loader2, Receipt } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { berekenPlatformFee, formatEuro, PLATFORM_FEE_PERCENTAGE } from "@/lib/utils";
import type { Factuur } from "@/lib/types";

function formatDatum(iso: string): string {
  return new Date(iso).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });
}

export function PlatformFactuur({
  clubSlug,
  initialFacturen,
  initialPeriodeStart,
  initialTotaal,
}: {
  clubSlug: string;
  initialFacturen: Factuur[];
  initialPeriodeStart: string;
  initialTotaal: number;
}) {
  const [facturen, setFacturen] = useState(initialFacturen);
  const [periodeStart, setPeriodeStart] = useState(initialPeriodeStart);
  const [totaal] = useState(initialTotaal);
  const [bezig, setBezig] = useState(false);
  const [foutmelding, setFoutmelding] = useState<string | null>(null);

  const platformFee = berekenPlatformFee(totaal);

  async function genereerFactuur() {
    setBezig(true);
    setFoutmelding(null);

    try {
      const res = await fetch(`/api/clubs/${clubSlug}/facturen`, { method: "POST" });
      const json = await res.json();

      if (!res.ok) {
        setFoutmelding(json.error ?? "Kon factuur niet genereren.");
        return;
      }

      const nieuweFactuur: Factuur = json.factuur;
      setFacturen((prev) => [nieuweFactuur, ...prev]);
      setPeriodeStart(nieuweFactuur.periode_eind);
    } finally {
      setBezig(false);
    }
  }

  return (
    <Card className="p-5">
      <h2 className="flex items-center gap-2 font-semibold text-gray-900">
        <Receipt className="h-4.5 w-4.5" /> Afrekening platform ({PLATFORM_FEE_PERCENTAGE}% software-fee)
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        Statieclub rekent {PLATFORM_FEE_PERCENTAGE}% over het totaalbedrag van uitsluitend de <strong>goedgekeurde</strong> scans.
        Afgekeurde scans en openstaande vlaggetjes tellen
        niet mee. Deze afrekening is onafhankelijk van het moment waarop leden het geld fysiek naar de
        clubkas overmaken.
      </p>

      <div className="mt-4 rounded-xl border border-gray-200 p-4">
        <p className="text-xs uppercase tracking-wide text-gray-400">
          Openstaande periode · sinds {formatDatum(periodeStart)}
        </p>
        <div className="mt-2 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500">Digitaal opgehaald (goedgekeurd)</p>
            <p className="text-xl font-bold text-gray-900">{formatEuro(totaal)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Platformkosten ({PLATFORM_FEE_PERCENTAGE}%)</p>
            <p className="text-xl font-bold text-brand-700">{formatEuro(platformFee)}</p>
          </div>
        </div>

        {foutmelding && <p className="mt-3 text-sm text-red-600">{foutmelding}</p>}

        <Button className="mt-4 w-full" disabled={bezig || totaal <= 0} onClick={genereerFactuur}>
          {bezig ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
          Genereer conceptfactuur
        </Button>
      </div>

      {facturen.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs uppercase tracking-wide text-gray-400">Factuurgeschiedenis</p>
          <div className="space-y-2">
            {facturen.map((f) => (
              <div key={f.id} className="flex items-center justify-between rounded-xl border border-gray-200 p-3 text-sm">
                <div>
                  <p className="font-medium text-gray-900">
                    {formatDatum(f.periode_start)} – {formatDatum(f.periode_eind)}
                  </p>
                  <p className="text-gray-500">
                    {formatEuro(f.totaal_goedgekeurd_bedrag)} goedgekeurd · fee {formatEuro(f.platform_fee_bedrag)}
                  </p>
                </div>
                <StatusBadge status={f.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
