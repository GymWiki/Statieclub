"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BadgeMetStatus } from "@/lib/types";

/**
 * Badge-showcase ("Trophy Room"): ontgrendelde badges springen eruit
 * (goud/kleur), vergrendelde staan grijs met een slotje. Klikken toont
 * de ontgrendel-criteria — geen aparte modal-library nodig, gewoon een
 * uitklap-paneel onder de grid.
 */
/** Verborgen ("easter egg") badges tonen geen naam/icoon/criteria totdat ze ontgrendeld zijn. */
function isMysterie(badge: BadgeMetStatus): boolean {
  return badge.verborgen && !badge.ontgrendeld;
}

export function BadgesGrid({ badges }: { badges: BadgeMetStatus[] }) {
  const [geselecteerd, setGeselecteerd] = useState<BadgeMetStatus | null>(null);

  const gesorteerd = [...badges].sort((a, b) => a.volgorde - b.volgorde);
  const aantalOntgrendeld = badges.filter((b) => b.ontgrendeld).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Trofeeënkast</h2>
        <p className="text-xs text-gray-400">
          {aantalOntgrendeld} / {badges.length} ontgrendeld
        </p>
      </div>

      <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-5">
        {gesorteerd.map((badge) => (
          <button key={badge.id} onClick={() => setGeselecteerd(badge)} className="flex flex-col items-center gap-1">
            <motion.div
              whileTap={{ scale: 0.92 }}
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-2xl border text-2xl transition-all",
                badge.ontgrendeld
                  ? "border-amber-300 bg-gradient-to-br from-amber-100 to-amber-50 shadow-md shadow-amber-200/60"
                  : "border-gray-200 bg-gray-100 grayscale opacity-50"
              )}
            >
              {badge.ontgrendeld ? badge.icoon : <Lock className="h-5 w-5 text-gray-400" />}
            </motion.div>
            <p
              className={cn(
                "line-clamp-1 text-center text-[10px] font-medium",
                badge.ontgrendeld ? "text-gray-800" : "text-gray-400"
              )}
            >
              {isMysterie(badge) ? "???" : badge.naam}
            </p>
          </button>
        ))}
      </div>

      {geselecteerd && (
        <div className="rounded-xl border border-gray-200 bg-white p-3.5">
          {isMysterie(geselecteerd) ? (
            <>
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🔒</span>
                <div>
                  <p className="font-bold text-gray-900">??? — Geheime badge</p>
                  <p className="text-xs uppercase tracking-wide text-gray-400">{geselecteerd.categorie}</p>
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Deze badge houdt zijn geheim tot je hem ontgrendelt. Blijf scannen om erachter te komen!
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{geselecteerd.ontgrendeld ? geselecteerd.icoon : "🔒"}</span>
                <div>
                  <p className="flex items-center gap-1.5 font-bold text-gray-900">
                    {geselecteerd.naam}
                    {geselecteerd.verborgen && (
                      <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                        Geheime badge
                      </span>
                    )}
                  </p>
                  <p className="text-xs uppercase tracking-wide text-gray-400">{geselecteerd.categorie}</p>
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-600">{geselecteerd.beschrijving}</p>
              {geselecteerd.ontgrendeld && geselecteerd.unlocked_at ? (
                <p className="mt-1 text-xs font-medium text-brand-600">
                  Ontgrendeld op {new Date(geselecteerd.unlocked_at).toLocaleDateString("nl-NL")}
                </p>
              ) : (
                <p className="mt-1 text-xs text-gray-400">Nog niet ontgrendeld</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
