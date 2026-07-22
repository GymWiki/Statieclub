"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { useFadeUpVariants, staggerDelay } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { ROL_ACCENT } from "@/lib/rollen";

export interface GerenderdPijnPunt {
  icon: ReactNode;
  titel: string;
  tekst: string;
}

/**
 * Drie pagina-unieke pijnpunten — zelfde kaart-stijl als Features.tsx,
 * bewust probleemgericht i.p.v. voordeel-gericht. `icon` komt al
 * gerenderd binnen (zie LandingHero voor waarom: functiereferenties
 * kunnen niet als prop van server naar client component).
 */
export function LandingPainPoints({
  heading,
  punten,
}: {
  heading: string;
  punten: [GerenderdPijnPunt, GerenderdPijnPunt, GerenderdPijnPunt];
}) {
  const item = useFadeUpVariants();
  const accent = ROL_ACCENT.bestuur;

  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={item}
          className="mx-auto max-w-2xl text-center font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl"
        >
          {heading}
        </motion.h2>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {punten.map((punt, index) => (
            <motion.div
              key={punt.titel}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={item}
              {...staggerDelay(index)}
              className="rounded-3xl border border-slate-900/5 bg-slate-50 p-7"
            >
              <div className={cn("grid h-12 w-12 place-items-center rounded-2xl", accent.bgZacht, accent.tekst)}>
                {punt.icon}
              </div>
              <h3 className="mt-5 font-display text-lg font-bold text-slate-900">{punt.titel}</h3>
              <p className="mt-2 text-sm text-slate-600">{punt.tekst}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
