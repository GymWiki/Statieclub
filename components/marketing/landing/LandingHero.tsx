"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useFadeUpVariants } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { ROL_ACCENT } from "@/lib/rollen";

/**
 * Statische hero voor de sport-/use-case-landingspagina's — zelfde
 * mesh-gradient-achtergrond en visuele taal als `HeroSelector`, maar
 * zonder de rol-tabs: deze pagina's hebben altijd al een specifieke
 * doelgroep (het bestuur van die sport/vereniging), dus één vaste CTA
 * richting `/admin/nieuwe-club` i.p.v. een keuze.
 *
 * `icon` komt als al-gerenderd `ReactNode` binnen (i.p.v. een
 * `LucideIcon`-componentreferentie): de aanroepende server component
 * (`LandingPage`) rendert 'm vooraf, want een kale functiereferentie
 * kan niet over de server/client-grens als prop worden meegegeven
 * ("Functions cannot be passed directly to Client Components").
 */
export function LandingHero({
  eyebrow,
  icon,
  h1Regel1,
  h1Regel2,
  intro,
  ctaLabel,
}: {
  eyebrow: string;
  icon: ReactNode;
  h1Regel1: string;
  h1Regel2: string;
  intro: string;
  ctaLabel: string;
}) {
  const accent = ROL_ACCENT.bestuur;
  const item = useFadeUpVariants(16);

  return (
    <section className="relative overflow-hidden pb-20 pt-32 sm:pb-28 sm:pt-40">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0 bg-slate-50" />
        <div className="motion-safe:animate-mesh-drift absolute -left-24 top-0 h-[32rem] w-[32rem] rounded-full bg-blue-200/40 blur-3xl" />
        <div
          className="motion-safe:animate-mesh-drift absolute -right-32 top-10 h-[36rem] w-[36rem] rounded-full bg-emerald-100/40 blur-3xl"
          style={{ animationDelay: "4s" }}
        />
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={item}
        className="mx-auto flex max-w-3xl flex-col items-center px-5 text-center"
      >
        <span className={cn("flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold", accent.bgZacht, accent.tekst)}>
          {icon} {eyebrow}
        </span>

        <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl">
          {h1Regel1}
          <br />
          <span className={accent.tekst}>{h1Regel2}</span>
        </h1>

        <p className="mt-6 max-w-xl text-lg text-slate-600">{intro}</p>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="mt-10">
          <Link
            href="/admin/nieuwe-club"
            className={cn(
              "flex h-14 items-center justify-center gap-2 whitespace-nowrap rounded-full px-7 text-base font-semibold text-white shadow-lg transition-colors",
              accent.bg,
              accent.bgHover,
              accent.schaduw
            )}
          >
            {ctaLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>

        <p className="mt-8 text-sm text-slate-500">
          Ben je zelf donateur?{" "}
          <Link href="/donateren" className="font-semibold text-emerald-700 hover:underline">
            Zoek een club bij jou in de buurt
          </Link>
        </p>
      </motion.div>
    </section>
  );
}
