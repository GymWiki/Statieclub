"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { laadGekozenTeamId, kiesTeam, wisselTeam, laadSpelerNaam, bewaarSpelerNaam } from "@/lib/teamSelection";
import { laadOfMaakSpelerId } from "@/lib/playerIdentity";
import type { Team } from "@/lib/types";

interface TeamContextValue {
  teams: Team[];
  gekozenTeam: Team | null;
  spelerNaam: string;
  /** Client-gegenereerde, persistente speler-identiteit (zie lib/playerIdentity.ts). */
  spelerId: string;
  kiesTeam: (teamId: string, naam: string) => void;
  wisselTeam: () => void;
}

const TeamContext = createContext<TeamContextValue | null>(null);

export function TeamProvider({
  clubSlug,
  clubId,
  teams,
  children,
}: {
  clubSlug: string;
  clubId: string;
  teams: Team[];
  children: React.ReactNode;
}) {
  const [gekozenTeamId, setGekozenTeamId] = useState<string | null>(null);
  const [spelerNaam, setSpelerNaam] = useState("");
  const [spelerId, setSpelerId] = useState("");
  const [geladen, setGeladen] = useState(false);

  useEffect(() => {
    setGekozenTeamId(laadGekozenTeamId(clubSlug));
    setSpelerNaam(laadSpelerNaam());
    setSpelerId(laadOfMaakSpelerId());
    setGeladen(true);
  }, [clubSlug]);

  // Syncen naar de server zodra speler + team bekend zijn — ook bij een
  // reload op een apparaat dat al eerder een team koos, niet alleen bij
  // het kiezen zelf. avatar_emoji zit hier bewust niet in (zie
  // /api/spelers), zodat een gekozen avatar nooit wordt overschreven.
  useEffect(() => {
    if (!geladen || !spelerId || !gekozenTeamId) return;
    fetch("/api/spelers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: spelerId, club_id: clubId, team_id: gekozenTeamId, naam: spelerNaam }),
    }).catch(() => {});
  }, [geladen, spelerId, gekozenTeamId, clubId, spelerNaam]);

  const gekozenTeam = teams.find((t) => t.id === gekozenTeamId) ?? null;

  const value: TeamContextValue = {
    teams,
    gekozenTeam,
    spelerNaam,
    spelerId,
    kiesTeam: (teamId: string, naam: string) => {
      kiesTeam(clubSlug, teamId);
      bewaarSpelerNaam(naam);
      setGekozenTeamId(teamId);
      setSpelerNaam(naam);
    },
    wisselTeam: () => {
      wisselTeam(clubSlug);
      setGekozenTeamId(null);
    },
  };

  if (!geladen) return null;

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
}

export function useTeam() {
  const ctx = useContext(TeamContext);
  if (!ctx) throw new Error("useTeam moet binnen een TeamProvider gebruikt worden.");
  return ctx;
}
