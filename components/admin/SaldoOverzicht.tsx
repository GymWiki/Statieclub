"use client";

import { useEffect, useState } from "react";
import { Wallet, Target, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { formatEuro, formatVoortgang } from "@/lib/utils";
import type { Club, Doel, DoelMetTeams, Team } from "@/lib/types";

export function SaldoOverzicht({
  club,
  initialTeams,
  initialDoelen,
}: {
  club: Club;
  initialTeams: Team[];
  initialDoelen: DoelMetTeams[];
}) {
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [doelen, setDoelen] = useState<DoelMetTeams[]>(initialDoelen);
  const teamNaamPerId = new Map(teams.map((t) => [t.id, t.team_naam]));

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`admin-${club.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "teams", filter: `club_id=eq.${club.id}` },
        (payload) => {
          setTeams((prev) => prev.map((t) => (t.id === payload.new.id ? { ...t, ...(payload.new as Team) } : t)));
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "doelen", filter: `club_id=eq.${club.id}` },
        (payload) => {
          setDoelen((prev) => prev.map((d) => (d.id === payload.new.id ? { ...d, ...(payload.new as Doel) } : d)));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [club.id]);

  const virtueelSaldo = teams.reduce((som, t) => som + t.totaal_opgehaald_euro, 0);
  const gesorteerd = [...teams].sort((a, b) => b.totaal_opgehaald_euro - a.totaal_opgehaald_euro);
  const actieveDoelen = doelen.filter((d) => d.is_actief);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <p className="flex items-center gap-1.5 text-sm text-gray-500">
            <Wallet className="h-4 w-4" /> Virtueel saldo (via app verzameld)
          </p>
          <p className="mt-1 text-3xl font-extrabold text-brand-700">
            <AnimatedNumber value={virtueelSaldo} format={formatEuro} />
          </p>
        </Card>
        <Card className="p-5">
          <p className="flex items-center gap-1.5 text-sm text-gray-500">
            <Target className="h-4 w-4" /> Actieve doelen
          </p>
          <div className="mt-2 space-y-3">
            {actieveDoelen.length === 0 && (
              <p className="text-xs text-gray-400">Nog geen actief doel — beheer dit op het tabblad &ldquo;Doelen&rdquo;.</p>
            )}
            {actieveDoelen.map((doel) => {
              const percentage = formatVoortgang(doel.opgehaald_bedrag, doel.doelbedrag);
              return (
                <div key={doel.id} className="space-y-1">
                  <p className="text-xs font-medium text-gray-700">{doel.titel}</p>
                  <ProgressBar percentage={percentage} />
                  <p className="text-xs text-gray-500">
                    {formatEuro(doel.opgehaald_bedrag)} van {formatEuro(doel.doelbedrag)} ({percentage}%)
                  </p>
                  <p className="flex items-center gap-1 text-xs text-gray-400">
                    <Users className="h-3 w-3" />
                    {doel.team_ids.length === 0
                      ? "Alle teams"
                      : doel.team_ids.map((id) => teamNaamPerId.get(id) ?? "onbekend team").join(", ")}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-2.5">Team</th>
              <th className="px-4 py-2.5 text-right">Punten</th>
              <th className="px-4 py-2.5 text-right">Opgehaald</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {gesorteerd.map((team) => (
              <tr key={team.id}>
                <td className="px-4 py-3 font-medium text-gray-900">{team.team_naam}</td>
                <td className="px-4 py-3 text-right text-gray-600">
                  <AnimatedNumber value={team.totaal_punten} />
                </td>
                <td className="px-4 py-3 text-right font-semibold text-gray-900">
                  <AnimatedNumber value={team.totaal_opgehaald_euro} format={formatEuro} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
