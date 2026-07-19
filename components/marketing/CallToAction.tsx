"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BarChart3, Bike, Heart, type LucideIcon } from "lucide-react";
import { useFadeUpVariants } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { ROL_ACCENT, type RolKey } from "@/lib/rollen";

interface RolCta {
  icon: LucideIcon;
  heading: string;
  subtekst: string;
  ctaLabel: string;
  href: string;
}

const CTA: Record<RolKey, RolCta> = {
  bestuur: {
    icon: BarChart3,
    heading: "Klaar met saaie inzamelingsacties?",
    subtekst: "Zet vandaag nog een campagne op en volg de opbrengst live — zonder ooit een spreadsheet aan te raken.",
    ctaLabel: "Start een club-campagne (gratis)",
    href: "/admin/nieuwe-club",
  },
  lid: {
    icon: Bike,
    heading: "Klaar om het scorebord aan te voeren?",
    subtekst: "Log in als speler, scan je eerste bonnetje en verzamel meteen punten voor je team.",
    ctaLabel: "Log in als speler",
    href: "/speler",
  },
  donateur: {
    icon: Heart,
    heading: "Jouw statiegeld, hun nieuwe doeltjes",
    subtekst: "Vul je postcode in en laat een lokale club vandaag nog je flessen ophalen.",
    ctaLabel: "Zoek een club bij jou in de buurt",
    href: "/donateren",
  },
};

/**
 * Laatste, rol-afhankelijke CTA vlak voor de Faq — het sluitstuk van de
 * verhaallijn per doelgroep. Donkere sectie (net als de voormalige
 * ClubPitch) zodat de pagina eindigt met een duidelijk visueel anker
 * vóór de rustige Faq-sectie.
 */
export function CallToAction({ activeRole }: { activeRole: RolKey }) {
  const item = useFadeUpVariants();
  const content = CTA[activeRole];
  const accent = ROL_ACCENT[activeRole];

  return (
    <section className="bg-slate-900 py-20 sm:py-24">
      <div className="mx-auto max-w-3xl px-5 text-center lg:px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeRole}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              initial="hidden"
              animate="visible"
              variants={item}
              className={cn("mx-auto grid h-14 w-14 place-items-center rounded-2xl", accent.bg)}
            >
              <content.icon className="h-7 w-7 text-white" />
            </motion.div>

            <motion.h2
              initial="hidden"
              animate="visible"
              variants={item}
              className="mt-6 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl"
            >
              {content.heading}
            </motion.h2>

            <motion.p initial="hidden" animate="visible" variants={item} className="mt-4 text-slate-400">
              {content.subtekst}
            </motion.p>

            <motion.div initial="hidden" animate="visible" variants={item} className="mt-8 flex justify-center">
              <Link href={content.href}>
                <motion.span
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-7 py-3.5 text-base font-semibold text-white shadow-lg transition-colors",
                    accent.bg,
                    accent.bgHover,
                    accent.schaduw
                  )}
                >
                  {content.ctaLabel}
                  <ArrowRight className="h-4 w-4" />
                </motion.span>
              </Link>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
