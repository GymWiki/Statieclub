"use client";

import { cn, formatEuro } from "@/lib/utils";
import { naarMeterOffset, gemiddeldeCoordinaat, type Coordinaat } from "@/lib/geo";
import type { OphaalverzoekNearby } from "@/lib/types";

/**
 * Kaart-weergave van het prikbord: GEEN exacte pin-markers, enkel
 * transparante, gekleurde zone-cirkels op basis van de al vervaagde
 * (`fuzzy_locatie`) coördinaat uit `getNearbyRequests` — de werkelijke
 * donateur-positie komt hier nooit binnen. Geen echte kaarttegels
 * (geen externe tile-server-dependency nodig voor deze illustratie);
 * een subtiel rasterpatroon + een "jij bent hier"-stip vormen het
 * mock-kaartje.
 */
export function PrikbordKaart({
  items,
  spelerLocatie,
  onSelecteer,
}: {
  items: OphaalverzoekNearby[];
  spelerLocatie: Coordinaat | null;
  onSelecteer: (id: string) => void;
}) {
  const metLocatie = items.filter(
    (item): item is OphaalverzoekNearby & { fuzzy_locatie: Coordinaat } => item.fuzzy_locatie !== null
  );

  const middelpunt = spelerLocatie ?? gemiddeldeCoordinaat(metLocatie.map((item) => item.fuzzy_locatie));

  if (!middelpunt || metLocatie.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center rounded-2xl border border-dashed border-gray-300 px-6 text-center text-sm text-gray-400">
        Geen locatiegegevens beschikbaar voor de kaartweergave — probeer de lijstweergave.
      </div>
    );
  }

  const offsets = metLocatie.map((item) => ({ item, offset: naarMeterOffset(middelpunt, item.fuzzy_locatie) }));

  // Schaal automatisch zodat de verste zone nog net binnen het kaartje past.
  const grootsteAfstand = Math.max(300, ...offsets.map(({ offset }) => Math.hypot(offset.x, offset.y)));
  const KAART_STRAAL_PX = 130;
  const meterPerPixel = grootsteAfstand / KAART_STRAAL_PX;

  return (
    <div className="relative h-80 overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-brand-50 via-white to-blue-50">
      <div
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage: "radial-gradient(circle, #d1d5db 1.5px, transparent 1.5px)",
          backgroundSize: "22px 22px",
        }}
        aria-hidden="true"
      />

      {spelerLocatie && (
        <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2" aria-hidden="true">
          <span className="relative flex h-4 w-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
            <span className="relative inline-flex h-4 w-4 rounded-full border-2 border-white bg-brand-600 shadow" />
          </span>
        </div>
      )}

      {offsets.map(({ item, offset }) => {
        const x = offset.x / meterPerPixel;
        const y = -offset.y / meterPerPixel; // noord = omhoog = negatieve CSS-y
        const geclaimd = item.geclaimd_door_team_id !== null;
        const isGlasbak = item.type === "glasbak";

        return (
          <button
            key={item.id}
            onClick={() => onSelecteer(item.id)}
            style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` }}
            className="absolute -translate-x-1/2 -translate-y-1/2 transition-transform hover:z-20 hover:scale-105"
            aria-label={
              isGlasbak
                ? `Glas-naar-Kas rit rond postcode ${item.postcode_cijfers}, ${formatEuro(item.donatie_bedrag ?? 0)}`
                : `Zone rond postcode ${item.postcode_cijfers}, ${item.aantal_geschat} flessen/blikjes`
            }
          >
            <span
              className={cn(
                "flex h-16 w-16 items-center justify-center rounded-full border-2 text-xs font-bold backdrop-blur-sm",
                geclaimd
                  ? "border-gray-300 bg-gray-300/40 text-gray-500"
                  : isGlasbak
                    ? "animate-pulse border-violet-500 bg-violet-400/30 text-violet-700 shadow-[0_0_16px_rgba(245,158,11,0.55)]"
                    : "border-brand-400 bg-brand-400/25 text-brand-700"
              )}
            >
              {isGlasbak ? "🍾" : item.postcode_cijfers}
            </span>
          </button>
        );
      })}
    </div>
  );
}
