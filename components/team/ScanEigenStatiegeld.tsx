"use client";

import { useRouter } from "next/navigation";
import { useTeam } from "@/components/team/TeamContext";
import { ReceiptScanner } from "@/components/team/ReceiptScanner";

/**
 * "Mijn Eigen Statiegeld": een speler die zelf flessen inlevert (geen
 * geclaimd donateursadres) kan zo direct punten claimen voor zijn team
 * — zonder eerst een adres te hoeven claimen. Verschilt van
 * BonnetjeUpload alleen in het ontbreken van een ophaalverzoekId.
 */
export function ScanEigenStatiegeld({ clubSlug }: { clubSlug: string }) {
  const router = useRouter();
  const { gekozenTeam, spelerId } = useTeam();

  if (!gekozenTeam) return null;

  return (
    <div className="mx-auto max-w-lg space-y-3 p-4">
      <h1 className="text-lg font-bold text-gray-900">Scan eigen statiegeld</h1>
      <p className="text-sm text-gray-500">
        Lever je zelf flessen of blikjes in bij de supermarkt? Scan het bonnetje direct — dit telt mee
        voor {gekozenTeam.team_naam} én voor je eigen badges en streak.
      </p>

      <ReceiptScanner
        teamId={gekozenTeam.id}
        clubId={gekozenTeam.club_id}
        teamNaam={gekozenTeam.team_naam}
        spelerId={spelerId}
        onVoltooid={() => router.push(`/club/${clubSlug}/profiel`)}
      />
    </div>
  );
}
