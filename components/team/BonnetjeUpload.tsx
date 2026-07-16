"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Camera, CheckCircle2, Loader2, PartyPopper } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { useTeam } from "@/components/team/TeamContext";
import { formatEuro } from "@/lib/utils";

interface ClaimItem {
  id: string;
  aantal_geschat: number;
  donateurs: { naam: string; adres: string };
}

export function BonnetjeUpload() {
  const { gekozenTeam } = useTeam();
  const zoekParams = useSearchParams();
  const voorgeselecteerd = zoekParams.get("verzoek");
  const bestandInputRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<ClaimItem[]>([]);
  const [geselecteerd, setGeselecteerd] = useState<string | null>(voorgeselecteerd);
  const [ladend, setLadend] = useState(true);
  const [uploadBezig, setUploadBezig] = useState(false);
  const [resultaat, setResultaat] = useState<{ bedrag: number; punten: number } | null>(null);
  const [foutmelding, setFoutmelding] = useState<string | null>(null);

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

  async function upload(bestand: File) {
    if (!geselecteerd || !gekozenTeam) return;
    setUploadBezig(true);
    setFoutmelding(null);

    try {
      const supabase = createClient();
      const pad = `${gekozenTeam.club_id}/${gekozenTeam.id}/${Date.now()}-${bestand.name}`;
      const { error: uploadError } = await supabase.storage.from("bonnetjes").upload(pad, bestand);

      if (uploadError) {
        setFoutmelding("Uploaden van de foto is mislukt.");
        return;
      }

      const { data: publicUrl } = supabase.storage.from("bonnetjes").getPublicUrl(pad);

      const res = await fetch("/api/bonnetjes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ophaalverzoek_id: geselecteerd,
          team_id: gekozenTeam.id,
          foto_url: publicUrl.publicUrl,
          bestandsnaam: bestand.name,
          bestandsgrootte: bestand.size,
        }),
      });
      const json = await res.json();

      if (!res.ok) {
        setFoutmelding(json.error ?? "Kon bonnetje niet verwerken.");
        return;
      }

      setResultaat({ bedrag: json.bonnetje.bedrag_euro, punten: json.bonnetje.punten });
      setItems((prev) => prev.filter((i) => i.id !== geselecteerd));
    } finally {
      setUploadBezig(false);
    }
  }

  if (resultaat) {
    return (
      <div className="mx-auto max-w-lg p-4">
        <Card className="flex flex-col items-center gap-3 p-8 text-center">
          <PartyPopper className="h-12 w-12 text-brand-600" />
          <h2 className="text-xl font-bold text-gray-900">Bonnetje verwerkt!</h2>
          <p className="text-gray-600">
            <AnimatedNumber value={resultaat.bedrag} format={formatEuro} className="text-2xl font-extrabold text-brand-600" />
            <br />
            goed voor <AnimatedNumber value={resultaat.punten} className="font-bold" /> punten voor {gekozenTeam?.team_naam}.
          </p>
          <Button
            variant="secondary"
            onClick={() => {
              setResultaat(null);
              setGeselecteerd(null);
              laadItems();
            }}
          >
            Nog een bonnetje uploaden
          </Button>
        </Card>
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
            <Card
              className={`flex items-center justify-between p-3.5 ${
                geselecteerd === item.id ? "border-brand-500 ring-2 ring-brand-500/30" : ""
              }`}
            >
              <div>
                <p className="font-medium text-gray-900">{item.donateurs.naam}</p>
                <p className="text-sm text-gray-500">{item.donateurs.adres}</p>
              </div>
              {geselecteerd === item.id && <CheckCircle2 className="h-5 w-5 text-brand-600" />}
            </Card>
          </button>
        ))}
      </div>

      {foutmelding && <p className="text-sm text-red-600">{foutmelding}</p>}

      {geselecteerd && (
        <>
          <Button
            className="w-full"
            disabled={uploadBezig}
            type="button"
            onClick={() => bestandInputRef.current?.click()}
          >
            {uploadBezig ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
            Foto van bonnetje maken/kiezen
          </Button>
          <input
            ref={bestandInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            disabled={uploadBezig}
            onChange={(e) => {
              const bestand = e.target.files?.[0];
              if (bestand) upload(bestand);
              e.target.value = "";
            }}
          />
        </>
      )}
    </div>
  );
}
