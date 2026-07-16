"use client";

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
