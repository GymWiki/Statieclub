"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { useTeam } from "@/components/team/TeamContext";

export function TeamKiezer({ clubNaam }: { clubNaam: string }) {
  const { teams, kiesTeam, spelerNaam } = useTeam();
  const [naam, setNaam] = useState(spelerNaam);
  const [foutmelding, setFoutmelding] = useState<string | null>(null);

  function kies(teamId: string) {
    if (naam.trim().length < 2) {
      setFoutmelding("Vul eerst je naam in.");
      return;
    }
    setFoutmelding(null);
    kiesTeam(teamId, naam.trim());
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="text-center">
        <Users className="mx-auto h-10 w-10 text-brand-600" />
        <h1 className="mt-3 text-xl font-bold text-gray-900">Voor welk team speel je?</h1>
        <p className="mt-1 text-sm text-gray-500">{clubNaam}</p>
      </div>

      <div className="mt-6">
        <Label htmlFor="speler-naam">Jouw naam</Label>
        <Input
          id="speler-naam"
          value={naam}
          onChange={(e) => setNaam(e.target.value)}
          placeholder="Voornaam"
          autoComplete="given-name"
        />
        <p className="mt-1 text-xs text-gray-400">
          Gebruiken we om je even voor te stellen als je een adres claimt.
        </p>
      </div>

      {foutmelding && <p className="mt-3 text-sm text-red-600">{foutmelding}</p>}

      <div className="mt-4 space-y-2">
        {teams.map((team) => (
          <button key={team.id} onClick={() => kies(team.id)} className="w-full text-left">
            <Card className="px-4 py-3.5 font-medium text-gray-800 transition-colors hover:border-brand-400 hover:bg-brand-50">
              {team.team_naam}
            </Card>
          </button>
        ))}
        {teams.length === 0 && (
          <p className="text-center text-sm text-gray-500">Deze club heeft nog geen teams.</p>
        )}
      </div>
    </div>
  );
}
