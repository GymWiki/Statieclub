"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Trophy } from "lucide-react";
import type { Badge } from "@/lib/types";

/**
 * Toont nieuw ontgrendelde badges na een scan, één voor één, boven de
 * rest van de UI. Zelfsluitend — de aanroeper geeft enkel de lijst met
 * nieuwe badges door zodra de scan-response binnenkomt.
 */
export function NieuweBadgeToasts({ badges }: { badges: Badge[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [badges]);

  useEffect(() => {
    if (index >= badges.length) return;
    const timer = setTimeout(() => setIndex((i) => i + 1), 3200);
    return () => clearTimeout(timer);
  }, [index, badges.length]);

  const badge = badges[index];

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <AnimatePresence mode="wait">
        {badge && (
          <motion.div
            key={badge.id}
            initial={{ y: -40, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -30, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 320, damping: 24 }}
            className="pointer-events-auto flex max-w-sm items-center gap-3 rounded-2xl border border-amber-300 bg-gradient-to-br from-amber-50 to-white px-4 py-3 shadow-xl"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100 text-2xl">
              {badge.icoon}
            </div>
            <div className="min-w-0">
              <p className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-amber-600">
                <Trophy className="h-3.5 w-3.5" /> Nieuwe badge ontgrendeld!
              </p>
              <p className="truncate font-bold text-gray-900">{badge.naam}</p>
              <p className="truncate text-xs text-gray-500">{badge.beschrijving}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
