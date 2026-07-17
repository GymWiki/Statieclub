"use client";

import { motion, useReducedMotion } from "framer-motion";

/** Dummy activiteiten — puur voor het "levende platform"-gevoel op de marketing-site. */
const ACTIVITEITEN = [
  "💸 Zojuist gescand: €4,15 door Tim (JO11, SV Meteoor)",
  "📬 Nieuw ophaalverzoek geplaatst in postcode 1012AB",
  "🎯 Clubspaardoel 'Nieuwe Tenues' bereikt voor 80%!",
  "🏆 Badge 'Wijkagent' ontgrendeld door Sanne (HC Groenoord)",
  "🔥 5 teams zijn deze week actief aan het scannen",
  "💸 Zojuist gescand: €7,50 door Noah (JO13-2, VV Bataven)",
];

export function ActivityTicker() {
  const reduced = useReducedMotion();

  return (
    <div className="relative overflow-hidden border-y border-slate-900/5 bg-white/60 py-3 backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white to-transparent" />

      <motion.div
        className="flex w-max items-center gap-8"
        animate={reduced ? undefined : { x: ["0%", "-50%"] }}
        transition={{ duration: 34, ease: "linear", repeat: Infinity }}
      >
        {/* Content 2x achter elkaar voor een naadloze loop (animatie verschuift precies één set op). */}
        {[...ACTIVITEITEN, ...ACTIVITEITEN].map((tekst, i) => (
          <span key={i} className="flex items-center gap-8 whitespace-nowrap text-sm font-medium text-slate-600">
            {tekst}
            <span className="text-slate-300" aria-hidden="true">
              •
            </span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}
