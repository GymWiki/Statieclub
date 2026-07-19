"use client";

import { useState } from "react";
import { FileText, Image as ImageIcon, Printer } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { PROMO_TEMPLATES, type PromoFormaat } from "@/lib/promo";
import { PromoCard } from "@/components/admin/promotie/PromoCard";

const CATEGORIE_ICOON: Record<PromoFormaat, typeof Printer> = {
  "a4-poster": Printer,
  "a5-flyer": FileText,
  social: ImageIcon,
};

/**
 * Promotiemateriaal-dashboard: verdeelt de beschikbare ontwerpen
 * (`lib/promo.ts#PROMO_TEMPLATES`) over tabs per categorie en toont ze
 * als downloadbare `PromoCard`s, gepersonaliseerd met de naam/QR-code
 * van de ingelogde club.
 */
export function PromotieOverzicht({ club }: { club: { naam: string; slug: string; regio: string } }) {
  const [actieveCategorie, setActieveCategorie] = useState<PromoFormaat>(PROMO_TEMPLATES[0].id);
  const actieveTemplate = PROMO_TEMPLATES.find((t) => t.id === actieveCategorie)!;

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h2 className="font-semibold text-gray-900">Promotiemateriaal</h2>
        <p className="mt-1 text-sm text-gray-500">
          Kant-en-klare, gepersonaliseerde flyers en posters voor {club.naam} — met een QR-code die direct naar
          jullie Glas-naar-Kas-pagina linkt. Download en druk af om op te hangen bij de supermarkt of uit te delen
          in de buurt.
        </p>
      </Card>

      <div className="flex gap-1 overflow-x-auto rounded-xl bg-gray-100 p-1">
        {PROMO_TEMPLATES.map((template) => {
          const Icoon = CATEGORIE_ICOON[template.id];
          const actief = template.id === actieveCategorie;
          return (
            <button
              key={template.id}
              type="button"
              onClick={() => setActieveCategorie(template.id)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                actief ? "bg-white text-brand-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              <Icoon className="h-4 w-4" /> {template.categorie}
            </button>
          );
        })}
      </div>

      <Card className="p-6">
        <p className="text-sm text-gray-500">{actieveTemplate.beschrijving}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-8">
          <PromoCard club={club} template={actieveTemplate} />
        </div>
      </Card>
    </div>
  );
}
