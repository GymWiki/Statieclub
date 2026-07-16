"use client";

import { FormEvent, useState } from "react";
import { Loader2, PlusCircle, MessageCircleMore, Trophy } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { bouwWhatsappUrl, formatEuro } from "@/lib/utils";
import type { Team } from "@/lib/types";

export function TeamsBeheer({
  clubSlug,
  clubNaam,
  initialTeams,
}: {
  clubSlug: string;
  clubNaam: string;
  initialTeams: Team[];
}) {
  const [teams, setTeams] = useState(initialTeams);
  const [nieuweTeamNaam, setNieuweTeamNaam] = useState("");
  const [bezig, setBezig] = useState(false);
  const [foutmelding, setFoutmelding] = useState<string | null>(null);

  async function teamToevoegen(e: FormEvent) {
    e.preventDefault();
    setBezig(true);
    setFoutmelding(null);

    try {
      const res = await fetch(`/api/clubs/${clubSlug}/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team_naam: nieuweTeamNaam }),
      });
      const json = await res.json();

      if (!res.ok) {
        setFoutmelding(json.error ?? "Kon team niet aanmaken.");
        return;
      }

      setTeams((prev) => [...prev, json.team]);
      setNieuweTeamNaam("");
    } finally {
      setBezig(false);
    }
  }

  function openUitnodiging(team: Team) {
    const link = `${window.location.origin}/club/${clubSlug}/prikbord`;
    const tekst = `Doe mee met team ${team.team_naam} bij ${clubNaam} op Statieclub! 🏆 Open deze link op je telefoon en kies '${team.team_naam}' als je team: ${link}`;
    window.open(bouwWhatsappUrl(null, tekst), "_blank", "noopener,noreferrer");
  }

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <h2 className="font-semibold text-gray-900">Nieuw team toevoegen</h2>
        <p className="mt-1 text-sm text-gray-500">
          Elk team krijgt een eigen deelbare uitnodigingslink om leden te werven.
        </p>
        <form onSubmit={teamToevoegen} className="mt-4 flex gap-2">
          <Input
            value={nieuweTeamNaam}
            onChange={(e) => setNieuweTeamNaam(e.target.value)}
            placeholder="bijv. JO11-1"
            required
          />
          <Button type="submit" disabled={bezig}>
            {bezig ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
            Toevoegen
          </Button>
        </form>
        {foutmelding && <p className="mt-2 text-sm text-red-600">{foutmelding}</p>}
      </Card>

      <Card className="p-5">
        <h2 className="font-semibold text-gray-900">Teams in deze campagne</h2>

        <div className="mt-4 space-y-2">
          {teams.length === 0 && (
            <p className="py-6 text-center text-sm text-gray-400">Nog geen teams — voeg er hierboven één toe.</p>
          )}

          {teams.map((team) => (
            <div key={team.id} className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 p-3">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700">
                  <Trophy className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{team.team_naam}</p>
                  <p className="text-xs text-gray-500">
                    {team.totaal_punten} punten · {formatEuro(team.totaal_opgehaald_euro)}
                  </p>
                </div>
              </div>
              <Button size="sm" variant="secondary" onClick={() => openUitnodiging(team)}>
                <MessageCircleMore className="h-4 w-4" /> Uitnodigen
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
