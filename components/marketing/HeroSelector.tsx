"use client";

import { FormEvent, ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, Bike, BarChart3, MapPin, ArrowRight, Loader2, type LucideIcon } from "lucide-react";
import { useFadeUpVariants } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { RolKey } from "@/lib/rollen";

interface RolContent {
  key: RolKey;
  tabLabel: string;
  icon: LucideIcon;
  koptekst: ReactNode;
  subtekst: string;
  ctaLabel: string;
  href: string;
  accentText: string;
  accentBg: string;
  accentRing: string;
}

const ROLLEN: RolContent[] = [
  {
    key: "donateur",
    tabLabel: "Voor Donateurs",
    icon: Heart,
    koptekst: (
      <>
        Jouw lege flessen.
        <br />
        <span className="text-emerald-600">Hun nieuwe doeltjes.</span>
      </>
    ),
    subtekst:
      "Steun lokaal talent zonder moeite. Geef je statiegeld aan een club in de buurt, en jeugdteams komen het juichend bij je ophalen.",
    ctaLabel: "Zoek een club bij jou in de buurt",
    href: "/donateren",
    accentText: "text-emerald-700",
    accentBg: "bg-emerald-500",
    accentRing: "focus-visible:ring-emerald-500/40",
  },
  {
    key: "lid",
    tabLabel: "Voor Clubleden",
    icon: Bike,
    koptekst: (
      <>
        Scan je bonnetjes.
        <br />
        <span className="text-amber-600">Klim op het scorebord.</span>
      </>
    ),
    subtekst:
      "Elke fles telt mee voor jouw team. Scan je bonnetje, zie je punten direct oplopen en verzamel badges terwijl het teamdoel dichterbij komt.",
    ctaLabel: "Log in als speler",
    href: "/speler",
    accentText: "text-amber-700",
    accentBg: "bg-amber-500",
    accentRing: "focus-visible:ring-amber-500/40",
  },
  {
    key: "bestuur",
    tabLabel: "Voor Besturen",
    icon: BarChart3,
    koptekst: (
      <>
        Fondsenwerving.
        <br />
        <span className="text-blue-600">Zonder spreadsheets.</span>
      </>
    ),
    subtekst:
      "Zet in een paar minuten een campagne op, volg de opbrengst live per team en verstuur automatisch de afrekening — wij regelen de rest.",
    ctaLabel: "Registreer je club",
    href: "/admin/nieuwe-club",
    accentText: "text-blue-700",
    accentBg: "bg-blue-500",
    accentRing: "focus-visible:ring-blue-500/40",
  },
];

/**
 * Dynamische hero bovenaan de landingspagina: drie tabs wisselen
 * koptekst/subtekst/CTA (AnimatePresence-fade) zodat elke bezoeker
 * meteen de voor hén relevante boodschap ziet. De actieve rol is een
 * lifted state uit `LandingPageContainer` — deze tabs sturen `onRoleChange`
 * aan i.p.v. eigen state te houden, zodat alle secties op de pagina
 * synchroon meewisselen. De donateur-tab behoudt de signature
 * postcode-zoeker (met radar-ping) — de andere twee tabs linken door
 * naar hun eigen instapscherm, dat geen postcode nodig heeft.
 */
