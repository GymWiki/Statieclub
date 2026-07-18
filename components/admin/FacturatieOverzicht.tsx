"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CreditCard, Loader2, Receipt, TrendingUp, Wallet } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { ROLLOVER_DREMPEL_EURO } from "@/lib/mollieConstants";
import { formatEuro, PLATFORM_FEE_PERCENTAGE } from "@/lib/utils";
import type { Club, PlatformIncasso } from "@/lib/types";

const MAAND_NAMEN = [
  "januari", "februari", "maart", "april", "mei", "juni",
  "juli", "augustus", "september", "oktober", "november", "december",
];

function formatMaandJaar(maand: number, jaar: number): string {
  return `${MAAND_NAMEN[maand - 1] ?? maand} ${jaar}`;
}

export function FacturatieOverzicht({
  club,
  initialDezeMaandOpgehaald,
  initialIncassos,
}: {
  club: Club;
  initialDezeMaandOpgehaald: number;
  initialIncassos: PlatformIncasso[];
}) {
  const [bezig, setBezig] = useState(false);
  const [foutmelding, setFoutmelding] = useState<string | null>(null);

  const heeftMandaat = !!club.mollie_mandate_id;
  const wordtGeincasseerd = club.openstaand_saldo_fee >= ROLLOVER_DREMPEL_EURO;

  async function activeerAutomatischeIncasso() {
    setBezig(true);
    setFoutmelding(null);

    try {
      const res = await fetch("/api/mollie/create-mandate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ club_id: club.id }),
      });
      const json = await res.json();

      if (!res.ok || !json.checkoutUrl) {
        setFoutmelding(json.error ?? "Kon de verificatiebetaling niet starten.");
        setBezig(false);
        return;
      }

      window.location.href = json.checkoutUrl;
    } catch {
      setFoutmelding("Kon geen verbinding maken met Mollie. Probeer het later opnieuw.");
      setBezig(false);
    }
  }

  if (!heeftMandaat) {
    return (
      <Card className="p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-amber-100 p-2 text-amber-700">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-gray-900">Automatische incasso nog niet actief</h2>
            <p className="mt-1 text-sm text-gray-600">
              Statieclub rekent {PLATFORM_FEE_PERCENTAGE}% platformfee over het opgehaalde statiegeld. Om
              micro-betalingen te voorkomen, wordt deze fee via SEPA Automatische Incasso maandelijks geïnd —
              maar pas zodra het openstaande bedrag minimaal {formatEuro(ROLLOVER_DREMPEL_EURO)} is. Activeer dit
              hieronder met een eenmalige verificatiebetaling van {formatEuro(0.01)} via iDeal.
            </p>
            {foutmelding && <p className="mt-2 text-sm font-medium text-red-600">{foutmelding}</p>}
            <Button className="mt-4" onClick={activeerAutomatischeIncasso} disabled={bezig}>
              {bezig ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Bezig met starten…
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4" /> Activeer Automatische Incasso (€0,01 verificatie via iDeal)
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card className="p-5">
            <p className="flex items-center gap-1.5 text-sm text-gray-500">
              <Wallet className="h-4 w-4" /> Deze maand opgehaald
            </p>
            <p className="mt-1 text-3xl font-extrabold text-gray-900">
              <AnimatedNumber value={initialDezeMaandOpgehaald} format={formatEuro} />
            </p>
            <p className="mt-1 text-xs text-gray-400">Statiegeld + Glas-naar-Kas, goedgekeurd</p>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}>
          <Card className="p-5">
            <p className="flex items-center gap-1.5 text-sm text-gray-500">
              <TrendingUp className="h-4 w-4" /> Huidige platform fee ({PLATFORM_FEE_PERCENTAGE}%)
            </p>
            <p className="mt-1 text-3xl font-extrabold text-brand-700">
              <AnimatedNumber value={club.openstaand_saldo_fee} format={formatEuro} />
            </p>
            <span
              className={
                "mt-2 inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold " +
                (wordtGeincasseerd
                  ? "border-status-open/30 bg-status-open/10 text-status-open"
                  : "border-amber-300 bg-amber-100 text-amber-700")
              }
            >
              {wordtGeincasseerd
                ? "Wordt geïncasseerd op de 1e"
                : `Schuift door naar volgende maand (minimum ${formatEuro(ROLLOVER_DREMPEL_EURO)})`}
            </span>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
          <Card className="p-5">
            <p className="flex items-center gap-1.5 text-sm text-gray-500">
              <Receipt className="h-4 w-4" /> Facturen geïncasseerd
            </p>
            <p className="mt-1 text-3xl font-extrabold text-gray-900">
              <AnimatedNumber value={initialIncassos.filter((i) => i.status === "paid").length} />
            </p>
            <p className="mt-1 text-xs text-gray-400">Automatische SEPA-incasso via Mollie</p>
          </Card>
        </motion.div>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-gray-100 px-4 py-3">
          <h2 className="font-semibold text-gray-900">Factuurhistorie</h2>
        </div>
        {initialIncassos.length === 0 ? (
          <p className="px-4 py-6 text-sm text-gray-400">
            Nog geen afschrijvingen — zodra de fee de rollover-drempel haalt, verschijnt hier de eerste incasso.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-2.5">Periode</th>
                <th className="px-4 py-2.5 text-right">Bedrag</th>
                <th className="px-4 py-2.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {initialIncassos.map((incasso) => (
                <tr key={incasso.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {formatMaandJaar(incasso.maand, incasso.jaar)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">{formatEuro(incasso.bedrag)}</td>
                  <td className="px-4 py-3 text-right">
                    <StatusBadge status={incasso.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
