"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { laadGekozenTeamId, kiesTeam, wisselTeam, laadSpelerNaam, bewaarSpelerNaam } from "@/lib/teamSelection";
import type { Team } from "@/lib/types";

interface TeamContextValue {
  teams: Team[];
  gekozenTeam: Team | null;
  spelerNaam: string;
  kiesTeam: (teamId: string, naam: string) => void;
  wisselTeam: () => void;
}

const TeamContext = createContext<TeamContextValue | null>(null);

export function TeamProvider({
  clubSlug,
  teams,
  children,
}: {
  clubSlug: string;
  teams: Team[];
  children: React.ReactNode;
}) {
  const [gekozenTeamId, setGekozenTeamId] = useState<string | null>(null);
  const [spelerNaam, setSpelerNaam] = useState("");
  const [geladen, setGeladen] = useState(false);

  useEffect(() => {
    setGekozenTeamId(laadGekozenTeamId(clubSlug));
    setSpelerNaam(laadSpelerNaam());
    setGeladen(true);
  }, [clubSlug]);

  const gekozenTeam = teams.find((t) => t.id === gekozenTeamId) ?? null;

  const value: TeamContextValue = {
    teams,
    gekozenTeam,
    spelerNaam,
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
