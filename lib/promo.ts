/**
 * Promotiemateriaal: kant-en-klare flyers/posters die een bestuur kan
 * downloaden om offline campagne te voeren (bijv. ophangen bij de
 * supermarkt). De QR-code op elk ontwerp linkt naar de bestaande
 * donor-pagina `/clubs/[slug]` — de opdracht noemt een fictieve
 * `/steun/[slug]`-route, maar die naam is nooit in gebruik geweest in
 * deze codebase; `/clubs/[slug]` is de echte, functionerende
 * donor-landingspagina (zie `app/clubs/[slug]/page.tsx`). De
 * `?type=glasbak`-parameter laat die pagina meteen de Glas-naar-Kas-
 * form openen i.p.v. het generieke keuzescherm, zodat de QR-code ook
 * daadwerkelijk naar de flow springt die op de flyer wordt beloofd.
 */
export function getPromoLink(clubSlug: string): string {
  const basisUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  return `${basisUrl}/clubs/${clubSlug}?type=glasbak`;
}

export type PromoFormaat = "a4-poster" | "a5-flyer" | "social";

export interface PromoTemplate {
  id: PromoFormaat;
  categorie: string;
  label: string;
  beschrijving: string;
  /** Fysiek paginaformaat (mm) voor de PDF-export — ontbreekt voor social (geen printformaat). PromoCard leidt hier ook de preview-verhouding uit af (1:1 als dit ontbreekt). */
  pdfFormaat?: { breedteMm: number; hoogteMm: number };
  /**
   * Streefbreedte in pixels voor de PNG/PDF-export (≈300dpi voor de
   * printformaten, 1080px — de Instagram-standaard — voor social).
   * `PromoCard` leest de daadwerkelijke, op scherm gerenderde breedte
   * van de preview-ref en rekent daarmee de `pixelRatio` uit die
   * `html-to-image` nodig heeft om op deze streefbreedte uit te komen,
   * zodat de export drukwerk-kwaliteit heeft ongeacht hoe klein de
   * kaart op het scherm staat.
   */
  exportPixelWidth: number;
  bestandsnaamPrefix: string;
}

export const PROMO_TEMPLATES: PromoTemplate[] = [
  {
    id: "a4-poster",
    categorie: "A4 Posters",
    label: "A4 Poster",
    beschrijving: "Groot en opvallend — ideaal om op te hangen bij het prikbord of de ingang van de supermarkt.",
    pdfFormaat: { breedteMm: 210, hoogteMm: 297 },
    exportPixelWidth: 2480,
    bestandsnaamPrefix: "statieclub-a4-poster",
  },
  {
    id: "a5-flyer",
    categorie: "A5 Flyers",
    label: "A5 Flyer",
    beschrijving: "Compact formaat om uit te delen of neer te leggen bij de kassa.",
    pdfFormaat: { breedteMm: 148, hoogteMm: 210 },
    exportPixelWidth: 1748,
    bestandsnaamPrefix: "statieclub-a5-flyer",
  },
  {
    id: "social",
    categorie: "Social Media Afbeeldingen",
    label: "Social Media Post",
    beschrijving: "Vierkant formaat, klaar om te delen op Instagram of Facebook.",
    exportPixelWidth: 1080,
    bestandsnaamPrefix: "statieclub-social-post",
  },
];
