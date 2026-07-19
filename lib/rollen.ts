/**
 * Centrale rol-definitie voor de dynamische landingspagina. `LandingPageContainer`
 * beheert de actieve rol en geeft hem door aan alle rol-bewuste secties
 * (HeroSelector, Features, HowItWorks, CallToAction) zodat kleur- en
 * key-conventies overal gelijk blijven.
 */
export type RolKey = "bestuur" | "lid" | "donateur";

export const ROL_VOLGORDE: RolKey[] = ["bestuur", "lid", "donateur"];

export function isRolKey(waarde: string | null | undefined): waarde is RolKey {
  return waarde === "bestuur" || waarde === "lid" || waarde === "donateur";
}

interface RolAccent {
  tekst: string;
  bg: string;
  bgHover: string;
  bgZacht: string;
  ring: string;
  schaduw: string;
}

export const ROL_ACCENT: Record<RolKey, RolAccent> = {
  bestuur: {
    tekst: "text-blue-700",
    bg: "bg-blue-500",
    bgHover: "hover:bg-blue-600",
    bgZacht: "bg-blue-50",
    ring: "focus-visible:ring-blue-500/40",
    schaduw: "shadow-blue-500/20",
  },
  lid: {
    tekst: "text-amber-700",
    bg: "bg-amber-500",
    bgHover: "hover:bg-amber-600",
    bgZacht: "bg-amber-50",
    ring: "focus-visible:ring-amber-500/40",
    schaduw: "shadow-amber-500/20",
  },
  donateur: {
    tekst: "text-emerald-700",
    bg: "bg-emerald-500",
    bgHover: "hover:bg-emerald-600",
    bgZacht: "bg-emerald-50",
    ring: "focus-visible:ring-emerald-500/40",
    schaduw: "shadow-emerald-500/20",
  },
};
