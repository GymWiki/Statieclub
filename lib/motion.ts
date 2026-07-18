"use client";

import { useEffect, useState } from "react";
import { useReducedMotion, type Variants } from "framer-motion";

/** Gedeelde fade+rise-variant voor secties, met respect voor prefers-reduced-motion. */
export function useFadeUpVariants(afstand = 20): Variants {
  const reduced = useReducedMotion();

  return {
    hidden: { opacity: 0, y: reduced ? 0 : afstand },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reduced ? 0.2 : 0.6, ease: [0.22, 1, 0.36, 1] },
    },
  };
}

/** Voegt een oplopende delay per index toe — voor gestaggerde reveals van rijtjes/grids. */
export function staggerDelay(index: number, stap = 0.08): { transition: { delay: number } } {
  return { transition: { delay: index * stap } };
}

/**
 * Telt 0 → target op zodra `actief` waar wordt (typisch een
 * `useInView`-trigger) — ease-out-curve gelijk aan AnimatedNumber.tsx,
 * maar getriggerd door zichtbaarheid i.p.v. een waardewijziging. Bij
 * prefers-reduced-motion springt de waarde direct naar target.
 */
export function useCountUp(target: number, actief: boolean, duration = 1800): number {
  const reduced = useReducedMotion();
  const [waarde, setWaarde] = useState(0);

  useEffect(() => {
    if (!actief) return;
    if (reduced) {
      setWaarde(target);
      return;
    }
    const start = performance.now();
    let frame: number;
    function tick(now: number) {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setWaarde(target * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [actief, target, duration, reduced]);

  return waarde;
}
