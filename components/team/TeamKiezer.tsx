"use client";

import { Users } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { useTeam } from "@/components/team/TeamContext";

export function TeamKiezer({ clubNaam }: { clubNaam: string }) {
  const { teams, kiesTeam } = useTeam();

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="text-center">
        <Users className="mx-auto h-10 w-10 text-brand-600" />
        <h1 className="mt-3 text-xl font-bold text-gray-900">Voor welk team speel je?</h1>
        <p className="mt-1 text-sm text-gray-500">{clubNaam}</p>
      </div>

      <div className="mt-6 space-y-2">
        {teams.map((team) => (
          <button
            key={team.id}
            onClick={() => kiesTeam(team.id)}
            className="w-full text-left"
          >
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
