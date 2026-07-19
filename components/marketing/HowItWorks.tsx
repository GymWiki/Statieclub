"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  MapPin,
  Target,
  Bike,
  Users,
  Zap,
  Award,
  Wallet,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { useFadeUpVariants } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { ROL_ACCENT, type RolKey } from "@/lib/rollen";

interface Stap {
  label: string;
  titel: string;
  beschrijving: string;
  icon: LucideIcon;
}

interface RolStappen {
  eyebrow: string;
  stappen: [Stap, Stap, Stap];
}

const STAPPEN: Record<RolKey, RolStappen> = {
  bestuur: {
    eyebrow: "Voor bestuursleden",
    stappen: [
      {
        label: "Stap 1",
        titel: "Start een actie en stel de doelen in",
        beschrijving: "Zet in een paar minuten een campagne op en bepaal waarvoor de club inzamelt.",
        icon: Target,
      },
      {
        label: "Stap 2",
        titel: "Leden en buurtbewoners zamelen in",
        beschrijving: "Zowel het team als de buurt kan flessen aanbieden — samen halen ze meer op.",
        icon: Users,
      },
      {
        label: "Stap 3",
        titel: "Behoud overzicht terwijl het systeem afrekent",
        beschrijving: "Na sluiting verstuurt het systeem automatisch de betaalverzoeken. Jij hoeft niets te doen.",
        icon: Zap,
      },
    ],
  },
  lid: {
    eyebrow: "Voor clubleden",
    stappen: [
      {
        label: "Stap 1",
        titel: "Verzamel statiegeld en claim ophaalverzoeken",
        beschrijving: "Scan je eigen bonnetjes of claim een ophaalverzoek van een buurtbewoner in de buurt.",
        icon: MapPin,
      },
      {
        label: "Stap 2",
        titel: "Verdien badges en scoor punten voor je team",
        beschrijving: "Elke fles telt mee op het scorebord — klim samen met je team naar de top.",
        icon: Award,
      },
      {
        label: "Stap 3",
        titel: "Betaal je virtuele portemonnee via iDEAL",
        beschrijving: "Spaar je bonnetjes op in de app en reken pas aan het eind alles in één keer af.",
        icon: Wallet,
      },
    ],
  },
  donateur: {
    eyebrow: "Voor buurtbewoners",
    stappen: [
      {
        label: "Stap 1",
        titel: "Geef door wat je hebt staan",
        beschrijving: "Vul je postcode in en geef aan hoeveel statiegeld er bij jou klaarstaat.",
        icon: MapPin,
      },
      {
        label: "Stap 2",
        titel: "Een clublid komt het ophalen",
        beschrijving: "Een jeugdteam fietst langs en haalt je flessen op. Jij hoeft nergens heen.",
        icon: Bike,
      },
      {
        label: "Stap 3",
        titel: "Betaal de donatie veilig online aan de club",
        beschrijving: "Reken direct en vertrouwd af via iDEAL — je steun komt meteen bij de club terecht.",
        icon: ShieldCheck,
      },
    ],
  },
};

/**
 * Rol-afhankelijke 3-stappen-uitleg. De stappen wisselen volledig mee
 * met `activeRole` (AnimatePresence-fade, net als Features en
 * HeroSelector) zodat elke bezoeker alleen het proces ziet dat voor
 * hem/haar relevant is. Het `id="hoe-het-werkt"` anchor blijft bestaan
 * zodat de Nav-link en Footer-link blijven werken, ongeacht de actieve rol.
 */
export function HowItWorks({ activeRole }: { activeRole: RolKey }) {
  const item = useFadeUpVariants();
  const content = STAPPEN[activeRole];
  const accent = ROL_ACCENT[activeRole];

  return (
    <section id="hoe-het-werkt" className="scroll-mt-20 bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
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
              className="mx-auto max-w-xl text-center"
            >
              <p className={cn("text-sm font-semibold uppercase tracking-wide", accent.tekst)}>{content.eyebrow}</p>
              <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Hoe het werkt
              </h2>
            </motion.div>

            <div className="relative mt-16 grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-8">
              {/* Route-lijn: verbindt de stappen als een letterlijk pad, alleen op desktop */}
              <div
                className={cn(
                  "absolute left-[16.5%] right-[16.5%] top-8 hidden border-t-2 border-dashed md:block",
                  activeRole === "bestuur" && "border-blue-200",
                  activeRole === "lid" && "border-amber-200",
                  activeRole === "donateur" && "border-emerald-200"
                )}
                aria-hidden="true"
              />

              {content.stappen.map((stap, index) => (
                <motion.div
                  key={stap.titel}
                  initial="hidden"
                  animate="visible"
                  variants={item}
                  transition={{ delay: index * 0.15 }}
                  className="relative flex flex-col items-center text-center"
                >
                  <div className={cn("relative z-10 grid h-16 w-16 place-items-center rounded-full border", accent.bgZacht, activeRole === "bestuur" ? "border-blue-100" : activeRole === "lid" ? "border-amber-100" : "border-emerald-100")}>
                    <stap.icon className={cn("h-7 w-7", accent.tekst)} strokeWidth={2} />
                  </div>
                  <p className={cn("mt-5 text-xs font-semibold uppercase tracking-wide", accent.tekst)}>
                    {stap.label}
                  </p>
                  <h3 className="mt-1.5 font-display text-xl font-bold text-slate-900">{stap.titel}</h3>
                  <p className="mt-2 max-w-[22rem] text-sm text-slate-600">{stap.beschrijving}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
