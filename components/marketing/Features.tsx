"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  TrendingUp,
  LayoutDashboard,
  Zap,
  Trophy,
  Award,
  Wallet,
  Bike,
  Lock,
  ShieldCheck,
  Check,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";
import { useFadeUpVariants, staggerDelay } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { ROL_ACCENT, type RolKey } from "@/lib/rollen";

interface FeatureItem {
  icon: LucideIcon;
  titel: string;
  tekst: string;
}

interface RolFeatures {
  eyebrow: string;
  heading: string;
  items: FeatureItem[];
}

const FEATURES: Record<RolKey, RolFeatures> = {
  bestuur: {
    eyebrow: "Voor bestuursleden",
    heading: "Fondsenwerving met overzicht, niet met spreadsheets",
    items: [
      {
        icon: TrendingUp,
        titel: "Maximale Opbrengst",
        tekst:
          "Haal meer op dan met traditionele acties doordat ook mensen buiten de club (buurtbewoners) makkelijk flessen kunnen aanbieden.",
      },
      {
        icon: LayoutDashboard,
        titel: "Volledige Controle & Overzicht",
        tekst: "Een real-time dashboard met inzicht in de prestaties van teams en exacte opbrengsten.",
      },
      {
        icon: Zap,
        titel: "Set & Forget Administratie",
        tekst: "Automatische afrekening en betaalverzoeken wanneer de campagne sluit.",
      },
    ],
  },
  lid: {
    eyebrow: "Voor clubleden",
    heading: "Statiegeld inzamelen wordt een spel dat je wílt spelen",
    items: [
      {
        icon: Trophy,
        titel: "Teamstrijd & Leaderboards",
        tekst: "Neem het met jouw team op tegen andere teams in de club. Wie haalt het meeste op?",
      },
      {
        icon: Award,
        titel: "Verdien Badges",
        tekst: "Unlock unieke badges en prestaties voor je inzet tijdens de campagne.",
      },
      {
        icon: Wallet,
        titel: "Virtuele Portemonnee",
        tekst: "Scan simpelweg je bonnetjes, spaar ze op in de app en reken pas aan het eind alles in één keer af.",
      },
    ],
  },
  donateur: {
    eyebrow: "Voor donateurs",
    heading: "Doneren zonder moeite, zonder zorgen",
    items: [
      {
        icon: Bike,
        titel: "Glas-naar-Kas Service",
        tekst: "Steun de club zonder zelf naar de supermarkt te slepen; een clublid komt het ophalen.",
      },
      {
        icon: Lock,
        titel: "100% Privacy",
        tekst: "Veilig afspreken via de in-app chat, je hoeft geen 06-nummer te delen.",
      },
      {
        icon: ShieldCheck,
        titel: "Veilig Doneren",
        tekst: "Reken direct en vertrouwd af via iDEAL.",
      },
    ],
  },
};

const TEAMS_MOCKUP = [
  { naam: "JO15-1", opbrengst: 92 },
  { naam: "JO13-2", opbrengst: 68 },
  { naam: "Senioren 1", opbrengst: 45 },
];

const LEADERBOARD_MOCKUP = [
  { naam: "Tim", avatar: "😎", streak: "🔥 3 week streak", punten: 842 },
  { naam: "Sanne", avatar: "🦊", streak: "🔥 1 week streak", punten: 610 },
  { naam: "Noah", avatar: "🐼", streak: null, punten: 455 },
];

const BADGES_MOCKUP = [
  { label: "Scanner Pro", icoon: "🏆", ontgrendeld: true },
  { label: "Koning van de Wijk", icoon: "👑", ontgrendeld: true },
  { label: "Snelle Service", icoon: "⚡", ontgrendeld: true },
  { label: "???", icoon: null, ontgrendeld: false },
];

/**
 * Rol-afhankelijke featuresectie: drie kaarten met de exacte pitch voor
 * de actieve rol, plus een visueel mockup-blok dat de rol invult zonder
 * er tekstueel over uit te weiden — een dashboard/staafdiagram voor
 * bestuur, een leaderboard+badges-mockup voor leden, en een
 * vertrouwens-rij (chat/privacy/iDEAL) voor donateurs. AnimatePresence
 * ververst het hele blok bij een rolwissel zodat oude-rol content nooit
 * even zichtbaar blijft naast de nieuwe.
 */
