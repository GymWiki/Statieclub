/**
 * Hybride OCR Bonnetjes Scanner — client-side "OCR-engine".
 *
 * Dit bestand simuleert wat een echte on-device OCR-library (zoals
 * Tesseract.js) zou teruggeven: ruwe herkende tekst uit de foto. We
 * lezen dus geen echte pixels, maar genereren deterministisch
 * plausibele bonnetjestekst op basis van bestandsnaam + grootte, zodat
 * dezelfde foto altijd hetzelfde resultaat oplevert — en soms, net als
 * een wazige foto in het echt, helemaal niets leesbaars.
 *
 * De reden om hier te simuleren i.p.v. écht Tesseract.js te draaien:
 * dat vereist het downloaden van meerdere MB's taalmodel-data per
 * gebruiker en een web worker, wat de "gratis, snel, altijd
 * beschikbaar"-belofte van deze component ondermijnt in een demo-
 * omgeving. De architectuur is bewust ontkoppeld: vervang alleen de
 * body van `herkenTekst` door een echte
 * `(await createWorker('nld').recognize(bestand)).data.text` om over
 * te stappen op echte on-device OCR — de regex-extractielogica
 * hieronder (`kiesBesteBedrag`) blijft dan ongewijzigd werken.
 */

export interface OcrResultaat {
  /** De (gesimuleerde) ruwe tekst zoals een OCR-engine die zou herkennen. */
  ruweTekst: string;
  /** Het bedrag dat de regex-extractie er het meest logisch uit haalde, of null. */
  bedrag: number | null;
}

/** Exact de regex uit de opdracht: EUR/€-prefix optioneel, twee decimalen verplicht. */
const BEDRAG_REGEX = /(?:EUR|€)?\s*(\d+[,.]\d{2})/gi;

function wacht(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function hashVan(tekst: string): number {
  let hash = 0;
  for (let i = 0; i < tekst.length; i++) {
    hash = (hash * 31 + tekst.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** Simuleert de ruwe OCR-tekst van een kassabon (regels + bedragen). */
function genereerRuweOcrTekst(bestand: File): string {
  const hash = hashVan(`${bestand.name}:${bestand.size}`);

  // ~1 op de 8 "scans" is te wazig om iets leesbaars op te leveren —
  // zo wordt het pad "OCR vindt niets" op natuurlijke wijze getriggerd.
  if (hash % 8 === 0) {
    return "SUPERMARKT\n[ onleesbaar - bon te wazig of te donker ]";
  }

  const totaal = Math.round((1.5 + (hash % 5850) / 100) * 100) / 100;
  const regel1 = Math.round(totaal * 0.35 * 100) / 100;
  const regel2 = Math.round((totaal - regel1) * 100) / 100;

  return [
    "SUPERMARKT XL",
    `KRAT BIER LEEG          ${regel1.toFixed(2)}`,
    `FLES/BLIK LEEG          ${regel2.toFixed(2)}`,
    `STATIEGELD TOTAAL   EUR ${totaal.toFixed(2)}`,
    "BEDANKT VOOR UW BEZOEK",
  ].join("\n");
}

/**
 * Kiest uit alle gevonden bedragen het meest logische: bij voorkeur een
 * bedrag op een regel met "totaal" of "statiegeld", anders het hoogste
 * gevonden bedrag (kleinere item-regels zijn zelden het eindbedrag).
 */
export function kiesBesteBedrag(ruweTekst: string): number | null {
  let besteBedrag: number | null = null;
  let gevondenViaSleutelwoord = false;

  for (const regel of ruweTekst.split("\n")) {
    const heeftSleutelwoord = /totaal|statiegeld/i.test(regel);
    const matches = regel.matchAll(BEDRAG_REGEX);

    for (const match of matches) {
      const waarde = parseFloat(match[1].replace(",", "."));
      if (!Number.isFinite(waarde)) continue;

      if (heeftSleutelwoord) {
        besteBedrag = gevondenViaSleutelwoord ? Math.max(besteBedrag ?? 0, waarde) : waarde;
        gevondenViaSleutelwoord = true;
      } else if (!gevondenViaSleutelwoord) {
        besteBedrag = besteBedrag === null ? waarde : Math.max(besteBedrag, waarde);
      }
    }
  }

  return besteBedrag;
}

/** Scant een bonnetje-foto volledig client-side — geen netwerkverkeer, geen API-kosten. */
export async function scanBonnetje(bestand: File): Promise<OcrResultaat> {
  // Simuleer de verwerkingstijd van een echte on-device OCR-run.
  await wacht(900 + Math.random() * 600);

  const ruweTekst = genereerRuweOcrTekst(bestand);
  return { ruweTekst, bedrag: kiesBesteBedrag(ruweTekst) };
}
