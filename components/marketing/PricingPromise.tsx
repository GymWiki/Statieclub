"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { useFadeUpVariants, useCountUp } from "@/lib/motion";
import { ProgressBar } from "@/components/ui/ProgressBar";

const VOORDELEN = [
  "Geen opstartkosten",
  "Geen maandelijkse abonnementskosten",
  "No cure, no pay (haal je niks op, dan kost het niks)",
];

/**
 * "Een eerlijk verdienmodel" — transparantie-sectie voor clubbesturen,
 * direct onder de Impact-cijfers. Bewust géén taart-/donutgrafiek voor
 * de 95/5-verdeling (twee segmenten lezen daar zwak in) maar een
 * "meter": één percentage dat oploopt, met de vulling als het echte
 * signaal — precies wat hier ook inhoudelijk klopt, want de 5% is geen
 * gelijkwaardige tweede categorie maar de rest van de pot.
 */
export function PricingPromise() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const item = useFadeUpVariants();
  const percentage = useCountUp(95, inView, 1400);

  return (
    <section id="prijzen" ref={ref} className="scroll-mt-20 bg-gradient-to-b from-white to-brand-50/60 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <motion.div
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={item}
          className="overflow-hidden rounded-[2.5rem] border border-slate-900/5 bg-white/70 p-8 shadow-xl shadow-brand-900/5 backdrop-blur-xl sm:p-12"
        >
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
            {/* Links: de belofte */}
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
                Een eerlijk verdienmodel. Zonder addertjes.
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Eerlijk, simpel en 100% risicovrij.
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Wij houden niet van verborgen kosten of dure abonnementen. Bij Statieclub verdien je vanaf de
                eerste fles.
              </p>

              <ul className="mt-6 space-y-3">
                {VOORDELEN.map((voordeel) => (
                  <li key={voordeel} className="flex items-start gap-2.5 text-slate-700">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
                    <span>{voordeel}</span>
                  </li>
                ))}
              </ul>

              <Link href="/admin/nieuwe-club" className="mt-8 inline-block">
                <motion.span
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 rounded-full bg-brand-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-brand-600/30 transition-colors hover:bg-brand-700"
                >
                  Start direct (gratis aanmelden)
                  <ArrowRight className="h-4 w-4" />
                </motion.span>
              </Link>
            </div>

            {/* Rechts: de uitsplitsing */}
            <div className="rounded-3xl border border-brand-100 bg-white p-7 shadow-sm sm:p-8">
              <p className="text-sm font-medium text-slate-500">Waar gaat jouw statiegeld naartoe?</p>
              <p className="mt-1 font-display text-5xl font-extrabold tabular-nums text-brand-600 sm:text-6xl">
                {Math.round(percentage)}%
              </p>

              <div className="mt-4">
                <ProgressBar percentage={percentage} />
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-start gap-3 rounded-2xl bg-brand-50 p-4">
                  <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-600" />
                  <div>
                    <p className="font-semibold text-slate-900">95% — Naar de club</p>
                    <p className="mt-0.5 text-sm text-slate-600">
                      Jullie houden het leeuwendeel. Direct gestort op de clubrekening.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4">
                  <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-slate-300" />
                  <div>
                    <p className="font-semibold text-slate-600">5% — Platformkosten</p>
                    <p className="mt-0.5 text-sm text-slate-500">
                      Dit gebruiken wij om de app in de lucht te houden, de slimme bonnetjes-scanner te betalen
                      en het platform te verbeteren. Eerlijk is eerlijk.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