export function HeroSelector({
  activeRole,
  onRoleChange,
}: {
  activeRole: RolKey;
  onRoleChange: (rol: RolKey) => void;
}) {
  const rol = ROLLEN.find((r) => r.key === activeRole)!;
  const item = useFadeUpVariants(16);

  return (
    <section className="relative overflow-hidden pb-24 pt-32 sm:pb-32 sm:pt-40">
      {/* Mesh gradient achtergrond — zacht bewegende, wazige kleurvlakken op het lichte canvas */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0 bg-slate-50" />
        <div className="motion-safe:animate-mesh-drift absolute -left-24 top-0 h-[32rem] w-[32rem] rounded-full bg-emerald-200/50 blur-3xl" />
        <div
          className="motion-safe:animate-mesh-drift absolute -right-32 top-10 h-[36rem] w-[36rem] rounded-full bg-blue-200/40 blur-3xl"
          style={{ animationDelay: "4s" }}
        />
        <div
          className="motion-safe:animate-mesh-drift absolute bottom-[-10rem] left-1/3 h-[28rem] w-[28rem] rounded-full bg-amber-100/40 blur-3xl"
          style={{ animationDelay: "8s" }}
        />
      </div>

      <div className="mx-auto flex max-w-3xl flex-col items-center px-5 text-center">
        {/* Rol-tabs */}
        <div
          role="tablist"
          aria-label="Kies je rol"
          className="inline-flex rounded-full border border-slate-200 bg-white/70 p-1 shadow-sm backdrop-blur-xl"
        >
          {ROLLEN.map((r) => {
            const actief = r.key === activeRole;
            return (
              <button
                key={r.key}
                type="button"
                role="tab"
                aria-selected={actief}
                onClick={() => onRoleChange(r.key)}
                className={cn(
                  "relative flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2",
                  rol.accentRing,
                  actief ? "text-white" : "text-slate-600 hover:text-slate-900"
                )}
              >
                {actief && (
                  <motion.span
                    layoutId="hero-rol-tab-actief"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    className={cn("absolute inset-0 rounded-full", r.accentBg)}
                  />
                )}
                <r.icon className="relative z-10 h-4 w-4" />
                <span className="relative z-10">{r.tabLabel}</span>
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={rol.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="flex w-full flex-col items-center"
          >
            <h1 className="mt-10 font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-slate-900 sm:text-6xl">
              {rol.koptekst}
            </h1>

            <p className="mt-6 max-w-xl text-lg text-slate-600">{rol.subtekst}</p>

            {rol.key === "donateur" ? (
              <PostcodeZoeker accentBg={rol.accentBg} />
            ) : (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="mt-10">
                <Link
                  href={rol.href}
                  className={cn(
                    "flex h-14 items-center justify-center gap-2 whitespace-nowrap rounded-full px-7 text-base font-semibold text-white shadow-lg transition-colors",
                    rol.accentBg,
                    rol.key === "lid" ? "shadow-amber-500/20 hover:bg-amber-600" : "shadow-blue-500/20 hover:bg-blue-600"
                  )}
                >
                  {rol.ctaLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        <motion.p initial="hidden" animate="visible" variants={item} className={cn("mt-8 text-sm text-slate-500", rol.accentText)}>
          Al meer dan <span className="font-semibold">2.500 buren, spelers en clubs</span> doen mee.
        </motion.p>
      </div>
    </section>
  );
}

function PostcodeZoeker({ accentBg }: { accentBg: string }) {
  const router = useRouter();
  const [postcode, setPostcode] = useState("");
  const [actief, setActief] = useState(false);
  const [zoekend, setZoekend] = useState(false);

  function zoekClubs(e: FormEvent) {
    e.preventDefault();
    setZoekend(true);
    router.push(`/donateren${postcode.trim() ? `?postcode=${encodeURIComponent(postcode.trim())}` : ""}`);
  }

  return (
    <form onSubmit={zoekClubs} className="relative mt-10 flex w-full max-w-xl flex-col gap-2 sm:flex-row">
      {/* Signature: radar-ping rond de zoekbalk terwijl je "scant" op lokale clubs */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        {actief && (
          <>
            <span className="motion-safe:animate-radar-ping absolute h-14 w-full rounded-full border border-emerald-400/50" />
            <span
              className="motion-safe:animate-radar-ping absolute h-14 w-full rounded-full border border-emerald-400/40"
              style={{ animationDelay: "0.7s" }}
            />
          </>
        )}
      </div>

      <div className="relative flex-1">
        <MapPin className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          value={postcode}
          onChange={(e) => setPostcode(e.target.value)}
          onFocus={() => setActief(true)}
          onBlur={() => setActief(false)}
          placeholder="Vul je postcode in (bijv. 1012AB)"
          autoComplete="postal-code"
          className="h-14 w-full rounded-full border border-slate-200 bg-white pl-12 pr-4 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 sm:text-base"
        />
      </div>

      <motion.button
        whileHover={zoekend ? undefined : { scale: 1.02 }}
        whileTap={zoekend ? undefined : { scale: 0.98 }}
        type="submit"
        disabled={zoekend}
        className={cn(
          "flex h-14 items-center justify-center gap-2 whitespace-nowrap rounded-full px-7 text-base font-semibold text-white shadow-lg shadow-emerald-500/20 transition-colors hover:bg-emerald-600 disabled:opacity-80",
          accentBg
        )}
      >
        {zoekend ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Even zoeken…
          </>
        ) : (
          <>
            Zoek lokale clubs
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </motion.button>
    </form>
  );
}
