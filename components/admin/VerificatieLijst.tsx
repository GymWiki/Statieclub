"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, X, Loader2, ReceiptText } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatEuro } from "@/lib/utils";

export interface TeVerifierenBonnetje {
  id: string;
  foto_url: string;
  bedrag_euro: number;
  punten: number;
  created_at: string;
  team_naam: string;
}

export function VerificatieLijst({
  bonnetjes,
  onVerwerkt,
}: {
  bonnetjes: TeVerifierenBonnetje[];
  onVerwerkt: (id: string) => void;
}) {
  const [bezig, setBezig] = useState<string | null>(null);
  const [foutmelding, setFoutmelding] = useState<string | null>(null);

  async function verifieer(id: string, status: "goedgekeurd" | "afgekeurd") {
    setBezig(id);
    setFoutmelding(null);

    try {
      const res = await fetch(`/api/bonnetjes/${id}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();

      if (!res.ok) {
        setFoutmelding(json.error ?? "Kon bonnetje niet bijwerken.");
        return;
      }

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
        Keur goed zodra het fysieke statiegeld daadwerkelijk is ontvangen.
      </p>

      {foutmelding && <p className="mt-3 text-sm text-red-600">{foutmelding}</p>}

      <div className="mt-4 space-y-2">
        {bonnetjes.length === 0 && (
          <p className="py-6 text-center text-sm text-gray-400">Niets om te verifiëren — helemaal bij.</p>
        )}

        {bonnetjes.map((b) => (
          <div key={b.id} className="flex items-center gap-3 rounded-xl border border-gray-200 p-3">
            <a href={b.foto_url} target="_blank" rel="noreferrer" className="relative block h-14 w-14 shrink-0">
              <Image
                src={b.foto_url}
                alt="Bonnetje"
                fill
                sizes="56px"
                className="rounded-lg border border-gray-200 object-cover"
              />
            </a>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-gray-900">{b.team_naam}</p>
              <p className="text-sm text-gray-500">{formatEuro(b.bedrag_euro)} · {b.punten} punten</p>
            </div>
            <div className="flex shrink-0 gap-1.5">
              <Button
                size="sm"
                variant="secondary"
                disabled={bezig === b.id}
                onClick={() => verifieer(b.id, "afgekeurd")}
                aria-label="Afkeuren"
              >
                {bezig === b.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4 text-red-600" />}
              </Button>
              <Button
                size="sm"
                disabled={bezig === b.id}
                onClick={() => verifieer(b.id, "goedgekeurd")}
                aria-label="Goedkeuren"
              >
                {bezig === b.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
