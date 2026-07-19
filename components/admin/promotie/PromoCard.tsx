"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { QRCodeSVG } from "qrcode.react";
import { FileImage, FileText, Loader2, QrCode, Wine } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { getPromoLink, type PromoTemplate } from "@/lib/promo";

interface PromoCardProps {
  club: { naam: string; slug: string; regio: string };
  template: PromoTemplate;
}

/**
 * Eén downloadbare flyer/poster-preview. De `previewRef`-node is de
 * daadwerkelijke bron voor de export: `html-to-image` rasterizeert 'm
 * naar PNG op een `pixelRatio` die we uitrekenen aan de hand van de
 * werkelijk gerenderde breedte t.o.v. `template.exportPixelWidth` —
 * zo blijft de kaart compact in de grid, maar is de download
 * drukwerk-resolutie. Voor de printformaten (A4/A5) wordt diezelfde
 * PNG vervolgens in een `jsPDF`-pagina op het exacte fysieke formaat
 * geplakt.
 */
export function PromoCard({ club, template }: PromoCardProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [bezig, setBezig] = useState<"png" | "pdf" | null>(null);
  const [foutmelding, setFoutmelding] = useState<string | null>(null);

  const link = getPromoLink(club.slug);
  const koptekst = `Geen zin in gedoe bij de automaat? Laat je statiegeld thuis ophalen en steun ${club.naam}! Scan de QR-code.`;

  async function genereerHogeResolutiePng(): Promise<string> {
    const node = previewRef.current;
    if (!node) throw new Error("Preview niet gevonden");
    await document.fonts.ready;
    const pixelRatio = template.exportPixelWidth / node.offsetWidth;
    return toPng(node, { pixelRatio, cacheBust: true });
  }

  async function downloadPng() {
    setFoutmelding(null);
    setBezig("png");
    try {
      const dataUrl = await genereerHogeResolutiePng();
      const a = document.createElement("a");
      a.download = `${template.bestandsnaamPrefix}-${club.slug}.png`;
      a.href = dataUrl;
      a.click();
    } catch {
      setFoutmelding("Downloaden is mislukt. Probeer het opnieuw.");
    } finally {
      setBezig(null);
    }
  }

  async function downloadPdf() {
    if (!template.pdfFormaat) return;
    setFoutmelding(null);
    setBezig("pdf");
    try {
      const dataUrl = await genereerHogeResolutiePng();
      const { breedteMm, hoogteMm } = template.pdfFormaat;
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: [breedteMm, hoogteMm] });
      pdf.addImage(dataUrl, "PNG", 0, 0, breedteMm, hoogteMm);
      pdf.save(`${template.bestandsnaamPrefix}-${club.slug}.pdf`);
    } catch {
      setFoutmelding("Downloaden is mislukt. Probeer het opnieuw.");
    } finally {
      setBezig(null);
    }
  }

  // Vaste pixel-afmetingen i.p.v. een Tailwind aspect-ratio-klasse: de
  // preview moet exact het fysieke formaat (A4/A5/vierkant) benaderen
  // zodat een PDF-export nooit uitgerekt raakt, en content (bijv. een
  // lange clubnaam) mag die verhouding nooit stiekem oprekken.
  const kaartBreedte = 300;
  const verhouding = template.pdfFormaat ? template.pdfFormaat.hoogteMm / template.pdfFormaat.breedteMm : 1;
  const kaartHoogte = Math.round(kaartBreedte * verhouding);

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        ref={previewRef}
        style={{ width: kaartBreedte, height: kaartHoogte }}
        className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
      >
        {template.id === "social" ? (
          <SocialPreview clubNaam={club.naam} link={link} koptekst={koptekst} />
        ) : (
          <PrintPreview clubNaam={club.naam} regio={club.regio} link={link} koptekst={koptekst} />
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button variant="secondary" size="sm" onClick={downloadPng} disabled={bezig !== null}>
          {bezig === "png" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileImage className="h-4 w-4" />}
          PNG downloaden
        </Button>
        {template.pdfFormaat && (
          <Button variant="secondary" size="sm" onClick={downloadPdf} disabled={bezig !== null}>
            {bezig === "pdf" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            PDF downloaden
          </Button>
        )}
      </div>
      {foutmelding && <p className="text-xs text-red-600">{foutmelding}</p>}
    </div>
  );
}

function Merk({ donker }: { donker?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="grid h-5 w-5 place-items-center rounded-md bg-brand-600 text-[10px] font-bold text-white">
        S
      </span>
      <span className={cn("text-xs font-bold tracking-tight", donker ? "text-white" : "text-slate-900")}>
        Statieclub
      </span>
    </div>
  );
}

function QrBlok({ link, groot }: { link: string; groot?: boolean }) {
  return (
    <div className={cn("grid place-items-center rounded-2xl bg-white p-3 shadow-lg", groot ? "shadow-xl" : "")}>
      <QRCodeSVG value={link} size={groot ? 128 : 92} level="M" fgColor="#0f172a" bgColor="#ffffff" />
    </div>
  );
}

/** Layout voor de A4-poster en A5-flyer: portrait, druk-klaar, groot koptekst-blok bovenaan de QR. */
function PrintPreview({
  clubNaam,
  regio,
  link,
  koptekst,
}: {
  clubNaam: string;
  regio: string;
  link: string;
  koptekst: string;
}) {
  return (
    <div className="relative flex h-full flex-col justify-between bg-gradient-to-b from-violet-50 via-white to-white p-5 text-center">
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-violet-200/50 blur-2xl"
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute -left-12 bottom-1/3 h-32 w-32 rounded-full bg-brand-100/60 blur-2xl" aria-hidden="true" />

      <div className="relative flex flex-col items-center gap-3">
        <Merk />
        <span className="flex items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1 text-[11px] font-semibold text-violet-700">
          <Wine className="h-3 w-3" /> Glas-naar-Kas Service
        </span>
        <h2 className="font-display text-base font-extrabold leading-snug tracking-tight text-slate-900">
          {koptekst}
        </h2>
      </div>

      <div className="relative flex flex-col items-center gap-2">
        <QrBlok link={link} groot />
        <div>
          <p className="flex items-center justify-center gap-1 text-xs font-semibold text-slate-700">
            <QrCode className="h-3.5 w-3.5 text-violet-600" /> Scan &amp; steun {clubNaam}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400">{regio}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Layout voor social: vierkant en het krapst qua ruimte van de drie
 * formaten — bewust kleinere tekst/QR en minder padding/gaps dan de
 * printformaten, zodat de volledige (verplichte) koptekst altijd
 * binnen het vierkant blijft i.p.v. afgesneden te worden door de
 * `overflow-hidden` op de preview-container.
 */
function SocialPreview({ clubNaam, link, koptekst }: { clubNaam: string; link: string; koptekst: string }) {
  return (
    <div className="relative flex h-full flex-col items-center justify-center gap-4 bg-slate-900 p-6 text-center">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.35),_transparent_60%)]"
        aria-hidden="true"
      />
      <div className="relative">
        <Merk donker />
      </div>
      <p className="relative font-display text-sm font-extrabold leading-snug text-white">{koptekst}</p>
      <div className="relative">
        <QrBlok link={link} />
      </div>
      <p className="relative flex items-center gap-1.5 text-[11px] font-semibold text-violet-300">
        <QrCode className="h-3 w-3" /> Scan &amp; steun {clubNaam}
      </p>
    </div>
  );
}
