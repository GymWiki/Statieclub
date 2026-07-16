"use client";

import { useMemo } from "react";

const KLEUREN = ["#1db874", "#f59e0b", "#2563eb", "#ef4444", "#a855f7"];

/**
 * Lichtgewicht, dependency-vrije confetti-burst (pure CSS-animatie) —
 * voor de instant-gratification-succesmelding, zonder een extra
 * npm-package voor een eenmalig visueel effect.
 */
export function Confetti() {
  const stukjes = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        id: i,
        links: Math.random() * 100,
        vertraging: Math.random() * 0.35,
        rotatie: Math.random() * 360,
        kleur: KLEUREN[i % KLEUREN.length],
      })),
    []
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {stukjes.map((s) => (
        <span
          key={s.id}
          className="absolute top-0 h-2.5 w-1.5 rounded-sm"
          style={{
            left: `${s.links}%`,
            backgroundColor: s.kleur,
            transform: `rotate(${s.rotatie}deg)`,
            animation: "confetti-fall 1.6s ease-in forwards",
            animationDelay: `${s.vertraging}s`,
          }}
        />
      ))}
    </div>
  );
}
