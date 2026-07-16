"use client";

import { useMemo, useState } from "react";
import { PartyPopper, Copy, MessageCircleMore, Check } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatEuro } from "@/lib/utils";
import type { TeVerifierenBonnetje } from "@/components/admin/VerificatieLijst";

export function CampagneAfronden({
  clubNaam,
  bonnetjes,
}: {
  clubNaam: string;
  bonnetjes: TeVerifierenBonnetje[];
}) {
  const [gekopieerd, setGekopieerd] = useState<string | null>(null);

  const perTeam = useMemo(() => {
    const totalen = new Map<string, number>();
    for (const b of bonnetjes) {
      totalen.set(b.team_naam, (totalen.get(b.team_naam) ?? 0) + b.bedrag_euro);
    }
    return Array.from(totalen.entries()).map(([team_naam, openstaand]) => ({ team_naam, openstaand }));
  }, [bonnetjes]);

  function berichtVoor(teamNaam: string, bedrag: number) {
    return `Hoi ${teamNaam}! 🏆 Jullie hebben voor ${clubNaam} €${bedrag.toFixed(
      2
    )} aan statiegeld opgehaald dat nog niet fysiek is afgerekend. Maak dit bedrag over via Tikkie/WhatsApp naar de clubkas, zodat we de actie kunnen afronden. Bedankt voor jullie inzet! 💪`;
  }

  async function kopieer(teamNaam: string, tekst: string) {
    await navigator.clipboard.writeText(tekst);
    setGekopieerd(teamNaam);
    setTimeout(() => setGekopieerd(null), 1500);
  }

  return (
    <Card className="p-5">
      <h2 className="flex items-center gap-2 font-semibold text-gray-900">
        <PartyPopper className="h-4.5 w-4.5" /> Campagne afronden
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        Nog niet verifieerde bedragen per team — stuur een betaalherinnering via WhatsApp of Tikkie.
      </p>

      <div className="mt-4 space-y-2">
        {perTeam.length === 0 && (
          <p className="py-6 text-center text-sm text-gray-400">Alles is al verifieerd — niets openstaand.</p>
        )}

        {perTeam.map(({ team_naam, openstaand }) => {
          const tekst = berichtVoor(team_naam, openstaand);
          const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(tekst)}`;

          return (
            <div key={team_naam} className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 p-3">
              <div>
                <p className="font-medium text-gray-900">{team_naam}</p>
                <p className="text-sm text-gray-500">{formatEuro(openstaand)} openstaand</p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <Button size="sm" variant="secondary" onClick={() => kopieer(team_naam, tekst)}>
                  {gekopieerd === team_naam ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <a href={whatsappUrl} target="_blank" rel="noreferrer">
                  <Button size="sm">
                    <MessageCircleMore className="h-4 w-4" /> WhatsApp
                  </Button>
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
