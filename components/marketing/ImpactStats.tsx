"use client";

import { useRef } from "react";
import { motion, useInView, type Variants } from "framer-motion";
import { Recycle, TrendingDown, Heart, type LucideIcon } from "lucide-react";
import { useFadeUpVariants, useCountUp } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface Statistiek {
  icoon: LucideIcon;
  target: number;
  format: (n: number) => string;
  label: string;
  subtekst: string;
  accent: string;
  iconBg: string;
}

const STATISTIEKEN: Statistiek[] = [
  {
    icoon: Recycle,
    target: 3_000_000_000,
    format: (n) => `${(n / 1_000_000_000).toFixed(1).replace(/\.0$/, "")} Miljard+`,
    label: "Flessen & blikjes per jaar",
    subtekst: "Zoveel statiegeldverpakkingen gaan er jaarlijks over de toonbank in Nederland.",
    accent: "text-blue-400",
    iconBg: "bg-blue-500/15",
  },
  {
    icoon: TrendingDown,
    target: 87_000_000,
    format: (n) => `€${Math.round(n).toLocaleString("nl-NL")}`,
    label: "Blijft ongeclaimd",
    subtekst: "Dit bedrag belandt jaarlijks in de prullenbak of op straat. Zonde!",
    accent: "text-red-400",
    iconBg: "bg-red-500/15",
  },
  {
    icoon: Heart,
    target: 100,
    format: (n) => `${Math.round(n)}%`,
    label: "Naar lokaal talent",
    subtekst:
      "Laat dat geld niet verdwijnen. Via Statieclub gaat jouw vergeten statiegeld direct naar de jeugd in jouw buurt.",
    accent: "text-emerald-400",
    iconBg: "bg-emerald-500/15",
  },
];

function StatKaart({
  stat,
  actief,
  index,
  variants,
}: {
  stat: Statistiek;
  actief: boolean;
  index: number;
  variants: Variants;
}) {
  const waarde = useCountUp(stat.target, actief);
  const Icon = stat.icoon;

  return (
    <motion.div
      initial="hidden"
      animate={actief ? "visible" : "hidden"}
      variants={variants}
      transition={{ delay: index * 0.12 }}
      className="flex flex-col items-center rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center"
    >
      <div className={cn("grid h-14 w-14 place-items-center rounded-2xl", stat.iconBg)}>
        <Icon className={cn("h-7 w-7", stat.accent)} />
      </div>
      <p className={cn("mt-5 font-display text-4xl font-extrabold tabular-nums sm:text-5xl", stat.accent)}>
        {stat.format(waarde)}
      </p>
      <p className="mt-2 text-lg font-semibold text-white">{stat.label}</p>
      <p className="mt-2 text-sm text-slate-400">{stat.subtekst}</p>
    </motion.div>
  );
}

/**
 * "De Harde Cijfers" — emotionele overtuigingssectie direct onder de
 * Role Selector: benadrukt hoeveel statiegeld er jaarlijks ongeclaimd
 * blijft, vóórdat de bezoeker bij de uitleg (HowItWorks) komt. Breekt
 * bewust met de lichte pagina (bg-slate-900) — zelfde donkere
 * behandeling als de bestuurders-sectie (ClubPitch) verderop, zodat
 * het niet als een losse stijlbreuk aanvoelt.
 */
export function ImpactStats() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const item = useFadeUpVariants();

  return (
    <section ref={ref} className="bg-slate-900 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <motion.div
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={item}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-wide text-red-400">De harde cijfers</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Er ligt letterlijk geld op straat
          </h2>
          <p className="mt-3 text-slate-400">
            Elk jaar verdwijnt er een fortuin aan statiegeld — geld dat net zo goed naar de jeugdclub om de
            hoek had kunnen gaan.
          </p>
        </motion.div>

        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
          {STATISTIEKEN.map((stat, i) => (
            <StatKaart key={stat.label} stat={stat} actief={inView} index={i} variants={item} />
          ))}
        </div>

        <p className="mx-auto mt-10 max-w-2xl text-center text-xs text-slate-400/70">
          * Bron: cijfers gebaseerd op rapportages van{" "}
          <a
            href="https://www.statiegeldnederland.nl"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-slate-500 underline-offset-2 hover:text-slate-300"
          >
            Statiegeld Nederland
          </a>{" "}
          en de Inspectie Leefomgeving en Transport (ILT).
        </p>
      </div>
    </section>
  );
}
