"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, Bike, BarChart3, ArrowRight, type LucideIcon } from "lucide-react";
import { useFadeUpVariants } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface Rol {
  icon: LucideIcon;
  titel: string;
  beschrijving: string;
  ctaLabel: string;
  href: string;
  hoverBorder: string;
  iconBg: string;
  iconText: string;
  ctaText: string;
}

const ROLLEN: Rol[] = [
  {
    icon: Heart,
    titel: "Ik wil doneren",
    beschrijving:
      "Lever je statiegeld in bij een club om de hoek — geen account, geen moeite, wij regelen de rest.",
    ctaLabel: "Zoek een club",
    href: "/donateren",
    hoverBorder: "hover:border-emerald-300/70",
    iconBg: "bg-emerald-100",
    iconText: "text-emerald-600",
    ctaText: "text-emerald-700",
  },
  {
    icon: Bike,
    titel: "Ik ben speler",
    beschrijving: "Scan je bonnetjes, klim op het live scorebord en verzamel badges voor je team.",
    ctaLabel: "Inloggen als speler",
    href: "/speler",
    hoverBorder: "hover:border-amber-300/70",
    iconBg: "bg-amber-100",
    iconText: "text-amber-600",
    ctaText: "text-amber-700",
  },
  {
    icon: BarChart3,
    titel: "Ik beheer een club",
    beschrijving:
      "Zet campagnes op en volg de voortgang live — zonder ooit een spreadsheet aan te raken.",
    ctaLabel: "Registreer je club",
    href: "/admin/nieuwe-club",
    hoverBorder: "hover:border-blue-300/70",
    iconBg: "bg-blue-100",
    iconText: "text-blue-600",
    ctaText: "text-blue-700",
  },
];

export function RoleSelector() {
  const item = useFadeUpVariants();

  return (
    <section className="relative py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={item}
          className="mx-auto max-w-xl text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Wie ben jij?</p>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Statiegeld voor iedereen die meedoet
          </h2>
        </motion.div>

        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
          {ROLLEN.map((rol, index) => (
            <motion.div
              key={rol.titel}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={item}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -6 }}
              className={cn(
                "group flex flex-col rounded-3xl border border-slate-900/5 bg-white/60 p-7 shadow-sm backdrop-blur-xl transition-shadow hover:shadow-xl hover:shadow-slate-900/5",
                rol.hoverBorder
              )}
            >
              <div className={cn("grid h-12 w-12 place-items-center rounded-2xl", rol.iconBg)}>
                <rol.icon className={cn("h-6 w-6", rol.iconText)} />
              </div>
              <h3 className="mt-5 font-display text-xl font-bold text-slate-900">{rol.titel}</h3>
              <p className="mt-2 flex-1 text-sm text-slate-600">{rol.beschrijving}</p>
              <Link
                href={rol.href}
                className={cn(
                  "mt-6 inline-flex items-center gap-1.5 text-sm font-semibold transition-transform group-hover:translate-x-0.5",
                  rol.ctaText
                )}
              >
                {rol.ctaLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
