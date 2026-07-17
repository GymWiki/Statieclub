"use client";

import { useCallback, useEffect, useState } from "react";
import { List, Map as MapIcon, Loader2 } from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { NieuweBadgeToasts } from "@/components/ui/BadgeToast";
import { PrikbordLijst } from "@/components/team/PrikbordLijst";
import { PrikbordKaart } from "@/components/team/PrikbordKaart";
import { OphaalClaimSheet, type GeclaimdAdres } from "@/components/team/OphaalClaimSheet";
import { useTeam } from "@/components/team/TeamContext";
import { cn } from "@/lib/utils";
import type { Coordinaat } from "@/lib/geo";
import type { Badge, OphaalverzoekNearby } from "@/lib/types";

type Weergave = "lijst" | "kaart";

/**
 * Ophaal Prikbord — AVG/privacy-uitgangspunt: de exacte locatie (en
 * het adres) van een donateur bereikt de browser nooit vóórdat een
 * speler op "Claim deze rit" heeft gedrukt. Vóór dat moment komt alle
 * data van `GET /api/ophaalverzoeken/nearby` (de "getNearbyRequests"-
 * functie), die uitsluitend afstand, postcode-cijfers en een vervaagde
 * ("fuzzy") coördinaat teruggeeft. Zie components/team/OphaalClaimSheet
 * voor het enige moment waarop dat verandert.
 */
export function Prikbord({ clubId, clubSlug }: { clubId: string; clubSlug: string }) {
  const { gekozenTeam, spelerId } = useTeam();

  const [weergave, setWeergave] = useState<Weergave>("lijst");
  const [verzoeken, setVerzoeken] = useState<OphaalverzoekNearby[]>([]);
  const [ladend, setLadend] = useState(true);

  const [spelerLocatie, setSpelerLocatie] = useState<Coordinaat | null>(null);
  const [locatieOpgevraagd, setLocatieOpgevraagd] = useState(false);

  const [geselecteerdId, setGeselecteerdId] = useState<string | null>(null);
  const [geclaimd, setGeclaimd] = useState<Record<string, GeclaimdAdres>>({});
  const [claimBezig, setClaimBezig] = useState(false);
  const [foutmelding, setFoutmelding] = useState<string | null>(null);
  const [nieuweBadges, setNieuweBadges] = useState<Badge[]>([]);

  // Ééns per bezoek de locatie van de speler vragen — non-blocking en
  // optioneel: zonder toestemming werkt het prikbord gewoon door, dan
  // toont de lijst alleen geen afstand en valt de kaart terug op het
  // zwaartepunt van de zones.
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocatieOpgevraagd(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (positie) => {
        setSpelerLocatie({ lat: positie.coords.latitude, lng: positie.coords.longitude });
        setLocatieOpgevraagd(true);
      },
      () => setLocatieOpgevraagd(true),
      { timeout: 8000 }
    );
  }, []);

  const laadVerzoeken = useCallback(async () => {
    if (!locatieOpgevraagd) return;
    const params = new URLSearchParams({ club_id: clubId });
    if (spelerLocatie) {
      params.set("lat", String(spelerLocatie.lat));
      params.set("lng", String(spelerLocatie.lng));
    }
    const res = await fetch(`/api/ophaalverzoeken/nearby?${params.toString()}`);
    if (res.ok) {
      const json = await res.json();
      setVerzoeken(json.ophaalverzoeken ?? []);
    }
    setLadend(false);
  }, [clubId, spelerLocatie, locatieOpgevraagd]);

  useEffect(() => {
    laadVerzoeken();
    const interval = setInterval(laadVerzoeken, 5000);
    return () => clearInterval(interval);
  }, [laadVerzoeken]);

  // Een eerder door ons geclaimd verzoek (ook op een ander apparaat of
  // na een reload) staat al op "geclaimd", maar het adres zit dan nog
  // niet in de lokale cache — haal dat alsnog op zodra we het zien.
  useEffect(() => {
    if (!gekozenTeam) return;

    const ontbrekend = verzoeken.filter(
      (v) => v.status === "geclaimd" && v.geclaimd_door_team_id === gekozenTeam.id && !geclaimd[v.id]
    );
    if (ontbrekend.length === 0) return;

    (async () => {
      for (const v of ontbrekend) {
        const res = await fetch(`/api/ophaalverzoeken/${v.id}`);
        if (!res.ok) continue;
        const json = await res.json();
        const o = json.ophaalverzoek;
        setGeclaimd((prev) => ({
          ...prev,
          [v.id]: {
            donateur_naam: o.donateurs.naam,
            donateur_adres: o.donateurs.adres,
            donateur_postcode: o.donateurs.postcode,
            opmerking: o.opmerking,
          },
        }));
      }
    })();
  }, [verzoeken, gekozenTeam, geclaimd]);

  async function claim(id: string) {
    if (!gekozenTeam) return;
    setClaimBezig(true);
    setFoutmelding(null);

    try {
      const res = await fetch(`/api/ophaalverzoeken/${id}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team_id: gekozenTeam.id, speler_id: spelerId || null }),
      });
      const json = await res.json();

      if (!res.ok) {
        setFoutmelding(json.error);
        await laadVerzoeken();
        return;
      }

      const o = json.ophaalverzoek;
      setGeclaimd((prev) => ({
        ...prev,
        [id]: {
          donateur_naam: o.donateurs.naam,
          donateur_adres: o.donateurs.adres,
          donateur_postcode: o.donateurs.postcode,
          opmerking: o.opmerking,
        },
      }));
      if (json.nieuweBadges?.length > 0) setNieuweBadges(json.nieuweBadges);
      await laadVerzoeken();
    } finally {
      setClaimBezig(false);
    }
  }

  const geselecteerd = verzoeken.find((v) => v.id === geselecteerdId) ?? null;

  return (
    <div className="mx-auto max-w-lg space-y-3 p-4">
      {nieuweBadges.length > 0 && <NieuweBadgeToasts badges={nieuweBadges} />}

      <div>
        <h1 className="text-lg font-bold text-gray-900">Ophaal prikbord</h1>
        <p className="text-sm text-gray-500">Claim een verzoek om flessen bij een donateur op te halen.</p>
      </div>

      <div className="inline-flex w-full rounded-xl bg-gray-100 p-1">
        <button
          onClick={() => setWeergave("lijst")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition-colors",
            weergave === "lijst" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
          )}
        >
          <List className="h-4 w-4" /> Lijst
        </button>
        <button
          onClick={() => setWeergave("kaart")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition-colors",
            weergave === "kaart" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
          )}
        >
          <MapIcon className="h-4 w-4" /> Kaart
        </button>
      </div>

      {ladend ? (
        <div className="flex justify-center py-10 text-gray-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : weergave === "lijst" ? (
        <PrikbordLijst items={verzoeken} onSelecteer={setGeselecteerdId} />
      ) : (
        <PrikbordKaart items={verzoeken} spelerLocatie={spelerLocatie} onSelecteer={setGeselecteerdId} />
      )}

      <BottomSheet open={geselecteerd !== null} onClose={() => setGeselecteerdId(null)} titel="Ophaalverzoek">
        {geselecteerd && gekozenTeam && (
          <OphaalClaimSheet
            item={geselecteerd}
            jouwClaim={geselecteerd.geclaimd_door_team_id === gekozenTeam.id}
            geclaimdAdres={geclaimd[geselecteerd.id] ?? null}
            claimBezig={claimBezig}
            foutmelding={foutmelding}
            onClaim={() => claim(geselecteerd.id)}
            clubSlug={clubSlug}
          />
        )}
      </BottomSheet>
    </div>
  );
}
