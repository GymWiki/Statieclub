"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Package, Wine, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { OphaalForm } from "@/components/donor/OphaalForm";
import { GlasNaarKasForm } from "@/components/donor/GlasNaarKasForm";
import type { Doel } from "@/lib/types";

type OphaalType = "statiegeld" | "glasbak";

/**
 * Type-keuzescherm vóór het eigenlijke ophaalformulier: "Statiegeld
 * Ophalen" (bestaande flow, `OphaalForm`) vs. de premium "Glas-naar-
 * Kas"-service (`GlasNaarKasForm`) — enkel getoond als minstens één
 * team van deze club die service heeft aangezet
 * (`glasServiceBeschikbaar`), anders zou een donateur een verzoek
 * kunnen plaatsen dat nooit geclaimd wordt.
 */
export function OphaalFlow({
  clubId,
  clubNaam,
  doelen,
  glasServiceBeschikbaar,
  initieelType,
}: {
  clubId: string;
  clubNaam: string;
  doelen: Doel[];
  glasServiceBeschikbaar: boolean;
  /** Vooringesteld type, bijv. vanuit een `?type=glasbak`-link op promotiemateriaal (zie lib/promo.ts). */
  initieelType?: OphaalType | null;
}) {
  const [gekozenType, setGekozenType] = useState<OphaalType | null>(
    initieelType === "glasbak" && glasServiceBeschikbaar ? "glasbak" : initieelType === "statiegeld" ? "statiegeld" : null
  );

  if (gekozenType === "statiegeld") {
    return <OphaalForm clubId={clubId} clubNaam={clubNaam} doelen={doelen} onTerug={() => setGekozenType(null)} />;
  }
  if (gekozenType === "glasbak") {
    return (
      <GlasNaarKasForm clubId={clubId} clubNaam={clubNaam} doelen={doelen} onTerug={() => setGekozenType(null)} />
    );
  }

  return (
    <div className="space-y-3">
      <motion.button
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setGekozenType("statiegeld")}
        className="block w-full text-left"
      >
        <Card className="flex items-center gap-4 p-5 transition-shadow hover:shadow-md">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-100 text-brand-700">
            <Package className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gray-900">Statiegeld Ophalen</p>
            <p className="text-sm text-gray-500">Een team haalt je lege flessen en blikjes op.</p>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-gray-300" />
        </Card>
      </motion.button>

      {glasServiceBeschikbaar && (
        <motion.button
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setGekozenType("glasbak")}
          className="block w-full text-left"
        >
          <Card className="flex items-center gap-4 border-violet-200 bg-gradient-to-br from-violet-50 to-white p-5 transition-shadow hover:shadow-md">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-violet-100 text-violet-700">
              <Wine className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-gray-900">Naar de Glas-naar-Kas Service</p>
              <p className="text-sm text-gray-500">
                Betaal een vaste donatie, een team gooit je glas of oud papier voor je weg.
              </p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-violet-400" />
          </Card>
        </motion.button>
      )}
    </div>
  );
}
