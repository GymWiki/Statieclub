"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, PartyPopper } from "lucide-react";
import { formatEuro } from "@/lib/utils";
import type { Betaalverzoek } from "@/lib/types";

const POLL_INTERVAL_MS = 10000;

type BetaalverzoekMetContext = Betaalverzoek & { doelen: { titel: string } | null };

/**
 * "Set and Forget"-campagne-afrekening: zodra een actie automatisch
 * (of handmatig) is afgerond en dit clublid €1+ heeft opgespaard, komt
 * hier meteen een betaalverzoek-banner te staan — zichtbaar op elk
 * scherm binnen de club-shell, niet pas op een aparte pagina. Pollt
 * periodiek en verdwijnt vanzelf zodra het webhook de status op
 * 'betaald' heeft gezet.
 */
export function BetaalverzoekBanner({ spelerId }: { spelerId: string }) {
  const [openVerzoeken, setOpenVerzoeken] = useState<BetaalverzoekMetContext[]>([]);

  const laad = useCallback(async () => {
    if (!spelerId) return;
    const res = await fetch(`/api/betaalverzoeken?speler_id=${spelerId}&status=open`);
    if (res.ok) {
      const json = await res.json();
      setOpenVerzoeken(json.betaalverzoeken ?? []);
    }
  }, [spelerId]);

  useEffect(() => {
    laad();
    const interval = setInterval(laad, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [laad]);

  return (
    <AnimatePresence initial={false}>
      {openVerzoeken.map((verzoek) => (
        <motion.a
          key={verzoek.id}
          href={`/api/checkout/${verzoek.id}`}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="flex items-center gap-3 border-b border-amber-200 bg-gradient-to-r from-amber-50 to-amber-100 px-4 py-3 text-sm"
        >
          <PartyPopper className="h-5 w-5 shrink-0 text-amber-600" />
          <span className="flex-1 font-medium text-amber-900">
            {verzoek.doelen?.titel ? `Actie ${verzoek.doelen.titel} is gesloten!` : "Een actie is gesloten!"} Je
            hebt {formatEuro(verzoek.bedrag)} opgehaald. Klik hier om via iDEAL af te rekenen.
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-amber-600" />
        </motion.a>
      ))}
    </AnimatePresence>
  );
}
