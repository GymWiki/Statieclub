"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  AlertTriangle,
  Camera,
  Check,
  Loader2,
  Pencil,
  RotateCcw,
  ScanLine,
  PartyPopper,
  ClockAlert,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { scanBonnetje } from "@/lib/ocr";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { Confetti } from "@/components/ui/Confetti";
import { NieuweBadgeToasts } from "@/components/ui/BadgeToast";
import { formatEuro } from "@/lib/utils";
import type { Badge, BonnetjeStatus } from "@/lib/types";

type Fase = "capture" | "verwerken" | "verifieren" | "opslaan" | "gelukt";

/**
 * Hybride OCR Bonnetjes Scanner.
 *
 * State-machine: capture -> verwerken (gesimuleerde client-side OCR,
 * zie lib/ocr.ts) -> verifieren (de gebruiker MOET het bedrag altijd
 * bevestigen of corrigeren — nooit een stille auto-submit) -> opslaan
 * -> gelukt. Dit houdt de (gesimuleerde) OCR-kosten op nul en
 * voorkomt scan-fouten in de administratie, doordat een mens altijd
 * het laatste woord heeft vóórdat er iets naar de database gaat.
 */
export function ReceiptScanner({
  ophaalverzoekId,
  teamId,
  clubId,
  teamNaam,
  spelerId,
  onVoltooid,
}: {
  /** Geen ophaalverzoekId -> directe inlevering zonder geclaimd adres ("Scan Eigen Statiegeld"). */
  ophaalverzoekId?: string;
  teamId: string;
  clubId: string;
  teamNaam: string;
  spelerId?: string;
  onVoltooid: () => void;
}) {
  const bestandInputRef = useRef<HTMLInputElement>(null);

  const [fase, setFase] = useState<Fase>("capture");
  const [bestand, setBestand] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [herkendBedrag, setHerkendBedrag] = useState<number | null>(null);
  const [bedragInput, setBedragInput] = useState("");
  const [bewerken, setBewerken] = useState(false);
  const [foutmelding, setFoutmelding] = useState<string | null>(null);
  const [resultaat, setResultaat] = useState<{
    bedrag: number;
    punten: number;
    status: BonnetjeStatus;
    nieuweBadges: Badge[];
  } | null>(null);

  // Ruim de object-URL van de preview netjes op zodra hij niet meer gebruikt wordt.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function kiesFoto(nieuwBestand: File) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);

    setBestand(nieuwBestand);
    setPreviewUrl(URL.createObjectURL(nieuwBestand));
    setFoutmelding(null);
    setFase("verwerken");
    verwerk(nieuwBestand);
  }

  async function verwerk(bestandOmTeScannen: File) {
    const { bedrag } = await scanBonnetje(bestandOmTeScannen);

    setHerkendBedrag(bedrag);
    setBedragInput(bedrag !== null ? bedrag.toFixed(2).replace(".", ",") : "");
    // Geen bedrag herkend (te wazige foto) -> direct het invoerveld
    // openen, foto blijft gewoon bewaard.
    setBewerken(bedrag === null);
    setFase("verifieren");
  }

  function opnieuwScannen() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setBestand(null);
    setPreviewUrl(null);
    setHerkendBedrag(null);
    setBedragInput("");
    setBewerken(false);
    setFoutmelding(null);
    setFase("capture");
  }

  async function claimPunten() {
    const bedragGetal = parseFloat(bedragInput.replace(",", "."));
    if (!Number.isFinite(bedragGetal) || bedragGetal <= 0) {
      setFoutmelding("Vul een geldig bedrag in (bijv. 7,50).");
      return;
    }
    if (!bestand) return;

    setFoutmelding(null);
    setFase("opslaan");

    try {
      const supabase = createClient();
      const pad = `${clubId}/${teamId}/${Date.now()}-${bestand.name}`;
      const { error: uploadError } = await supabase.storage.from("bonnetjes").upload(pad, bestand);

      if (uploadError) {
        setFoutmelding("Uploaden van de foto is mislukt. Probeer het opnieuw.");
        setFase("verifieren");
        return;
      }

      const { data: publicUrl } = supabase.storage.from("bonnetjes").getPublicUrl(pad);

      const res = await fetch("/api/bonnetjes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ophaalverzoek_id: ophaalverzoekId ?? null,
          team_id: teamId,
          speler_id: spelerId ?? null,
          foto_url: publicUrl.publicUrl,
          bedrag_euro: Math.round(bedragGetal * 100) / 100,
        }),
      });
      const json = await res.json();

      if (!res.ok) {
        setFoutmelding(json.error ?? "Kon bonnetje niet verwerken.");
        setFase("verifieren");
        return;
      }

      setResultaat({
        bedrag: json.bonnetje.bedrag_euro,
        punten: json.bonnetje.punten,
        status: json.bonnetje.status,
        nieuweBadges: json.nieuweBadges ?? [],
      });
      setFase("gelukt");
    } catch {
      setFoutmelding("Kon geen verbinding maken. Probeer het opnieuw.");
      setFase("verifieren");
    }
  }

  // ─── Capture ──────────────────────────────────────────────────
  if (fase === "capture") {
    return (
      <Card className="flex flex-col items-center gap-4 p-8 text-center">
        <ScanLine className="h-12 w-12 text-brand-600" />
        <div>
          <h2 className="font-semibold text-gray-900">Bonnetje scannen</h2>
          <p className="mt-1 text-sm text-gray-500">
            Maak een foto van je statiegeldbonnetje. We lezen het bedrag automatisch — jij bevestigt het.
          </p>
        </div>
        <Button className="w-full" onClick={() => bestandInputRef.current?.click()}>
          <Camera className="h-5 w-5" /> Foto maken/kiezen
        </Button>
        <input
          ref={bestandInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const nieuwBestand = e.target.files?.[0];
            if (nieuwBestand) kiesFoto(nieuwBestand);
            e.target.value = "";
          }}
        />
      </Card>
    );
  }

  // ─── Verwerken (processing) ──────────────────────────────────
  if (fase === "verwerken") {
    return (
      <Card className="flex flex-col items-center gap-4 p-8 text-center">
        {previewUrl && (
          <div className="relative h-40 w-32 overflow-hidden rounded-lg border border-gray-200">
            <Image src={previewUrl} alt="Bonnetje" fill className="object-cover" unoptimized />
          </div>
        )}
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        <p className="font-medium text-gray-700">Bonnetje analyseren…</p>
      </Card>
    );
  }

  // ─── Opslaan ──────────────────────────────────────────────────
  if (fase === "opslaan") {
    return (
      <Card className="flex flex-col items-center gap-4 p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        <p className="font-medium text-gray-700">Bonnetje opslaan…</p>
      </Card>
    );
  }

  // ─── Gelukt (success) ─────────────────────────────────────────
  if (fase === "gelukt" && resultaat) {
    const wachtOpControle = resultaat.status === "in_afwachting_controle";

    return (
      <Card className="relative flex flex-col items-center gap-3 overflow-hidden p-8 text-center">
        {!wachtOpControle && <Confetti />}
        {resultaat.nieuweBadges.length > 0 && <NieuweBadgeToasts badges={resultaat.nieuweBadges} />}
        {wachtOpControle ? (
          <>
            <ClockAlert className="h-12 w-12 text-amber-500" />
            <h2 className="text-xl font-bold text-gray-900">Bonnetje wordt gecontroleerd</h2>
            <p className="text-gray-600">
              Gescand bedrag: <span className="font-bold text-gray-900">{formatEuro(resultaat.bedrag)}</span>.
              <br />
              Het bestuur controleert dit bedrag voordat de punten meetellen op het scorebord.
            </p>
          </>
        ) : (
          <>
            <PartyPopper className="h-12 w-12 text-brand-600" />
            <h2 className="text-xl font-bold text-gray-900">Bonnetje verwerkt!</h2>
            <p className="text-gray-600">
              <AnimatedNumber value={resultaat.bedrag} format={formatEuro} className="text-2xl font-extrabold text-brand-600" />
              <br />
              goed voor <AnimatedNumber value={resultaat.punten} className="font-bold" /> punten voor {teamNaam}.
            </p>
          </>
        )}
        <Button variant="secondary" onClick={onVoltooid}>
          Volgend bonnetje scannen
        </Button>
      </Card>
    );
  }

  // ─── Verifiëren (de belangrijkste stap) ──────────────────────
  return (
    <Card className="space-y-4 p-6">
      <div className="flex items-start gap-4">
        {previewUrl && (
          <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-lg border border-gray-200">
            <Image src={previewUrl} alt="Bonnetje" fill className="object-cover" unoptimized />
          </div>
        )}
        <div className="min-w-0 flex-1">
          {herkendBedrag === null ? (
            <p className="flex items-start gap-1.5 text-sm text-amber-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              We konden geen bedrag herkennen op deze foto. Vul het zelf in.
            </p>
          ) : (
            <p className="text-sm text-gray-500">Wij lazen:</p>
          )}

          {bewerken ? (
            <div className="mt-1 flex items-center gap-1 text-2xl font-extrabold text-gray-900">
              <span>€</span>
              <Input
                type="text"
                inputMode="decimal"
                autoFocus
                placeholder="0,00"
                value={bedragInput}
                onChange={(e) => setBedragInput(e.target.value)}
                className="w-32 py-1.5 text-2xl font-extrabold"
              />
            </div>
          ) : (
            <p className="text-2xl font-extrabold text-gray-900">{formatEuro(herkendBedrag as number)}</p>
          )}
        </div>
      </div>

      {foutmelding && <p className="text-sm text-red-600">{foutmelding}</p>}

      <div className="space-y-2">
        {bewerken ? (
          <Button className="w-full" onClick={claimPunten} disabled={!bedragInput}>
            <Check className="h-4 w-4" /> Punten claimen
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button className="flex-1" onClick={claimPunten}>
              <Check className="h-4 w-4" /> Ja, klopt!
            </Button>
            <Button variant="secondary" className="flex-1" onClick={() => setBewerken(true)}>
              <Pencil className="h-4 w-4" /> Pas aan
            </Button>
          </div>
        )}

        <Button variant="ghost" className="w-full" onClick={opnieuwScannen}>
          <RotateCcw className="h-4 w-4" /> Opnieuw scannen
        </Button>
      </div>
    </Card>
  );
}
