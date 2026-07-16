"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, X, Loader2, ReceiptText, Pencil, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatEuro } from "@/lib/utils";

export interface TeVerifierenBonnetje {
  id: string;
  foto_url: string;
  bedrag_euro: number;
  punten: number;
  created_at: string;
  team_naam: string;
  flag_reden: string | null;
}

type Actie = "goedkeuren" | "afkeuren" | "overschrijven";

export function VerificatieLijst({
  bonnetjes,
  onVerwerkt,
}: {
  bonnetjes: TeVerifierenBonnetje[];
  onVerwerkt: (id: string) => void;
}) {
  const [bezig, setBezig] = useState<string | null>(null);
  const [foutmelding, setFoutmelding] = useState<string | null>(null);
  const [overschrijvenId, setOverschrijvenId] = useState<string | null>(null);
  const [nieuwBedrag, setNieuwBedrag] = useState("");

  async function verwerk(id: string, actie: Actie, bedrag?: string) {
    setBezig(id);
    setFoutmelding(null);

    try {
      const res = await fetch(`/api/bonnetjes/${id}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actie,
          ...(actie === "overschrijven" ? { nieuwBedrag: Number(bedrag) } : {}),
        }),
      });
      const json = await res.json();

      if (!res.ok) {
        setFoutmelding(json.error ?? "Kon bonnetje niet bijwerken.");
        return;
      }

      setOverschrijvenId(null);
      setNieuwBedrag("");
      onVerwerkt(id);
    } finally {
      setBezig(null);
    }
  }

  return (
    <Card className="p-5">
      <h2 className="flex items-center gap-2 font-semibold text-gray-900">
        <ReceiptText className="h-4.5 w-4.5" /> Te verifiëren bonnetjes
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        Deze bonnetjes zijn geflagd door de anomaly detection en tellen nog niet mee op het leaderboard.
      </p>

      {foutmelding && <p className="mt-3 text-sm text-red-600">{foutmelding}</p>}

      <div className="mt-4 space-y-3">
        {bonnetjes.length === 0 && (
          <p className="py-6 text-center text-sm text-gray-400">Niets om te verifiëren — helemaal bij.</p>
        )}

        {bonnetjes.map((b) => (
          <div key={b.id} className="space-y-3 rounded-xl border border-gray-200 p-3">
            <div className="flex items-start gap-3">
              <a href={b.foto_url} target="_blank" rel="noreferrer" className="relative block h-24 w-20 shrink-0">
                <Image
                  src={b.foto_url}
                  alt="Bonnetje"
                  fill
                  sizes="80px"
                  className="rounded-lg border border-gray-200 object-cover"
                />
              </a>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900">{b.team_naam}</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatEuro(b.bedrag_euro)} <span className="text-sm font-normal text-gray-500">· {b.punten} punten</span>
                </p>
                {b.flag_reden && (
                  <p className="mt-1 flex items-start gap-1 text-xs text-amber-700">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {b.flag_reden}
                  </p>
                )}
              </div>
            </div>

            {overschrijvenId === b.id ? (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0.01}
                  step={0.01}
                  autoFocus
                  placeholder="Correct bedrag in €"
                  value={nieuwBedrag}
                  onChange={(e) => setNieuwBedrag(e.target.value)}
                  className="py-2"
                />
                <Button
                  size="sm"
                  disabled={bezig === b.id || !nieuwBedrag}
                  onClick={() => verwerk(b.id, "overschrijven", nieuwBedrag)}
                >
                  {bezig === b.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Bevestig"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setOverschrijvenId(null)}>
                  Annuleer
                </Button>
              </div>
            ) : (
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  variant="secondary"
                  className="flex-1"
                  disabled={bezig === b.id}
                  onClick={() => verwerk(b.id, "afkeuren")}
                >
                  {bezig === b.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4 text-red-600" />}
                  Afkeuren
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="flex-1"
                  disabled={bezig === b.id}
                  onClick={() => {
                    setOverschrijvenId(b.id);
                    setNieuwBedrag(String(b.bedrag_euro));
                  }}
                >
                  <Pencil className="h-4 w-4" /> Overschrijven
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  disabled={bezig === b.id}
                  onClick={() => verwerk(b.id, "goedkeuren")}
                >
                  {bezig === b.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Goedkeuren
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
