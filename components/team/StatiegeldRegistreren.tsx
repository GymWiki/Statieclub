"use client";

import { useRef, useState } from "react";
import { Camera, Check, ImageUp, Loader2, PiggyBank } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { formatEuro } from "@/lib/utils";
import type { Doel, StatiegeldInlevering } from "@/lib/types";

/**
 * Registreert een zelf ingeleverd statiegeldbonnetje in de Virtuele
 * Portemonnee. De foto is bewust optioneel (i.t.t. de Hybride OCR
 * Scanner) — dit is geen geverifieerde, direct-credit-flow, maar een
 * persoonlijke boekhouding die het clublid later zelf afrekent.
 *
 * `doelen` (actieve acties van de club): bij 0 of 1 geen picker nodig
 * (zelfde conventie als GlasNaarKasForm/OphaalForm) — het bonnetje
 * hangt dan aan het enige actieve doel, of aan geen enkel doel (telt
 * mee zodra de eerstvolgende actie sluit, migratie 0017).
 */
export function StatiegeldRegistreren({
  spelerId,
  clubId,
  doelen,
  onGeregistreerd,
}: {
  spelerId: string;
  clubId: string;
  doelen: Doel[];
  onGeregistreerd: (inlevering: StatiegeldInlevering) => void;
}) {
  const [bedragInput, setBedragInput] = useState("");
  const [doelId, setDoelId] = useState(doelen.length === 1 ? doelen[0].id : "");
  const [bestand, setBestand] = useState<File | null>(null);
  const [bezig, setBezig] = useState(false);
  const [foutmelding, setFoutmelding] = useState<string | null>(null);
  const [gelukt, setGelukt] = useState(false);
  const bestandInputRef = useRef<HTMLInputElement>(null);

  async function registreer() {
    const bedrag = parseFloat(bedragInput.replace(",", "."));
    if (!Number.isFinite(bedrag) || bedrag <= 0) {
      setFoutmelding("Vul een geldig bedrag in (bijv. 3,50).");
      return;
    }

    setBezig(true);
    setFoutmelding(null);

    try {
      let imageUrl: string | null = null;
      if (bestand) {
        const supabase = createClient();
        const pad = `${clubId}/${spelerId}/statiegeld-${Date.now()}-${bestand.name}`;
        const { error: uploadError } = await supabase.storage.from("bonnetjes").upload(pad, bestand);
        if (uploadError) {
          setFoutmelding("Uploaden van de foto is mislukt. Probeer het opnieuw.");
          setBezig(false);
          return;
        }
        const { data: publicUrl } = supabase.storage.from("bonnetjes").getPublicUrl(pad);
        imageUrl = publicUrl.publicUrl;
      }

      const res = await fetch("/api/statiegeld-inleveringen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          speler_id: spelerId,
          club_id: clubId,
          doel_id: doelId || null,
          bedrag,
          image_url: imageUrl,
        }),
      });
      const json = await res.json();

      if (!res.ok || !json.inlevering) {
        setFoutmelding(json.error ?? "Kon de inlevering niet opslaan.");
        setBezig(false);
        return;
      }

      onGeregistreerd(json.inlevering);
      setBedragInput("");
      setBestand(null);
      setGelukt(true);
      setTimeout(() => setGelukt(false), 2000);
    } catch {
      setFoutmelding("Kon geen verbinding maken. Probeer het opnieuw.");
    } finally {
      setBezig(false);
    }
  }

  return (
    <Card className="p-5">
      <h2 className="flex items-center gap-2 font-semibold text-gray-900">
        <PiggyBank className="h-4.5 w-4.5 text-brand-600" /> Bonnetje registreren
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        Zelf flessen ingeleverd bij de supermarkt? Zet het bedrag hier klaar — je rekent het later in één keer af.
      </p>

      <div className="mt-4 space-y-3">
        {doelen.length > 1 && (
          <div>
            <Label htmlFor="statiegeld-doel">Voor welke actie?</Label>
            <select
              id="statiegeld-doel"
              value={doelId}
              onChange={(e) => setDoelId(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="">Nog geen specifieke actie</option>
              {doelen.map((doel) => (
                <option key={doel.id} value={doel.id}>
                  {doel.titel}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <Label htmlFor="statiegeld-bedrag">Bedrag</Label>
          <Input
            id="statiegeld-bedrag"
            type="text"
            inputMode="decimal"
            value={bedragInput}
            onChange={(e) => setBedragInput(e.target.value)}
            placeholder="Bijv. 3,50"
          />
        </div>

        <div>
          <button
            type="button"
            onClick={() => bestandInputRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 px-4 py-3 text-sm font-medium text-gray-600 hover:border-gray-400 hover:bg-gray-50"
          >
            {bestand ? <ImageUp className="h-4 w-4 text-brand-600" /> : <Camera className="h-4 w-4" />}
            {bestand ? bestand.name : "Foto van bonnetje toevoegen (optioneel)"}
          </button>
          <input
            ref={bestandInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => setBestand(e.target.files?.[0] ?? null)}
          />
        </div>

        {foutmelding && <p className="text-sm text-red-600">{foutmelding}</p>}

        <Button className="w-full" onClick={registreer} disabled={bezig}>
          {bezig ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Opslaan…
            </>
          ) : gelukt ? (
            <>
              <Check className="h-4 w-4" /> Toegevoegd!
            </>
          ) : (
            "Toevoegen aan portemonnee"
          )}
        </Button>
        {bedragInput && Number.isFinite(parseFloat(bedragInput.replace(",", "."))) && (
          <p className="text-center text-xs text-gray-400">
            {formatEuro(parseFloat(bedragInput.replace(",", ".")))} wordt toegevoegd aan je openstaande saldo.
          </p>
        )}
      </div>
    </Card>
  );
}
