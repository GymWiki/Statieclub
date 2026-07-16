"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { laadGekozenTeamId, kiesTeam, wisselTeam } from "@/lib/teamSelection";
import type { Team } from "@/lib/types";

interface TeamContextValue {
  teams: Team[];
  gekozenTeam: Team | null;
  kiesTeam: (teamId: string) => void;
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
  const [geladen, setGeladen] = useState(false);

  useEffect(() => {
    setGekozenTeamId(laadGekozenTeamId(clubSlug));
    setGeladen(true);
  }, [clubSlug]);

  const gekozenTeam = teams.find((t) => t.id === gekozenTeamId) ?? null;

  const value: TeamContextValue = {
    teams,
    gekozenTeam,
    kiesTeam: (teamId: string) => {
      kiesTeam(clubSlug, teamId);
      setGekozenTeamId(teamId);
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
