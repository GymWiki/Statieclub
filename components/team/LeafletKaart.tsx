"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Circle, CircleMarker, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { gemiddeldeCoordinaat, type Coordinaat } from "@/lib/geo";
import { formatEuro } from "@/lib/utils";
import type { OphaalverzoekNearby } from "@/lib/types";

/** Zelfde onzekerheidsmarge als de fuzz zelf (`FUZZ_MIN/MAX_METER` in lib/geo.ts) — de cirkel op de kaart belooft nooit meer precisie dan er werkelijk is. */
const ZONE_STRAAL_METER = 225;

/** Past de kaart-viewport één keer aan zodra de puntenlijst binnenkomt/wijzigt — kan niet via `MapContainer`-props omdat bounds pas na de eerste render bekend zijn. */
function PasKaartAan({ punten }: { punten: Coordinaat[] }) {
  const map = useMap();

  useEffect(() => {
    if (punten.length === 0) return;
    if (punten.length === 1) {
      map.setView([punten[0].lat, punten[0].lng], 15);
      return;
    }
    const bounds = punten.map((p) => [p.lat, p.lng] as [number, number]);
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [map, punten]);

  return null;
}

/**
 * Echte kaart (Leaflet + OpenStreetMap-tegels) voor het ophaal-prikbord.
 * Zelfde privacyregel als de vorige mock-versie: nooit een exacte
 * pin-marker op het werkelijke adres, enkel een vage zone-cirkel op
 * `fuzzy_locatie` (al vervaagd door de server, zie lib/geo.ts) — de
 * straal is zelfs iets groter dan de daadwerkelijke fuzz-afstand, zodat
 * de cirkel nooit een preciezere belofte doet dan de werkelijkheid.
 */
export function LeafletKaart({
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

  const alleCoordinaten = [middelpunt, ...metLocatie.map((item) => item.fuzzy_locatie)];

  return (
    <div className="h-80 overflow-hidden rounded-2xl border border-gray-200">
      <MapContainer
        center={[middelpunt.lat, middelpunt.lng]}
        zoom={14}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-bijdragers'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <PasKaartAan punten={alleCoordinaten} />

        {spelerLocatie && (
          <CircleMarker
            center={[spelerLocatie.lat, spelerLocatie.lng]}
            radius={7}
            pathOptions={{ color: "#fff", weight: 2, fillColor: "#2563eb", fillOpacity: 1 }}
          >
            <Tooltip>Jij bent hier (ongeveer)</Tooltip>
          </CircleMarker>
        )}

        {metLocatie.map((item) => {
          const geclaimd = item.geclaimd_door_team_id !== null;
          const isGlasbak = item.type === "glasbak";
          const kleur = geclaimd ? "#9ca3af" : isGlasbak ? "#7c3aed" : "#059669";

          return (
            <Circle
              key={item.id}
              center={[item.fuzzy_locatie.lat, item.fuzzy_locatie.lng]}
              radius={ZONE_STRAAL_METER}
              eventHandlers={{ click: () => onSelecteer(item.id) }}
              pathOptions={{ color: kleur, fillColor: kleur, fillOpacity: 0.25, weight: 2 }}
            >
              <Tooltip>
                {isGlasbak
                  ? `Glas-naar-Kas rond postcode ${item.postcode_cijfers} — ${formatEuro(item.donatie_bedrag ?? 0)}`
                  : `Zone rond postcode ${item.postcode_cijfers} — ${item.aantal_geschat} flessen/blikjes`}
              </Tooltip>
            </Circle>
          );
        })}
      </MapContainer>
    </div>
  );
}
