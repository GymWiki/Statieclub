"use client";

import { useEffect, useState } from "react";
import { Medal } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { cn, formatEuro } from "@/lib/utils";
import { useTeam } from "@/components/team/TeamContext";
import type { Team } from "@/lib/types";

const medailleKleur = ["text-yellow-500", "text-gray-400", "text-amber-700"];

export function Leaderboard({ clubId, initialTeams }: { clubId: string; initialTeams: Team[] }) {
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const { gekozenTeam } = useTeam();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`teams-club-${clubId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "teams", filter: `club_id=eq.${clubId}` },
        (payload) => {
          setTeams((prev) =>
            prev.map((t) => (t.id === payload.new.id ? { ...t, ...(payload.new as Team) } : t))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clubId]);

  const gesorteerd = [...teams].sort((a, b) => b.totaal_punten - a.totaal_punten);

  return (
    <div className="mx-auto max-w-lg space-y-3 p-4">
      <h1 className="text-lg font-bold text-gray-900">Live scorebord</h1>

      {gesorteerd.map((team, index) => (
        <Card
          key={team.id}
          className={cn(
            "flex items-center gap-3 p-4",
            gekozenTeam?.id === team.id && "ring-2 ring-brand-500"
          )}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 font-bold text-gray-700">
            {index < 3 ? <Medal className={cn("h-5 w-5", medailleKleur[index])} /> : index + 1}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-gray-900">{team.team_naam}</p>
            <p className="text-sm text-gray-500">
              <AnimatedNumber value={team.totaal_opgehaald_euro} format={formatEuro} />
            </p>
          </div>
          <div className="text-right">
            <p className="text-xl font-extrabold text-brand-600">
              <AnimatedNumber value={team.totaal_punten} />
            </p>
            <p className="text-xs text-gray-400">punten</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
