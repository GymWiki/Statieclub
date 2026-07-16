"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MapPin, ArrowRight, Loader2 } from "lucide-react";
import { useFadeUpVariants } from "@/lib/motion";

const AVATARS = [
  { label: "MB", tint: "bg-emerald-100 text-emerald-700" },
  { label: "JV", tint: "bg-blue-100 text-blue-700" },
  { label: "SK", tint: "bg-amber-100 text-amber-700" },
  { label: "RD", tint: "bg-slate-200 text-slate-700" },
];

export function Hero() {
  const router = useRouter();
  const [postcode, setPostcode] = useState("");
  const [actief, setActief] = useState(false);
  const [zoekend, setZoekend] = useState(false);

  const item = useFadeUpVariants(16);

  function zoekClubs(e: FormEvent) {
    e.preventDefault();
    setZoekend(true);
    router.push(`/donateren${postcode.trim() ? `?postcode=${encodeURIComponent(postcode.trim())}` : ""}`);
  }

  return (
    <section className="relative overflow-hidden pb-24 pt-40 sm:pb-32 sm:pt-48">
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

      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
        className="mx-auto flex max-w-3xl flex-col items-center px-5 text-center"
      >
        <motion.h1
          variants={item}
          className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-slate-900 sm:text-6xl"
        >
          Jouw lege flessen.
          <br />
          <span className="text-emerald-600">Hun nieuwe doeltjes.</span>
        </motion.h1>

        <motion.p variants={item} className="mt-6 max-w-xl text-lg text-slate-600">
          Steun lokaal talent zonder moeite. Geef je statiegeld aan een club in de buurt, en jeugdteams
          komen het juichend bij je ophalen.
        </motion.p>

        <motion.form
          variants={item}
          onSubmit={zoekClubs}
          className="relative mt-10 flex w-full max-w-xl flex-col gap-2 sm:flex-row"
        >
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
            className="flex h-14 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-emerald-500 px-7 text-base font-semibold text-white shadow-lg shadow-emerald-500/20 transition-colors hover:bg-emerald-600 disabled:opacity-80"
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
        </motion.form>

        <motion.div variants={item} className="mt-8 flex items-center gap-3">
          <div className="flex -space-x-2.5">
            {AVATARS.map((a) => (
              <span
                key={a.label}
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-[11px] font-bold ${a.tint}`}
              >
                {a.label}
              </span>
            ))}
          </div>
          <p className="text-left text-sm text-slate-500">
            Al meer dan <span className="font-semibold text-slate-700">2.500 buren</span> doneerden hun
            statiegeld.
          </p>
        </motion.div>
      </motion.div>
    </section>
  );
}
