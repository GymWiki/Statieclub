"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { AlertTriangle, ExternalLink, Loader2, ShieldCheck, TrendingUp, Wallet } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { formatEuro, PLATFORM_FEE_PERCENTAGE } from "@/lib/utils";
import type { Club } from "@/lib/types";

export function FacturatieOverzicht({
  club,
  totaalOpgehaald,
}: {
  club: Club;
  totaalOpgehaald: number;
}) {
  const searchParams = useSearchParams();
  const zojuistTeruggekeerd = searchParams.get("stripe_return") === "true";

  const [bezig, setBezig] = useState(false);
  const [foutmelding, setFoutmelding] = useState<string | null>(null);

  const gekoppeld = !!club.stripe_account_id && club.onboarding_complete;
  const afgedragenFee = Math.round(totaalOpgehaald * (PLATFORM_FEE_PERCENTAGE / 100) * 100) / 100;

  async function koppelStripe() {
    setBezig(true);
    setFoutmelding(null);

    try {
      const res = await fetch("/api/stripe/create-connect-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ club_id: club.id }),
      });
      const json = await res.json();

      if (!res.ok || !json.accountLinkUrl) {
        setFoutmelding(json.error ?? "Kon de Stripe-koppeling niet starten.");
        setBezig(false);
        return;
      }

      window.location.href = json.accountLinkUrl;
    } catch {
      setFoutmelding("Kon geen verbinding maken met Stripe. Probeer het later opnieuw.");
      setBezig(false);
    }
  }

  async function openStripeDashboard() {
    setBezig(true);
    setFoutmelding(null);

    try {
      const res = await fetch("/api/stripe/create-dashboard-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ club_id: club.id }),
      });
      const json = await res.json();

      if (!res.ok || !json.dashboardUrl) {
        setFoutmelding(json.error ?? "Kon geen Stripe-dashboard-link aanmaken.");
        setBezig(false);
        return;
      }

      window.open(json.dashboardUrl, "_blank", "noopener,noreferrer");
    } finally {
      setBezig(false);
    }
  }

  if (!gekoppeld) {
    return (
      <Card className="p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-amber-100 p-2 text-amber-700">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-gray-900">Nog niet gekoppeld aan Stripe</h2>
            {zojuistTeruggekeerd && club.stripe_account_id ? (
              <p className="mt-1 text-sm text-amber-700">
                Je bent teruggekeerd van Stripe — we wachten nog op de laatste bevestiging dat je account
                helemaal klaar is. Dit duurt meestal maar even; ververs de pagina zo dadelijk.
              </p>
            ) : (
              <p className="mt-1 text-sm text-gray-600">
                Koppel de club bankrekening via Stripe om donaties te ontvangen. Statieclub rekent
                automatisch {PLATFORM_FEE_PERCENTAGE}% platformfee per donatie — de rest gaat rechtstreeks
                naar de clubrekening, zonder tussenkomst.
              </p>
            )}
            {foutmelding && <p className="mt-2 text-sm font-medium text-red-600">{foutmelding}</p>}
            <Button className="mt-4" onClick={koppelStripe} disabled={bezig}>
              {bezig ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Bezig met starten…
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" /> Koppel de club bankrekening via Stripe
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card className="p-5">
            <p className="flex items-center gap-1.5 text-sm text-gray-500">
              <Wallet className="h-4 w-4" /> Totaal binnengehaald via Stripe
            </p>
            <p className="mt-1 text-3xl font-extrabold text-gray-900">
              <AnimatedNumber value={totaalOpgehaald} format={formatEuro} />
            </p>
            <p className="mt-1 text-xs text-gray-400">Glas-naar-Kas-donaties, sinds koppeling</p>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}>
          <Card className="p-5">
            <p className="flex items-center gap-1.5 text-sm text-gray-500">
              <TrendingUp className="h-4 w-4" /> Afgedragen platformkosten ({PLATFORM_FEE_PERCENTAGE}%)
            </p>
            <p className="mt-1 text-3xl font-extrabold text-brand-700">
              <AnimatedNumber value={afgedragenFee} format={formatEuro} />
            </p>
            <p className="mt-1 text-xs text-gray-400">Automatisch ingehouden per donatie</p>
          </Card>
        </motion.div>
      </div>

      <Card className="flex items-center justify-between gap-4 p-5">
        <div>
          <h2 className="font-semibold text-gray-900">Uitbetalingen</h2>
          <p className="mt-1 text-sm text-gray-500">
            Bekijk je saldo, uitbetalingsschema en transactiegeschiedenis in het Stripe Express-dashboard.
          </p>
          {foutmelding && <p className="mt-2 text-sm font-medium text-red-600">{foutmelding}</p>}
        </div>
        <Button variant="secondary" onClick={openStripeDashboard} disabled={bezig} className="shrink-0">
          {bezig ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
          Bekijk uitbetalingen in Stripe
        </Button>
      </Card>
    </div>
  );
}
