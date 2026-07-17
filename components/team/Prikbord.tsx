"use client";

import { useCallback, useEffect, useState } from "react";
import { MapPin, Package, Loader2, Camera, MessageCircleMore } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { NieuweBadgeToasts } from "@/components/ui/BadgeToast";
import { useTeam } from "@/components/team/TeamContext";
import { bouwWhatsappUrl } from "@/lib/utils";
import type { Badge, OphaalverzoekPrikbord } from "@/lib/types";

interface GeclaimdAdres {
  id: string;
  donateur_naam: string;
  donateur_adres: string;
  donateur_postcode: string;
  donateur_telefoonnummer: string | null;
}

export function Prikbord({ clubId, clubSlug, clubNaam }: { clubId: string; clubSlug: string; clubNaam: string }) {
  const { gekozenTeam, spelerNaam, spelerId } = useTeam();
  const [verzoeken, setVerzoeken] = useState<OphaalverzoekPrikbord[]>([]);
  const [geclaimd, setGeclaimd] = useState<Record<string, GeclaimdAdres>>({});
  const [ladend, setLadend] = useState(true);
  const [claimBezig, setClaimBezig] = useState<string | null>(null);
  const [foutmelding, setFoutmelding] = useState<string | null>(null);
  const [nieuweBadges, setNieuweBadges] = useState<Badge[]>([]);

  const laadVerzoeken = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("ophaalverzoeken_prikbord")
      .select("*")
      .eq("club_id", clubId)
      .order("aangemaakt_op", { ascending: true });
    setVerzoeken((data as OphaalverzoekPrikbord[]) ?? []);
    setLadend(false);
  }, [clubId]);

  useEffect(() => {
    laadVerzoeken();
    const interval = setInterval(laadVerzoeken, 5000);
    return () => clearInterval(interval);
  }, [laadVerzoeken]);

  // Na een refresh (of op een ander apparaat) staat een eerder door ons
  // geclaimd verzoek nog wel op "geclaimd", maar het adres/telefoonnummer
  // zit niet meer in de lokale state — haal dat dan alsnog op, want de
  // WhatsApp-knop en het adres hebben het nodig.
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
            id: v.id,
            donateur_naam: o.donateurs.naam,
            donateur_adres: o.donateurs.adres,
            donateur_postcode: o.donateurs.postcode,
            donateur_telefoonnummer: o.donateurs.telefoonnummer,
          },
        }));
      }
    })();
  }, [verzoeken, gekozenTeam, geclaimd]);

  async function claim(id: string) {
    if (!gekozenTeam) return;
    setClaimBezig(id);
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
          id,
          donateur_naam: o.donateurs.naam,
          donateur_adres: o.donateurs.adres,
          donateur_postcode: o.donateurs.postcode,
          donateur_telefoonnummer: o.donateurs.telefoonnummer,
        },
      }));
      if (json.nieuweBadges?.length > 0) setNieuweBadges(json.nieuweBadges);
      await laadVerzoeken();
    } finally {
      setClaimBezig(null);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-3 p-4">
      {nieuweBadges.length > 0 && <NieuweBadgeToasts badges={nieuweBadges} />}
      <h1 className="text-lg font-bold text-gray-900">Ophaal prikbord</h1>
      <p className="text-sm text-gray-500">Claim een adres om flessen bij donateurs op te halen.</p>

      {foutmelding && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{foutmelding}</p>
      )}

      {ladend && (
        <div className="flex justify-center py-10 text-gray-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}

      {!ladend && verzoeken.length === 0 && (
        <p className="py-10 text-center text-gray-500">Geen openstaande ophaalverzoeken op dit moment.</p>
      )}

      {verzoeken.map((v) => {
        const jouwClaim = v.geclaimd_door_team_id === gekozenTeam?.id;
        const adres = geclaimd[v.id];

        const whatsappTekst = gekozenTeam
          ? `Hoi! Ik ben ${spelerNaam || "een teamlid"} van team ${gekozenTeam.team_naam} en ik kom zo de statiegeldflessen ophalen voor ${clubNaam}!`
          : "";
        const whatsappUrl = bouwWhatsappUrl(adres?.donateur_telefoonnummer, whatsappTekst);

        return (
          <Card key={v.id} className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 text-gray-700">
                <MapPin className="h-4 w-4 shrink-0 text-gray-400" />
                {adres ? (
                  <div className="text-sm">
                    <p className="font-semibold text-gray-900">{adres.donateur_naam}</p>
                    <p>{adres.donateur_adres}, {adres.donateur_postcode}</p>
                    {adres.donateur_telefoonnummer && <p className="text-gray-500">{adres.donateur_telefoonnummer}</p>}
                  </div>
                ) : (
                  <p className="text-sm">Postcode {v.postcode_cijfers}xx</p>
                )}
              </div>
              <StatusBadge status={v.status} />
            </div>

            <p className="flex items-center gap-1.5 text-sm text-gray-600">
              <Package className="h-4 w-4 text-gray-400" /> ± {v.aantal_geschat} flessen/blikjes
            </p>

            {v.status === "open" && (
              <Button
                size="sm"
                className="w-full"
                disabled={claimBezig === v.id || !gekozenTeam}
                onClick={() => claim(v.id)}
              >
                {claimBezig === v.id && <Loader2 className="h-4 w-4 animate-spin" />}
                Claim dit adres
              </Button>
            )}

            {v.status === "geclaimd" && jouwClaim && (
              <div className="flex gap-2">
                <a href={whatsappUrl} target="_blank" rel="noreferrer" className="flex-1">
                  <Button size="sm" className="w-full bg-[#25D366] hover:bg-[#1ebe57]">
                    <MessageCircleMore className="h-4 w-4" /> Laat weten dat je eraan komt
                  </Button>
                </a>
                <Link href={`/club/${clubSlug}/upload?verzoek=${v.id}`} className="flex-1">
                  <Button size="sm" variant="secondary" className="w-full">
                    <Camera className="h-4 w-4" /> Bonnetje uploaden
                  </Button>
                </Link>
              </div>
            )}

            {v.status === "geclaimd" && !jouwClaim && (
              <p className="text-center text-xs text-gray-400">Al geclaimd door een ander team</p>
            )}
          </Card>
        );
      })}
    </div>
  );
}
