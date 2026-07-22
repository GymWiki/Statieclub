"use client";

import { Wallet } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { StatusBadge } from "@/components/ui/Badge";
import { cn, formatEuro } from "@/lib/utils";
import type { StatiegeldInlevering } from "@/lib/types";

/**
 * Toont het openstaande saldo van de Virtuele Portemonnee — puur
 * informatief. Een clublid kan hier NIET meer zelf tussentijds
 * afrekenen (migratie 0018/Punt 4): betalen kan uitsluitend nadat een
 * actie is afgerond en de club daarmee automatisch een betaalverzoek
 * heeft gestuurd (zie BetaalverzoekBanner) — nooit rechtstreeks vanaf
 * dit scherm.
 */
export function StatiegeldSaldo({ inleveringen }: { inleveringen: StatiegeldInlevering[] }) {
  const pending = inleveringen.filter((i) => i.status === "pending" || i.status === "processed_for_payment");
  const saldo = Math.round(pending.reduce((som, i) => som + i.bedrag, 0) * 100) / 100;

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <p className="flex items-center gap-1.5 text-sm text-gray-500">
          <Wallet className="h-4 w-4" /> Openstaand saldo
        </p>
        <p className="mt-1 text-3xl font-extrabold text-gray-900">
          <AnimatedNumber value={saldo} format={formatEuro} />
        </p>

        <p className="mt-3 text-xs text-gray-500">
          Je rekent dit saldo niet zelf af — zodra de huidige actie wordt afgesloten, stuurt de club
          je automatisch een betaalverzoek om via iDEAL te betalen.
        </p>
      </Card>

      {inleveringen.length > 0 && (
        <Card className="overflow-hidden">
          <div className="border-b border-gray-100 px-4 py-3">
            <h2 className="font-semibold text-gray-900">Geschiedenis</h2>
          </div>
          <ul className="divide-y divide-gray-100">
            {inleveringen.map((inlevering) => (
              <li key={inlevering.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-gray-500">
                  {new Date(inlevering.created_at).toLocaleDateString("nl-NL", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
                <span className={cn("font-semibold", inlevering.status === "paid" ? "text-gray-400" : "text-gray-900")}>
                  {formatEuro(inlevering.bedrag)}
                </span>
                <StatusBadge status={inlevering.status} />
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
