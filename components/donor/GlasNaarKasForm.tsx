"use client";

import { FormEvent, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2, PenLine, Smartphone, Wine } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { laadDonorProfiel, bewaarDonorProfiel } from "@/lib/donorProfile";
import {
  cn,
  formatEuro,
  GLAS_NAAR_KAS_MINIMUM_EURO,
  GLAS_NAAR_KAS_OPTIES,
  TRANSACTIEKOSTEN_EURO,
} from "@/lib/utils";
import type { Doel } from "@/lib/types";

type Stap = "gegevens" | "bedrag" | "starten" | "fout";

/**
 * "Glas-naar-Kas": een vooraf betaalde donatie (geen bonnetje-scan) om
 * oud papier/glas te laten weggooien. De betaling loopt via een échte
 * Stripe Checkout-sessie (iDeal) — de browser wordt na "Doneer"
 * volledig doorgestuurd naar Stripe's hosted betaalpagina; deze
 * component doet zelf geen betaalstap meer na. Het ophaalverzoek
 * ontstaat pas server-side, ná bevestigde betaling (zie
 * /api/stripe/webhook), dus deze flow eindigt hier altijd met een
 * redirect, nooit met een lokale "verzonden"-state.
 */
export function GlasNaarKasForm({
  clubId,
  clubNaam,
  doelen,
  onTerug,
}: {
  clubId: string;
  clubNaam: string;
  doelen: Doel[];
  onTerug: () => void;
}) {
  const [naam, setNaam] = useState("");
  const [email, setEmail] = useState("");
  const [adres, setAdres] = useState("");
  const [postcode, setPostcode] = useState("");
  const [telefoonnummer, setTelefoonnummer] = useState("");
  const [opmerking, setOpmerking] = useState("");
  const [doelId, setDoelId] = useState(doelen[0]?.id ?? "");
  const [bekendeDonateur, setBekendeDonateur] = useState(false);

  const [bedrag, setBedrag] = useState<number | null>(null);
  const [aangepastGekozen, setAangepastGekozen] = useState(false);
  const [aangepastBedragInput, setAangepastBedragInput] = useState("");
  const [coversFee, setCoversFee] = useState(true);
  const [stap, setStap] = useState<Stap>("gegevens");
  const [foutmelding, setFoutmelding] = useState<string | null>(null);

  const totaalTeBetalen = bedrag !== null ? Math.round((bedrag + (coversFee ? TRANSACTIEKOSTEN_EURO : 0)) * 100) / 100 : null;

  useEffect(() => {
    const profiel = laadDonorProfiel();
    if (profiel) {
      setNaam(profiel.naam);
      setEmail(profiel.email);
      setAdres(profiel.adres);
      setPostcode(profiel.postcode);
      setTelefoonnummer(profiel.telefoonnummer ?? "");
      setBekendeDonateur(true);
    }
  }, []);

  function naarBedrag(e: FormEvent) {
    e.preventDefault();
    setStap("bedrag");
  }

  function kiesPreset(waarde: number) {
    setAangepastGekozen(false);
    setAangepastBedragInput("");
    setBedrag(waarde);
  }

  function kiesAangepastBedrag() {
    setAangepastGekozen(true);
    setBedrag(null);
  }

  function wijzigAangepastBedrag(waarde: string) {
    setAangepastBedragInput(waarde);
    const getal = parseFloat(waarde.replace(",", "."));
    setBedrag(
      Number.isFinite(getal) && getal >= GLAS_NAAR_KAS_MINIMUM_EURO ? Math.round(getal * 100) / 100 : null
    );
  }

  async function starteBetaling() {
    if (!bedrag) return;
    setStap("starten");
    setFoutmelding(null);

    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "donation",
          naam,
          email,
          adres,
          postcode,
          telefoonnummer,
          club_id: clubId,
          doel_id: doelId,
          bedrag,
          coversFee,
          opmerking,
        }),
      });
      const json = await res.json();

      if (!res.ok || !json.checkoutUrl) {
        setFoutmelding(json.error ?? "Kon de betaling niet starten. Probeer het opnieuw.");
        setStap("fout");
        return;
      }

      bewaarDonorProfiel({ naam, email, adres, postcode, telefoonnummer });
      window.location.href = json.checkoutUrl;
    } catch {
      setFoutmelding("Kon geen verbinding maken. Probeer het opnieuw.");
      setStap("fout");
    }
  }

  return (
    <Card className="overflow-hidden p-6">
      <button
        onClick={stap === "gegevens" ? onTerug : () => setStap("gegevens")}
        className="mb-4 flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" /> Terug
      </button>

      <AnimatePresence mode="wait">
        {stap === "gegevens" && (
          <motion.div key="gegevens" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
            <div className="mb-4 flex items-center gap-2">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-700">
                <Wine className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Glas-naar-Kas</h2>
                <p className="text-xs text-gray-500">Vul je gegevens in, daarna kies je een donatiebedrag.</p>
              </div>
            </div>

            {bekendeDonateur && (
              <p className="mb-4 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">
                Welkom terug! Je gegevens zijn alvast ingevuld.
              </p>
            )}

            <form onSubmit={naarBedrag} className="space-y-4">
              {doelen.length > 1 && (
                <div>
                  <Label htmlFor="glas-doel">Welk doel wil je steunen?</Label>
                  <select
                    id="glas-doel"
                    required
                    value={doelId}
                    onChange={(e) => setDoelId(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  >
                    {doelen.map((doel) => (
                      <option key={doel.id} value={doel.id}>
                        {doel.titel}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <Label htmlFor="glas-naam">Naam</Label>
                <Input id="glas-naam" required value={naam} onChange={(e) => setNaam(e.target.value)} placeholder="Voor- en achternaam" />
              </div>
              <div>
                <Label htmlFor="glas-email">E-mailadres</Label>
                <Input id="glas-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jij@voorbeeld.nl" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <Label htmlFor="glas-adres">Adres</Label>
                  <Input id="glas-adres" required value={adres} onChange={(e) => setAdres(e.target.value)} placeholder="Straat + huisnummer" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label htmlFor="glas-postcode">Postcode</Label>
                  <Input id="glas-postcode" required value={postcode} onChange={(e) => setPostcode(e.target.value)} placeholder="1234 AB" />
                </div>
              </div>
              <div>
                <Label htmlFor="glas-telefoon">Telefoonnummer (optioneel)</Label>
                <Input id="glas-telefoon" value={telefoonnummer} onChange={(e) => setTelefoonnummer(e.target.value)} placeholder="06 12345678" />
              </div>
              <div>
                <Label htmlFor="glas-opmerking">Opmerking (optioneel)</Label>
                <Input
                  id="glas-opmerking"
                  value={opmerking}
                  onChange={(e) => setOpmerking(e.target.value)}
                  placeholder="Bijv. de glasbak staat bij de schuur"
                />
              </div>

              <Button type="submit" size="lg" className="w-full">
                Volgende: donatiebedrag kiezen
              </Button>
            </form>
          </motion.div>
        )}

        {stap === "bedrag" && (
          <motion.div key="bedrag" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
            <h2 className="font-bold text-gray-900">Kies je donatie</h2>
            <p className="mt-1 text-sm text-gray-500">
              Dit bedrag gaat naar de clubkas van {clubNaam} — een team ruimt jouw glas/papier voor je op.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2.5">
              {GLAS_NAAR_KAS_OPTIES.map((optie) => (
                <button
                  key={optie.bedrag}
                  onClick={() => kiesPreset(optie.bedrag)}
                  className={cn(
                    "rounded-2xl border-2 p-4 text-center transition-colors",
                    !aangepastGekozen && bedrag === optie.bedrag
                      ? "border-violet-500 bg-violet-50"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <p className="text-xl font-extrabold text-gray-900">{formatEuro(optie.bedrag)}</p>
                  <p className="mt-0.5 text-xs font-medium text-gray-500">{optie.label}</p>
                </button>
              ))}
              <button
                onClick={kiesAangepastBedrag}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 rounded-2xl border-2 p-4 text-center transition-colors",
                  aangepastGekozen ? "border-violet-500 bg-violet-50" : "border-gray-200 hover:border-gray-300"
                )}
              >
                <PenLine className="h-4 w-4 text-gray-500" />
                <p className="text-xs font-medium text-gray-500">Ander bedrag</p>
              </button>
            </div>

            {aangepastGekozen && (
              <div className="mt-3">
                <Label htmlFor="glas-aangepast-bedrag">Jouw bedrag (minimaal {formatEuro(GLAS_NAAR_KAS_MINIMUM_EURO)})</Label>
                <Input
                  id="glas-aangepast-bedrag"
                  type="number"
                  min={GLAS_NAAR_KAS_MINIMUM_EURO}
                  step="0.5"
                  inputMode="decimal"
                  autoFocus
                  value={aangepastBedragInput}
                  onChange={(e) => wijzigAangepastBedrag(e.target.value)}
                  placeholder={`Bijv. ${GLAS_NAAR_KAS_MINIMUM_EURO}`}
                />
              </div>
            )}

            <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3.5">
              <input
                type="checkbox"
                checked={coversFee}
                onChange={(e) => setCoversFee(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-violet-600 focus:ring-violet-500/30"
              />
              <span className="text-sm text-gray-700">
                Ik betaal de transactiekosten ({formatEuro(TRANSACTIEKOSTEN_EURO)}), zodat de club 100% van mijn
                donatie ontvangt.
              </span>
            </label>

            <Button className="mt-5 w-full" size="lg" disabled={!bedrag} onClick={starteBetaling}>
              <Smartphone className="h-4 w-4" />
              {totaalTeBetalen ? `Doneer ${formatEuro(totaalTeBetalen)} via iDeal` : "Kies eerst een bedrag"}
            </Button>
          </motion.div>
        )}

        {stap === "starten" && (
          <motion.div key="starten" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-3 py-10">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            <p className="text-sm text-gray-500">Je wordt doorgestuurd naar Stripe om te betalen…</p>
          </motion.div>
        )}

        {stap === "fout" && (
          <motion.div key="fout" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <p className="text-sm text-red-600">{foutmelding}</p>
            <Button className="w-full" onClick={() => setStap("bedrag")}>
              Opnieuw proberen
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
