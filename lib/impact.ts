/**
 * Vertaalt een opgehaald bedrag naar iets tastbaars ("€45 = 3
 * trainingsballen ⚽⚽⚽") — een euro-bedrag zegt een kind weinig, een
 * stapel voorwerpen wel. Prijs is een grove schatting, puur voor de
 * beleving op het Profiel.
 */
export const IMPACT_PRIJS_PER_TRAININGSBAL = 15;

export interface Impact {
  aantal: number;
  emoji: string;
  object: string;
  objectMeervoud: string;
}

export function berekenImpact(totaalEuro: number): Impact {
  return {
    aantal: Math.floor(totaalEuro / IMPACT_PRIJS_PER_TRAININGSBAL),
    emoji: "⚽",
    object: "trainingsbal",
    objectMeervoud: "trainingsballen",
  };
}

/** Herhaalt de emoji voor het aantal, met een cap zodat het scherm niet overloopt bij grote bedragen. */
export function impactEmojiRij(aantal: number, emoji: string, max = 12): string {
  if (aantal <= 0) return "";
  const zichtbaar = emoji.repeat(Math.min(aantal, max));
  return aantal > max ? `${zichtbaar} +${aantal - max}` : zichtbaar;
}
