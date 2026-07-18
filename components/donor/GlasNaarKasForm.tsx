"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  MessageCircleMore,
  Smartphone,
  Wine,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { laadDonorProfiel, bewaarDonorProfiel } from "@/lib/donorProfile";
import { cn, formatEuro, GLAS_NAAR_KAS_OPTIES } from "@/lib/utils";
import type { Doel } from "@/lib/types";

type Stap = "gegevens" | "bedrag" | "betalen-bevestig" | "betalen-bezig" | "betalen-gelukt" | "versturen" | "verzonden" | "fout";

/**
 * "Glas-naar-Kas": een vooraf betaalde donatie (geen bonnetje-scan) om
 * oud papier/glas te laten weggooien. De betaalstap is bewust en
 * duidelijk gelabeld als DEMO/simulatie — er is geen echte iDeal/
 * Tikkie-integratie, alleen een nagebootste flow zodat de rest van de
 * app (vooraf_betaald, credit-triggers) getest kan worden.
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
  const [stap, setStap] = useState<Stap>("gegevens");
  const [foutmelding, setFoutmelding] = useState<string | null>(null);
  const [ophaalverzoekId, setOphaalverzoekId] = useState<string | null>(null);

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

  function startBetaling() {
    setStap("betalen-bevestig");
  }

  function bevestigBetaling() {
    setStap("betalen-bezig");
  }

  // Gesimuleerde betaalstap: geen echte betaalprovider, enkel een
  // nagebootste "onderweg naar de bank"-vertraging zodat het voelt als
  // een échte redirect vóórdat het verzoek definitief geplaatst wordt.
  useEffect(() => {
    if (stap !== "betalen-bezig") return;
    const timeout = setTimeout(() => setStap("betalen-gelukt"), 1600);
    return () => clearTimeout(timeout);
  }, [stap]);

  async function plaatsVerzoek() {
    if (!bedrag) return;
    setStap("versturen");
    setFoutmelding(null);

    try {
      const res = await fetch("/api/ophaalverzoeken", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          naam,
          email,
          adres,
          postcode,
          telefoonnummer,
          club_id: clubId,
          doel_id: doelId,
          type: "glasbak",
          donatie_bedrag: bedrag,
          opmerking,
        }),
      });
      const json = await res.json();

      if (!res.ok) {
        setFoutmelding(json.error ?? "Er ging iets mis, probeer het opnieuw.");
        setStap("fout");
        return;
      }

      bewaarDonorProfiel(json.donateurProfiel);
      setOphaalverzoekId(json.ophaalverzoek.id);
      setStap("verzonden");
    } catch {
      setFoutmelding("Kon geen verbinding maken. Probeer het opnieuw.");
      setStap("fout");
    }
  }

  if (stap === "verzonden") {
    return (
      <Card className="flex flex-col items-center gap-3 p-8 text-center">
        <CheckCircle2 className="h-12 w-12 text-brand-600" />
        <h2 className="text-xl font-bold text-gray-900">Bedankt namens {clubNaam}!</h2>
        <p className="text-gray-600">
          Je donatie van {bedrag && formatEuro(bedrag)} staat klaar — een team komt binnenkort je glas ophalen.
        </p>
        {ophaalverzoekId && (
          <>
            <p className="text-sm text-gray-500">
              Bewaar deze link — hierop zie je de status en kun je (anoniem, zonder telefoonnummers uit te
              wisselen) chatten met het team.
            </p>
            <Link href={`/status/${ophaalverzoekId}`} className="w-full">
              <Button variant="secondary" className="w-full">
                <MessageCircleMore className="h-4 w-4" /> Bekijk status &amp; chat
              </Button>
            </Link>
          </>
        )}
      </Card>
    );
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
              Dit bedrag gaat 100% naar de clubkas van {clubNaam} — een team ruimt jouw glas/papier voor je op.
            </p>

            <div className="mt-4 grid grid-cols-3 gap-2.5">
              {GLAS_NAAR_KAS_OPTIES.map((optie) => (
                <button
                  key={optie.bedrag}
                  onClick={() => setBedrag(optie.bedrag)}
                  className={cn(
                    "rounded-2xl border-2 p-4 text-center transition-colors",
                    bedrag === optie.bedrag
                      ? "border-violet-500 bg-violet-50"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <p className="text-xl font-extrabold text-gray-900">{formatEuro(optie.bedrag)}</p>
                  <p className="mt-0.5 text-xs font-medium text-gray-500">{optie.label}</p>
                </button>
              ))}
            </div>

            <Button className="mt-5 w-full" size="lg" disabled={!bedrag} onClick={startBetaling}>
              <Smartphone className="h-4 w-4" />
              {bedrag ? `Doneer ${formatEuro(bedrag)} via iDeal/Tikkie` : "Kies eerst een bedrag"}
            </Button>
          </motion.div>
        )}

        {(stap === "betalen-bevestig" || stap === "betalen-bezig" || stap === "betalen-gelukt") && bedrag && (
          <motion.div key="betalen" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-center">
              <p className="mb-4 flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
                <ShieldCheck className="h-3.5 w-3.5" /> Gesimuleerd betaalscherm (demo)
              </p>

              {stap === "betalen-bevestig" && (
                <>
                  <Smartphone className="mx-auto h-10 w-10 text-gray-400" />
                  <p className="mt-3 text-2xl font-extrabold text-gray-900">{formatEuro(bedrag)}</p>
                  <p className="mt-1 text-sm text-gray-500">Doneren via iDeal/Tikkie aan {clubNaam}</p>
                  <Button className="mt-5 w-full" onClick={bevestigBetaling}>
                    Betaal {formatEuro(bedrag)}
                  </Button>
                </>
              )}

              {stap === "betalen-bezig" && (
                <div className="flex flex-col items-center gap-3 py-4">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  <p className="text-sm text-gray-500">Je wordt doorgestuurd naar je bank…</p>
                </div>
              )}

              {stap === "betalen-gelukt" && (
                <div className="flex flex-col items-center gap-3 py-2">
                  <CheckCircle2 className="h-10 w-10 text-brand-600" />
                  <p className="font-semibold text-gray-900">Betaling gelukt!</p>
                  <Button className="mt-2 w-full" onClick={plaatsVerzoek}>
                    Rit aanmaken
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {stap === "versturen" && (
          <motion.div key="versturen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
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
