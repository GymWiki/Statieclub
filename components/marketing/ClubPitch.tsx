"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ScanLine, ShieldCheck, ArrowRight, Trophy } from "lucide-react";
import { useFadeUpVariants } from "@/lib/motion";

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
          {/* Blok 1 — groot: Live Leaderboards */}
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
              <h3 className="mt-6 font-display text-2xl font-bold text-white">Live leaderboards</h3>
              <p className="mt-2 max-w-sm text-slate-400">
                Laat jeugdteams tegen elkaar strijden met live scores in de kantine.
              </p>
            </div>

            {/* Mini leaderboard-mockup */}
            <div className="mt-8 space-y-2.5">
              {[
                { naam: "JO11-1", punten: 842, aandeel: 100 },
                { naam: "Heren 3", punten: 610, aandeel: 72 },
                { naam: "JO13-2", punten: 455, aandeel: 54 },
              ].map((team, i) => (
                <div key={team.naam} className="flex items-center gap-3">
                  <span className="w-5 text-sm font-bold text-slate-500">{i + 1}</span>
                  <span className="w-20 shrink-0 text-sm font-medium text-slate-200">{team.naam}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                    <div
                      className={`h-full rounded-full ${i === 0 ? "bg-emerald-400" : "bg-blue-400/70"}`}
                      style={{ width: `${team.aandeel}%` }}
                    />
                  </div>
                  <span className="w-12 shrink-0 text-right text-sm tabular-nums text-slate-400">
                    {team.punten}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Blok 2 — vierkant: OCR Scanner */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={item}
            transition={{ delay: 0.1 }}
            whileHover={{ y: -4 }}
            className="flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center md:min-h-[22rem]"
          >
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-emerald-500/15">
              <ScanLine className="h-8 w-8 text-emerald-400" />
            </div>
            <h3 className="mt-6 font-display text-xl font-bold text-white">Slimme OCR-scanner</h3>
            <p className="mt-2 text-sm text-slate-400">
              Foto maken van de bon = punten claimen. De app leest het bedrag automatisch.
            </p>
          </motion.div>

          {/* Blok 3 — rechthoek: Geen administratie */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={item}
            transition={{ delay: 0.2 }}
            whileHover={{ y: -4 }}
            className="flex flex-col items-center gap-6 rounded-3xl border border-white/10 bg-white/[0.04] p-8 md:col-span-3 md:flex-row"
          >
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-blue-500/15">
              <ShieldCheck className="h-8 w-8 text-blue-400" />
            </div>
            <div className="text-center md:text-left">
              <h3 className="font-display text-xl font-bold text-white">Geen administratie</h3>
              <p className="mt-1.5 text-sm text-slate-400">
                Als bestuurslid houd je 100% controle met ons automatische goedkeuringsdashboard.
              </p>
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
