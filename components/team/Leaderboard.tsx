"use client";

import { useEffect, useState } from "react";
import { Medal, Target, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { cn, formatEuro, formatVoortgang } from "@/lib/utils";
import { useTeam } from "@/components/team/TeamContext";
import type { Doel, Speler, Team } from "@/lib/types";

const medailleKleur = ["text-yellow-500", "text-gray-400", "text-amber-700"];

export interface KlapperVanDeWeek {
  naam: string;
  avatar_emoji: string;
  bedrag_euro: number;
}

export function Leaderboard({
  clubId,
  initialTeams,
  initialDoelen,
  initialTopSpelers,
  klapperVanDeWeek,
}: {
  clubId: string;
  initialTeams: Team[];
  initialDoelen: Doel[];
  initialTopSpelers: Speler[];
  klapperVanDeWeek: KlapperVanDeWeek | null;
}) {
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [doelen, setDoelen] = useState<Doel[]>(initialDoelen);
  const [topSpelers, setTopSpelers] = useState<Speler[]>(initialTopSpelers);
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
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "spelers", filter: `club_id=eq.${clubId}` },
        (payload) => {
          const speler = payload.new as Speler;
          setTopSpelers((prev) => {
            const zonderSpeler = prev.filter((s) => s.id !== speler.id);
            return [...zonderSpeler, speler]
              .sort((a, b) => b.totaal_opgehaald_euro - a.totaal_opgehaald_euro)
              .slice(0, 5);
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "doelen", filter: `club_id=eq.${clubId}` },
        (payload) => {
          setDoelen((prev) => prev.map((d) => (d.id === payload.new.id ? { ...d, ...(payload.new as Doel) } : d)));
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

      {doelen.length > 0 && (
        <Card className="space-y-3 p-4">
          <p className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
            <Target className="h-4 w-4 text-brand-600" /> Waar we samen voor sparen
          </p>
          {doelen.map((doel) => {
            const percentage = formatVoortgang(doel.opgehaald_bedrag, doel.doelbedrag);
            return (
              <div key={doel.id} className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-sm font-medium text-gray-700">{doel.titel}</p>
                  <p className="shrink-0 text-sm font-bold text-brand-600">{percentage}%</p>
                </div>
                <ProgressBar percentage={percentage} />
                <p className="text-xs text-gray-500">
                  <AnimatedNumber value={doel.opgehaald_bedrag} format={formatEuro} /> van{" "}
                  {formatEuro(doel.doelbedrag)} opgehaald
                </p>
              </div>
            );
          })}
        </Card>
      )}

      {klapperVanDeWeek && (
        <Card className="flex items-center gap-3 border-amber-300 bg-gradient-to-br from-amber-50 to-white p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
            <Zap className="h-5 w-5 text-amber-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wide text-amber-600">Klapper van de week</p>
            <p className="truncate font-semibold text-gray-900">
              {klapperVanDeWeek.avatar_emoji} {klapperVanDeWeek.naam}
            </p>
          </div>
          <p className="text-lg font-extrabold text-amber-600">{formatEuro(klapperVanDeWeek.bedrag_euro)}</p>
        </Card>
      )}

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

      {topSpelers.length > 0 && (
        <div className="space-y-2 pt-2">
          <h2 className="text-sm font-bold text-gray-900">Persoonlijke topscorers (MVP&apos;s)</h2>
          {topSpelers
            .filter((s) => s.totaal_opgehaald_euro > 0)
            .map((speler, index) => (
              <Card key={speler.id} className="flex items-center gap-3 p-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-lg">
                  {speler.avatar_emoji}
                </div>
                <p className="min-w-0 flex-1 truncate text-sm font-medium text-gray-800">
                  {index === 0 && "🥇 "}
                  {speler.naam}
                </p>
                <p className="text-sm font-bold text-brand-600">{formatEuro(speler.totaal_opgehaald_euro)}</p>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}