export function Features({ activeRole }: { activeRole: RolKey }) {
  const item = useFadeUpVariants();
  const content = FEATURES[activeRole];
  const accent = ROL_ACCENT[activeRole];

  return (
    <section id="features" className="scroll-mt-20 bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeRole}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mx-auto max-w-xl text-center">
              <p className={cn("text-sm font-semibold uppercase tracking-wide", accent.tekst)}>{content.eyebrow}</p>
              <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                {content.heading}
              </h2>
            </div>

            <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
              {content.items.map((feature, index) => (
                <motion.div
                  key={feature.titel}
                  initial="hidden"
                  animate="visible"
                  variants={item}
                  {...staggerDelay(index)}
                  className="flex flex-col rounded-3xl border border-slate-900/5 bg-white p-7 shadow-sm"
                >
                  <div className={cn("grid h-12 w-12 place-items-center rounded-2xl", accent.bgZacht)}>
                    <feature.icon className={cn("h-6 w-6", accent.tekst)} />
                  </div>
                  <h3 className="mt-5 font-display text-xl font-bold text-slate-900">{feature.titel}</h3>
                  <p className="mt-2 text-sm text-slate-600">{feature.tekst}</p>
                </motion.div>
              ))}
            </div>

            <motion.div initial="hidden" animate="visible" variants={item} {...staggerDelay(3)} className="mt-6">
              {activeRole === "bestuur" && <DashboardMockup />}
              {activeRole === "lid" && <GamificationMockup />}
              {activeRole === "donateur" && <VertrouwenMockup />}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

function DashboardMockup() {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900 p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-500/15">
            <LayoutDashboard className="h-5 w-5 text-blue-400" />
          </div>
          <h3 className="font-display text-lg font-bold text-white">Live campagne-dashboard</h3>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          LIVE
        </span>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Mini staafdiagram: opbrengst per team */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Opbrengst per team</p>
          {TEAMS_MOCKUP.map((team) => (
            <div key={team.naam} className="flex items-center gap-3">
              <span className="w-20 shrink-0 truncate text-sm text-slate-300">{team.naam}</span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-500"
                  style={{ width: `${team.opbrengst}%` }}
                />
              </div>
              <span className="w-9 shrink-0 text-right text-sm font-bold tabular-nums text-blue-400">
                {team.opbrengst}%
              </span>
            </div>
          ))}
        </div>

        {/* Set & Forget: automatische afrekening zodra de actie sluit */}
        <div className="flex flex-col justify-center rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Bij sluiting van de actie</p>
          <div className="mt-3 flex items-center gap-2 text-sm text-slate-300">
            <Zap className="h-4 w-4 shrink-0 text-amber-400" />
            Betaalverzoeken automatisch verstuurd
          </div>
          <div className="mt-2 flex items-center gap-2 text-sm text-slate-300">
            <Check className="h-4 w-4 shrink-0 text-emerald-400" />
            Facturatie direct afgerond
          </div>
          <p className="mt-4 text-2xl font-bold text-white">
            €2.140 <span className="text-sm font-normal text-slate-500">totaal opgehaald</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function GamificationMockup() {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      {/* Mini leaderboard */}
      <div className="rounded-3xl border border-amber-100 bg-amber-50/60 p-7">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-100">
            <Trophy className="h-5 w-5 text-amber-600" />
          </div>
          <h3 className="font-display text-lg font-bold text-slate-900">Teamscorebord</h3>
        </div>
        <div className="mt-6 space-y-3">
          {LEADERBOARD_MOCKUP.map((speler, i) => (
            <div key={speler.naam} className="flex items-center gap-3">
              <span className="w-4 text-sm font-bold text-slate-400">{i + 1}</span>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-base shadow-sm">
                {speler.avatar}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800">{speler.naam}</p>
                {speler.streak && <p className="text-xs text-amber-600">{speler.streak}</p>}
              </div>
              <span className="shrink-0 text-sm font-bold tabular-nums text-amber-700">{speler.punten}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Mini badges */}
      <div className="rounded-3xl border border-amber-100 bg-amber-50/60 p-7">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-100">
            <Award className="h-5 w-5 text-amber-600" />
          </div>
          <h3 className="font-display text-lg font-bold text-slate-900">Badges &amp; achievements</h3>
        </div>
        <div className="mt-6 grid grid-cols-4 gap-3">
          {BADGES_MOCKUP.map((badge, i) => (
            <div
              key={i}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-center",
                badge.ontgrendeld ? "border-amber-300/70 bg-white" : "border-amber-100 bg-amber-50/40"
              )}
            >
              <span
                className={cn(
                  "grid h-9 w-9 place-items-center rounded-full text-base",
                  badge.ontgrendeld ? "bg-amber-100" : "bg-amber-50"
                )}
              >
                {badge.ontgrendeld ? badge.icoon : <Lock className="h-3.5 w-3.5 text-amber-300" />}
              </span>
              <span
                className={cn(
                  "line-clamp-1 text-[10px] font-medium",
                  badge.ontgrendeld ? "text-slate-700" : "text-amber-300"
                )}
              >
                {badge.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function VertrouwenMockup() {
  const punten = [
    { icon: MessageCircle, titel: "In-app chat", tekst: "Spreek veilig af, geen 06-nummer nodig" },
    { icon: Lock, titel: "Anoniem & privé", tekst: "Je gegevens blijven bij jou" },
    { icon: ShieldCheck, titel: "iDEAL-betaling", tekst: "Direct en vertrouwd afrekenen" },
  ];

  return (
    <div className="rounded-3xl border border-emerald-100 bg-emerald-50/60 p-7">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {punten.map((punt) => (
          <div key={punt.titel} className="flex flex-col items-center text-center sm:items-start sm:text-left">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-100">
              <punt.icon className="h-5 w-5 text-emerald-700" />
            </div>
            <h3 className="mt-3 text-sm font-bold text-slate-900">{punt.titel}</h3>
            <p className="mt-1 text-xs text-slate-600">{punt.tekst}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
