/**
 * Geo-hulpfuncties voor het Ophaal Prikbord.
 *
 * Uitgangspunt: de exacte locatie van een donateur mag de browser
 * nooit bereiken vóórdat een team heeft geclaimd. Deze module levert
 * daarom, naast een echte afstandsberekening, ook een "vervaagde"
 * (fuzzy) coördinaat op — genoeg om een kaartweergave met een globale
 * zone te tekenen, zonder ooit de werkelijke straat/woning prijs te
 * geven. Puur wiskunde, geen Supabase-import — dus ook veilig te
 * gebruiken in client components (bijv. `LeafletKaart.tsx`).
 */

const AARDE_RADIUS_METER = 6_371_000;

export interface Coordinaat {
  lat: number;
  lng: number;
}

function graadNaarRadiaal(graden: number): number {
  return (graden * Math.PI) / 180;
}

/** Haversine-afstand in meters tussen twee coördinaten. */
export function berekenAfstandMeters(a: Coordinaat, b: Coordinaat): number {
  const dLat = graadNaarRadiaal(b.lat - a.lat);
  const dLng = graadNaarRadiaal(b.lng - a.lng);
  const sinA =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(graadNaarRadiaal(a.lat)) * Math.cos(graadNaarRadiaal(b.lat)) * Math.sin(dLng / 2) ** 2;
  return AARDE_RADIUS_METER * (2 * Math.atan2(Math.sqrt(sinA), Math.sqrt(1 - sinA)));
}

/** Rondt af naar een vriendelijke, grove weergave — nooit exacter dan 100m. */
export function formatAfstand(meters: number): string {
  const afgerond = Math.max(100, Math.round(meters / 100) * 100);
  return afgerond >= 1000 ? `~${(afgerond / 1000).toFixed(1)} km` : `~${afgerond}m`;
}

/** Deterministische pseudo-random fractie [0, 1) uit een tekst-seed. */
function seedFractie(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return (hash >>> 0) / 0xffffffff;
}

const FUZZ_MIN_METER = 150;
const FUZZ_MAX_METER = 300;

/**
 * Verplaatst een exacte coördinaat in een willekeurige, maar per
 * `seed` (bijv. het ophaalverzoek-id) consistente richting over
 * 150-300m — genoeg om de werkelijke woning te verbergen, terwijl de
 * cirkel op de kaart wel steeds op dezelfde plek blijft staan i.p.v.
 * bij elke request te "springen". Wordt nergens opgeslagen, enkel
 * on-the-fly afgeleid vóór verzending naar de client.
 */
export function vervaagCoordinaat(punt: Coordinaat, seed: string): Coordinaat {
  const hoek = seedFractie(`${seed}:hoek`) * 2 * Math.PI;
  const afstand = FUZZ_MIN_METER + seedFractie(`${seed}:afstand`) * (FUZZ_MAX_METER - FUZZ_MIN_METER);

  const dLat = (afstand * Math.cos(hoek)) / AARDE_RADIUS_METER;
  const dLng = (afstand * Math.sin(hoek)) / (AARDE_RADIUS_METER * Math.cos(graadNaarRadiaal(punt.lat)));

  return {
    lat: punt.lat + (dLat * 180) / Math.PI,
    lng: punt.lng + (dLng * 180) / Math.PI,
  };
}

/** Zwaartepunt van een lijst coördinaten — gebruikt als kaart-middelpunt zonder speler-locatie. */
export function gemiddeldeCoordinaat(punten: Coordinaat[]): Coordinaat | null {
  if (punten.length === 0) return null;
  return {
    lat: punten.reduce((som, p) => som + p.lat, 0) / punten.length,
    lng: punten.reduce((som, p) => som + p.lng, 0) / punten.length,
  };
}
