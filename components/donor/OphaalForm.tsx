"use client";

import { FormEvent, useEffect, useState } from "react";
import { CheckCircle2, Loader2, PackageOpen } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { laadDonorProfiel, bewaarDonorProfiel } from "@/lib/donorProfile";
import type { Doel } from "@/lib/types";

export function OphaalForm({ clubId, clubNaam, doelen }: { clubId: string; clubNaam: string; doelen: Doel[] }) {
  const [naam, setNaam] = useState("");
  const [email, setEmail] = useState("");
  const [adres, setAdres] = useState("");
  const [postcode, setPostcode] = useState("");
  const [telefoonnummer, setTelefoonnummer] = useState("");
  const [doelId, setDoelId] = useState(doelen[0]?.id ?? "");
  const [aantalGeschat, setAantalGeschat] = useState(20);
  const [opmerking, setOpmerking] = useState("");

  const [bekendeDonateur, setBekendeDonateur] = useState(false);
  const [status, setStatus] = useState<"idle" | "versturen" | "verzonden" | "fout">("idle");
  const [foutmelding, setFoutmelding] = useState<string | null>(null);
  const [locatie, setLocatie] = useState<{ lat: number; lng: number } | null>(null);

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

  // Optioneel en non-blocking: als de browser toestemming geeft, geeft
  // dit het prikbord straks een afstand + kaart-cirkel voor dit
  // verzoek. Wordt niets gevraagd afgedwongen — zonder toestemming
  // werkt het formulier gewoon door, dan blijft lat/lng leeg.
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (positie) => setLocatie({ lat: positie.coords.latitude, lng: positie.coords.longitude }),
      () => setLocatie(null),
      { timeout: 8000 }
    );
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("versturen");
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
          lat: locatie?.lat,
          lng: locatie?.lng,
          club_id: clubId,
          doel_id: doelId,
          aantal_geschat: aantalGeschat,
          opmerking,
        }),
      });
      const json = await res.json();

      if (!res.ok) {
        setFoutmelding(json.error ?? "Er ging iets mis, probeer het opnieuw.");
        setStatus("fout");
        return;
      }

      bewaarDonorProfiel(json.donateurProfiel);
      setStatus("verzonden");
    } catch {
      setFoutmelding("Kon geen verbinding maken. Probeer het opnieuw.");
      setStatus("fout");
    }
  }

  if (status === "verzonden") {
    return (
      <Card className="flex flex-col items-center gap-3 p-8 text-center">
        <CheckCircle2 className="h-12 w-12 text-brand-600" />
        <h2 className="text-xl font-bold text-gray-900">Bedankt namens {clubNaam}!</h2>
        <p className="text-gray-600">
          Je ophaalverzoek staat op het prikbord. Een team komt binnenkort je flessen ophalen.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      {bekendeDonateur && (
        <p className="mb-4 flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">
          <PackageOpen className="h-4 w-4" />
          Welkom terug! Je gegevens zijn alvast ingevuld.
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {doelen.length > 1 && (
          <div>
            <Label htmlFor="doel">Welk doel wil je steunen?</Label>
            <select
              id="doel"
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
          <Label htmlFor="naam">Naam</Label>
          <Input id="naam" required value={naam} onChange={(e) => setNaam(e.target.value)} placeholder="Voor- en achternaam" />
        </div>
        <div>
          <Label htmlFor="email">E-mailadres</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jij@voorbeeld.nl" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <Label htmlFor="adres">Adres</Label>
            <Input id="adres" required value={adres} onChange={(e) => setAdres(e.target.value)} placeholder="Straat + huisnummer" />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <Label htmlFor="postcode">Postcode</Label>
            <Input id="postcode" required value={postcode} onChange={(e) => setPostcode(e.target.value)} placeholder="1234 AB" />
          </div>
        </div>
        <div>
          <Label htmlFor="telefoon">Telefoonnummer (optioneel)</Label>
          <Input id="telefoon" value={telefoonnummer} onChange={(e) => setTelefoonnummer(e.target.value)} placeholder="06 12345678" />
        </div>
        <div>
          <Label htmlFor="aantal">Geschat aantal flessen/blikjes</Label>
          <Input
            id="aantal"
            type="number"
            min={1}
            required
            value={aantalGeschat}
            onChange={(e) => setAantalGeschat(Number(e.target.value))}
          />
        </div>
        <div>
          <Label htmlFor="opmerking">Opmerking (optioneel)</Label>
          <Input id="opmerking" value={opmerking} onChange={(e) => setOpmerking(e.target.value)} placeholder="Bijv. kratten staan bij de schuur" />
        </div>

        {foutmelding && <p className="text-sm text-red-600">{foutmelding}</p>}

        <Button type="submit" size="lg" className="w-full" disabled={status === "versturen"}>
          {status === "versturen" && <Loader2 className="h-5 w-5 animate-spin" />}
          Haal mijn statiegeld op
        </Button>
      </form>
    </Card>
  );
}
