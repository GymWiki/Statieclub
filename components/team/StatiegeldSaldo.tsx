"use client";

import { useState } from "react";
import { Loader2, Smartphone, Wallet } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { StatusBadge } from "@/components/ui/Badge";
import { cn, formatEuro, formatVoortgang, WALLET_PAYOUT_MINIMUM_EURO } from "@/lib/utils";
import type { StatiegeldInlevering } from "@/lib/types";

/**
 * Toont het openstaande saldo van de Virtuele Portemonnee en de
 * "Reken af via iDEAL"-knop — pas klikbaar zodra het saldo de
 * €20-drempel haalt, om de vaste Stripe/iDEAL-transactiekosten niet op
 * elk klein bonnetje afzonderlijk te laten drukken.
 */
export function StatiegeldSaldo({
  spelerId,
  inleveringen,
}: {
  spelerId: string;
  inleveringen: StatiegeldInlevering[];
}) {
  const [bezig, setBezig] = useState(false);
  const [foutmelding, setFoutmelding] = useState<string | null>(null);

  const pending = inleveringen.filter((i) => i.status === "pending");
  const saldo = Math.round(pending.reduce((som, i) => som + i.bedrag, 0) * 100) / 100;
  const kanAfrekenen = saldo >= WALLET_PAYOUT_MINIMUM_EURO;
  const voortgang = formatVoortgang(saldo, WALLET_PAYOUT_MINIMUM_EURO);

  async function rekenAf() {
    setBezig(true);
    setFoutmelding(null);

    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "wallet_payout", speler_id: spelerId }),
      });
      const json = await res.json();

      if (!res.ok || !json.checkoutUrl) {
        setFoutmelding(json.error ?? "Kon de afrekening niet starten.");
        setBezig(false);
        return;
      }

      window.location.href = json.checkoutUrl;
    } catch {
      setFoutmelding("Kon geen verbinding maken. Probeer het opnieuw.");
      setBezig(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <p className="flex items-center gap-1.5 text-sm text-gray-500">
          <Wallet className="h-4 w-4" /> Openstaand saldo
        </p>
        <p className="mt-1 text-3xl font-extrabold text-gray-900">
          <AnimatedNumber value={saldo} format={formatEuro} />
        </p>

        <div className="mt-4 space-y-1.5">
          <ProgressBar percentage={voortgang} />
          <p className="text-xs text-gray-500">
            {kanAfrekenen
              ? "Je saldo is hoog genoeg om af te rekenen."
              : `Spaar door tot ${formatEuro(WALLET_PAYOUT_MINIMUM_EURO)} om af te rekenen.`}
          </p>
        </div>

        {foutmelding && <p className="mt-3 text-sm text-red-600">{foutmelding}</p>}

        <Button className="mt-4 w-full" disabled={!kanAfrekenen || bezig} onClick={rekenAf}>
          {bezig ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Bezig met starten…
            </>
          ) : (
            <>
              <Smartphone className="h-4 w-4" /> Reken af via iDEAL
            </>
          )}
        </Button>
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
