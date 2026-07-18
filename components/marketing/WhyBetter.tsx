"use client";

import { motion } from "framer-motion";
import { Smile, RefreshCw, Leaf, Gamepad2, type LucideIcon } from "lucide-react";
import { useFadeUpVariants, staggerDelay } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface Voordeel {
  icoon: LucideIcon;
  kop: string;
  tekst: string;
  iconBg: string;
  iconText: string;
}

const VOORDELEN: Voordeel[] = [
  {
    icoon: Smile,
    kop: "Nul drempel voor de buurt",
    tekst:
      "Bewoners hoeven geen 'nieuw' geld uit te geven of onnodige loten te kopen. Ze geven simpelweg hun lege flessen mee. Doneren was nog nooit zo makkelijk en voelt niet als betalen.",
    iconBg: "bg-amber-100",
    iconText: "text-amber-600",
  },
  {
    icoon: RefreshCw,
    kop: "Acties én altijd open",
    tekst:
      "Organiseer een grootse actiezaterdag met het hele team, of zet de clubpagina het hele jaar door open voor de buurt. Zo beperk je de stress van die ene actieweek en bepaal je zelf hoe en wanneer de teller van de clubkas oploopt.",
    iconBg: "bg-blue-100",
    iconText: "text-blue-600",
  },
  {
    icoon: Leaf,
    kop: "Goed voor de club én de buurt",
    tekst:
      "In plaats van koeken verkopen, ruimt jullie jeugd letterlijk de buurt op. Een prachtig visitekaartje voor de club, dat perfect past bij een duurzaam imago.",
    iconBg: "bg-brand-100",
    iconText: "text-brand-700",
  },
  {
    icoon: Gamepad2,
    kop: "Motiveren hoeft niet meer",
    tekst:
      "Jeugdleden hoef je niet meer te dwingen om langs de deuren te gaan. Door de badges, streaks en teambattles is het ophalen van flessen een spel geworden dat ze uit zichzelf willen spelen.",
    iconBg: "bg-violet-100",
    iconText: "text-violet-600",
  },
];

/**
 * "Meer opbrengst. Minder moeite." — het directe vergelijkingsargument
 * t.o.v. traditionele fondsenwerving (loten, koeken), geplaatst na de
 * bento-grid-showcase (ClubPitch) als sluitstuk vlak vóór de Faq.
 */
export function WhyBetter() {
  const item = useFadeUpVariants();

  return (
    <section className="bg-slate-50 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={item}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Meer opbrengst. Minder moeite. 100% Groen.
          </h2>
          <p className="mt-3 text-lg text-slate-600">
            Waarom Statieclub de traditionele clubacties verslaat.
          </p>
        </motion.div>

        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {VOORDELEN.map((voordeel, i) => {
            const Icon = voordeel.icoon;
            return (
              <motion.div
                key={voordeel.kop}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-80px" }}
                variants={item}
                {...staggerDelay(i)}
                whileHover={{ y: -4 }}
                className="rounded-3xl border border-slate-900/5 bg-white/70 p-7 shadow-sm backdrop-blur-xl"
              >
                <div className={cn("grid h-12 w-12 place-items-center rounded-2xl", voordeel.iconBg)}>
                  <Icon className={cn("h-6 w-6", voordeel.iconText)} />
                </div>
                <h3 className="mt-5 font-display text-xl font-bold text-slate-900">{voordeel.kop}</h3>
                <p className="mt-2 text-slate-600">{voordeel.tekst}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
