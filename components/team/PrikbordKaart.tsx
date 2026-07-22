"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import type { Coordinaat } from "@/lib/geo";
import type { OphaalverzoekNearby } from "@/lib/types";

/**
 * Leaflet raakt bij import `window`/`document` aan — met `ssr: false`
 * geladen zodat Next.js 'm nooit tijdens de server-render van deze (op
 * zich al "use client") pagina probeert te evalueren.
 */
const LeafletKaart = dynamic(() => import("@/components/team/LeafletKaart").then((m) => m.LeafletKaart), {
  ssr: false,
  loading: () => (
    <div className="flex h-80 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50">
      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
    </div>
  ),
});

export function PrikbordKaart({
  items,
  spelerLocatie,
  onSelecteer,
}: {
  items: OphaalverzoekNearby[];
  spelerLocatie: Coordinaat | null;
  onSelecteer: (id: string) => void;
}) {
  return <LeafletKaart items={items} spelerLocatie={spelerLocatie} onSelecteer={onSelecteer} />;
}
