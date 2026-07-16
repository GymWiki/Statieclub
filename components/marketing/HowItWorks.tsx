"use client";

import { motion } from "framer-motion";
import { MapPin, Target, Bike, type LucideIcon } from "lucide-react";
import { useFadeUpVariants } from "@/lib/motion";

const STAPPEN: { label: string; titel: string; beschrijving: string; icon: LucideIcon }[] = [
  {
    label: "Stap 1",
    titel: "Vul je postcode in",
    beschrijving: "We zoeken automatisch welke sportclubs bij jou in de buurt actief inzamelen.",
    icon: MapPin,
  },
  {
    label: "Stap 2",
    titel: "Kies een lokaal doel",
    beschrijving: "Van nieuwe doeltjes tot een verbouwde kantine — jij bepaalt wie je steunt.",
    icon: Target,
  },
  {
    label: "Stap 3",
    titel: "Zij halen het op!",
    beschrijving: "Een jeugdteam fietst langs en haalt je flessen op. Jij hoeft nergens heen.",
    icon: Bike,
  },
];

export function HowItWorks() {
  const item = useFadeUpVariants();

  return (
    <section id="hoe-het-werkt" className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={item}
          className="mx-auto max-w-xl text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">Voor buurtbewoners</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Hoe het werkt
          </h2>
        </motion.div>

        <div className="relative mt-16 grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-8">
          {/* Route-lijn: verbindt de stappen als een letterlijk fietspad, alleen op desktop */}
          <div
            className="absolute left-[16.5%] right-[16.5%] top-8 hidden border-t-2 border-dashed border-emerald-200 md:block"
            aria-hidden="true"
          />

          {STAPPEN.map((stap, index) => (
            <motion.div
              key={stap.titel}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={item}
              transition={{ delay: index * 0.15 }}
              className="relative flex flex-col items-center text-center"
            >
              <div className="relative z-10 grid h-16 w-16 place-items-center rounded-full border border-emerald-100 bg-emerald-50">
                <stap.icon className="h-7 w-7 text-emerald-600" strokeWidth={2} />
              </div>
              <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-emerald-600">
                {stap.label}
              </p>
              <h3 className="mt-1.5 font-display text-xl font-bold text-slate-900">{stap.titel}</h3>
              <p className="mt-2 max-w-[22rem] text-sm text-slate-600">{stap.beschrijving}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
