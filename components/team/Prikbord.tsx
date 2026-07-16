"use client";

import { useCallback, useEffect, useState } from "react";
import { MapPin, Package, Loader2, Camera } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { useTeam } from "@/components/team/TeamContext";
import type { OphaalverzoekPrikbord } from "@/lib/types";

interface GeclaimdAdres {
  id: string;
  donateur_naam: string;
  donateur_adres: string;
  donateur_postcode: string;
  donateur_telefoonnummer: string | null;
}

export function Prikbord({ clubId, clubSlug }: { clubId: string; clubSlug: string }) {
  const { gekozenTeam } = useTeam();
  const [verzoeken, setVerzoeken] = useState<OphaalverzoekPrikbord[]>([]);
  const [geclaimd, setGeclaimd] = useState<Record<string, GeclaimdAdres>>({});
  const [ladend, setLadend] = useState(true);
  const [claimBezig, setClaimBezig] = useState<string | null>(null);
  const [foutmelding, setFoutmelding] = useState<string | null>(null);

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

  async function claim(id: string) {
    if (!gekozenTeam) return;
    setClaimBezig(id);
    setFoutmelding(null);

    try {
      const res = await fetch(`/api/ophaalverzoeken/${id}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team_id: gekozenTeam.id }),
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
      await laadVerzoeken();
    } finally {
      setClaimBezig(null);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-3 p-4">
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
              <Link href={`/club/${clubSlug}/upload?verzoek=${v.id}`}>
                <Button size="sm" variant="secondary" className="w-full">
                  <Camera className="h-4 w-4" /> Bonnetje uploaden
                </Button>
              </Link>
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
