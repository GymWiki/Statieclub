"use client";

import { MapPin, Package } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { formatAfstand } from "@/lib/geo";
import type { OphaalverzoekNearby } from "@/lib/types";

/**
 * Lijst-weergave van het prikbord — bewust GEEN straatnaam of adres,
 * enkel de door `getNearbyRequests` al gesaneerde velden: afstand,
 * postcode-cijfers en het geschatte aantal.
 */
export function PrikbordLijst({
  items,
  onSelecteer,
}: {
  items: OphaalverzoekNearby[];
  onSelecteer: (id: string) => void;
}) {
  if (items.length === 0) {
    return <p className="py-10 text-center text-gray-500">Geen openstaande ophaalverzoeken op dit moment.</p>;
  }

  return (
    <div className="space-y-2.5">
      {items.map((item) => (
        <button key={item.id} onClick={() => onSelecteer(item.id)} className="block w-full text-left">
          <Card className="flex items-center gap-3 p-4 transition-shadow hover:shadow-md">
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <MapPin className="h-4 w-4 shrink-0 text-gray-400" />
                {item.afstand_meters !== null ? formatAfstand(item.afstand_meters) : "Afstand onbekend"}
                <span className="text-gray-300">·</span>
                <span className="text-gray-500">Postcode {item.postcode_cijfers}</span>
              </div>
              <p className="flex items-center gap-1.5 text-sm text-gray-600">
                <Package className="h-4 w-4 text-gray-400" /> ± {item.aantal_geschat} flessen/blikjes
              </p>
            </div>
            <StatusBadge status={item.status} />
          </Card>
        </button>
      ))}
    </div>
  );
}
