"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { useTeam } from "@/components/team/TeamContext";
import { ReceiptScanner } from "@/components/team/ReceiptScanner";

interface ClaimItem {
  id: string;
  aantal_geschat: number;
  donateurs: { naam: string; adres: string };
}

export function BonnetjeUpload() {
  const { gekozenTeam, spelerId } = useTeam();
  const zoekParams = useSearchParams();
  const voorgeselecteerd = zoekParams.get("verzoek");

  const [items, setItems] = useState<ClaimItem[]>([]);
  const [geselecteerd, setGeselecteerd] = useState<string | null>(voorgeselecteerd);
  const [ladend, setLadend] = useState(true);

  const laadItems = useCallback(async () => {
    if (!gekozenTeam) return;
    const res = await fetch(`/api/ophaalverzoeken/mijn-team?team_id=${gekozenTeam.id}`);
    const json = await res.json();
    setItems(json.ophaalverzoeken ?? []);
    setLadend(false);
  }, [gekozenTeam]);

  useEffect(() => {
    laadItems();
  }, [laadItems]);

  if (geselecteerd && gekozenTeam) {
    return (
      <div className="mx-auto max-w-lg p-4">
        <ReceiptScanner
          ophaalverzoekId={geselecteerd}
          teamId={gekozenTeam.id}
          clubId={gekozenTeam.club_id}
          teamNaam={gekozenTeam.team_naam}
          spelerId={spelerId}
          onVoltooid={() => {
            setGeselecteerd(null);
            laadItems();
          }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-3 p-4">
      <h1 className="text-lg font-bold text-gray-900">Bonnetje uploaden</h1>
      <p className="text-sm text-gray-500">
        Kies het adres waarvoor je net statiegeld hebt ingeleverd bij de supermarkt.
      </p>

      {ladend && (
        <div className="flex justify-center py-10 text-gray-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}

      {!ladend && items.length === 0 && (
        <p className="py-10 text-center text-gray-500">
          Je hebt nog geen geclaimde adressen om een bonnetje voor te uploaden.
        </p>
      )}

      <div className="space-y-2">
        {items.map((item) => (
          <button key={item.id} onClick={() => setGeselecteerd(item.id)} className="block w-full text-left">
            <Card className="flex items-center justify-between p-3.5">
              <div>
                <p className="font-medium text-gray-900">{item.donateurs.naam}</p>
                <p className="text-sm text-gray-500">{item.donateurs.adres}</p>
              </div>
              <CheckCircle2 className="h-5 w-5 text-gray-300" />
            </Card>
          </button>
        ))}
      </div>
    </div>
  );
}
