import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Trophy, Package } from "lucide-react";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { StatusBadge } from "@/components/ui/Badge";
import { chatIsGesloten } from "@/lib/utils";

// Persoonsgebonden magic-link-pagina (ophaalverzoek-id als geheim in de URL) — noindex.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface StatusRij {
  id: string;
  status: string;
  aantal_geschat: number;
  opmerking: string | null;
  clubs: { naam: string } | null;
  teams: { team_naam: string } | null;
}

/**
 * "Magic link"-statuspagina voor de donateur: publiek toegankelijk,
 * geen account nodig — het ophaalverzoek-id in de URL is zelf het
 * gedeelde geheim (een niet-raadbare UUID), net als bij
 * `/api/ophaalverzoeken/[id]` na een claim. Toont enkel de eigen
 * status + het chatgesprek met het ophalende team; geen andere
 * donateurs of clubgegevens.
 */
export default async function StatusPage({ params }: { params: Promise<{ ophaalverzoekId: string }> }) {
  const { ophaalverzoekId } = await params;
  const service = createServiceRoleClient();

  const { data } = await service
    .from("ophaalverzoeken")
    .select("id, status, aantal_geschat, opmerking, clubs(naam), teams(team_naam)")
    .eq("id", ophaalverzoekId)
    .maybeSingle();

  if (!data) notFound();
  const verzoek = data as unknown as StatusRij;

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4 py-10">
      <div className="text-center">
        <p className="text-sm text-gray-500">{verzoek.clubs?.naam ?? "Statieclub"}</p>
        <h1 className="mt-1 text-xl font-bold text-gray-900">Status van je ophaalverzoek</h1>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-sm text-gray-600">
            <Package className="h-4 w-4 text-gray-400" /> ± {verzoek.aantal_geschat} flessen/blikjes
          </p>
          <StatusBadge status={verzoek.status} />
        </div>

        {verzoek.teams && (
          <p className="mt-3 flex items-center gap-1.5 text-sm text-gray-700">
            <Trophy className="h-4 w-4 text-brand-500" /> Team{" "}
            <span className="font-semibold">{verzoek.teams.team_naam}</span> komt je flessen ophalen!
          </p>
        )}

        {verzoek.opmerking && (
          <p className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
            Jouw opmerking: &ldquo;{verzoek.opmerking}&rdquo;
          </p>
        )}
      </div>

      <div>
        <h2 className="mb-2 text-sm font-bold text-gray-900">Chat met het team</h2>
        <ChatWindow
          ophaalverzoekId={verzoek.id}
          afzenderType="donateur"
          gesloten={chatIsGesloten(verzoek.status)}
        />
      </div>
    </div>
  );
}
