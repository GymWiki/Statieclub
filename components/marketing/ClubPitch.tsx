"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Target, ArrowRight, Trophy, Lock, Camera, Image as ImageIcon, Check } from "lucide-react";
import { useFadeUpVariants } from "@/lib/motion";
import { cn } from "@/lib/utils";

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
  { label: "???", icoon: null, ontgrendeld: false },
  { label: "???", icoon: null, ontgrendeld: false },
];

export function ClubPitch() {
  const item = useFadeUpVariants();

  return (
    <section id="voor-besturen" className="scroll-mt-20 bg-slate-900 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={item}
          className="mx-auto max-w-xl text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-400">Voor bestuursleden</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Klaar met saaie inzamelingsacties?
          </h2>
        </motion.div>

        <div className="mt-16 grid grid-cols-1 gap-5 md:grid-cols-3">
          {/* Blok 1 — groot: Live Leaderboard (spelersweergave) */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={item}
            whileHover={{ y: -4 }}
            className="flex flex-col justify-between rounded-3xl border border-white/10 bg-white/[0.04] p-8 md:col-span-2 md:min-h-[22rem]"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-500/15">
                  <Trophy className="h-6 w-6 text-blue-400" />
                </div>
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  LIVE
                </span>
              </div>
              <h3 className="mt-6 font-display text-2xl font-bold text-white">Live leaderboard</h3>
              <p className="mt-2 max-w-sm text-slate-400">
                Spelers klimmen met avatars, streaks en badges — jeugdteams strijden om de eer in de kantine.
              </p>
            </div>

            {/* Mini leaderboard-mockup: spelers i.p.v. alleen teams */}
            <div className="mt-8 space-y-3">
              {LEADERBOARD_MOCKUP.map((speler, i) => (
                <div key={speler.naam} className="flex items-center gap-3">
                  <span className="w-4 text-sm font-bold text-slate-500">{i + 1}</span>
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 text-base">
                    {speler.avatar}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-100">{speler.naam}</p>
                    {speler.streak && <p className="text-xs text-amber-400">{speler.streak}</p>}
                  </div>
                  <span className="shrink-0 text-sm font-bold tabular-nums text-emerald-400">{speler.punten}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Blok 2 — vierkant: Penningmeester dashboard */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={item}
            transition={{ delay: 0.1 }}
            whileHover={{ y: -4 }}
            className="flex flex-col justify-between rounded-3xl border border-white/10 bg-white/[0.04] p-8 md:min-h-[22rem]"
          >
            <div>
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/15">
                <Target className="h-6 w-6 text-emerald-400" />
              </div>
              <h3 className="mt-6 font-display text-xl font-bold text-white">Penningmeester dashboard</h3>
              <p className="mt-2 text-sm text-slate-400">
                Volg elke euro live, en grijp met één klik in bij een verdachte scan.
              </p>
            </div>

            <div className="mt-6 space-y-5">
              {/* Mini-thermometer mockup */}
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Doel: Nieuwe tenues</span>
                  <span className="font-semibold text-emerald-400">65%</span>
                </div>
                <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-white/5">
                  <div className="h-full w-[65%] rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500" />
                </div>
                <p className="mt-1.5 text-sm font-bold text-white">
                  €520 <span className="font-normal text-slate-500">van €800</span>
                </p>
              </div>

              {/* Anomaly-verificatie-flow mockup */}
              <div className="flex items-center gap-1.5 overflow-x-auto rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2.5 text-xs">
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-red-500/15 px-2 py-1 font-semibold text-red-400">
                  🚩 €15,00 (JO11)
                </span>
                <ArrowRight className="h-3 w-3 shrink-0 text-slate-600" />
                <span className="flex shrink-0 items-center gap-1 text-slate-300">
                  <ImageIcon className="h-3 w-3" /> Foto bekijken
                </span>
                <ArrowRight className="h-3 w-3 shrink-0 text-slate-600" />
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-1 font-semibold text-emerald-400">
                  <Check className="h-3 w-3" /> Goedkeuren
                </span>
              </div>
            </div>
          </motion.div>

          {/* Blok 3 — breed: Badges & Achievements */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={item}
            transition={{ delay: 0.2 }}
            whileHover={{ y: -4 }}
            className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 md:col-span-3"
          >
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-500/15">
                <Camera className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-white">Badges &amp; achievements</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Elke speler bouwt een eigen trofeeënkast op — scannen wordt een spelletje.
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-6">
              {BADGES_MOCKUP.map((badge, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-center",
                    badge.ontgrendeld ? "border-amber-400/30 bg-amber-400/10" : "border-white/5 bg-white/[0.02]"
                  )}
                >
                  <span
                    className={cn(
                      "grid h-10 w-10 place-items-center rounded-full text-lg",
                      badge.ontgrendeld ? "bg-amber-400/20" : "bg-white/5"
                    )}
                  >
                    {badge.ontgrendeld ? badge.icoon : <Lock className="h-4 w-4 text-slate-600" />}
                  </span>
                  <span
                    className={cn(
                      "line-clamp-1 text-[11px] font-medium",
                      badge.ontgrendeld ? "text-slate-200" : "text-slate-600"
                    )}
                  >
                    {badge.label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={item}
          className="mt-12 flex justify-center"
        >
          <Link href="/admin/login">
            <motion.span
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 rounded-full bg-blue-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-600/30 transition-colors hover:bg-blue-500"
            >
              Start een club-campagne (gratis)
              <ArrowRight className="h-4 w-4" />
            </motion.span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
