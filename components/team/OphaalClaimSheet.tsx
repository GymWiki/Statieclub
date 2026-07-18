"use client";

import Link from "next/link";
import { Check, Loader2, MapPin, MessageCircleMore, Package, Camera, AlertTriangle, Wine, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatAfstand } from "@/lib/geo";
import { formatEuro } from "@/lib/utils";
import type { OphaalverzoekNearby } from "@/lib/types";

export interface GeclaimdAdres {
  donateur_naam: string;
  donateur_adres: string;
  donateur_postcode: string;
  opmerking: string | null;
}

/**
 * Inhoud van de claim-bottom-sheet: dé enige plek in de UI waar een
 * geanonimiseerd prikbord-item verandert in een concreet adres. Zolang
 * `geclaimdAdres` er niet is, ziet de speler enkel wat het prikbord al
 * toonde (afstand/postcode/aantal) — pas na een geslaagde `onClaim()`
 * komt het adres, de opmerking van de donateur en de link naar de
 * anonieme chat in beeld (géén telefoonnummers/WhatsApp meer).
 *
 * Bij `type: 'glasbak'` ("Glas-naar-Kas") is er geen bonnetje-scan
 * nodig — het bedrag is al vooraf betaald. In plaats van "Bonnetje
 * uploaden" verschijnt dan "Glas weggegooid in de wijk-glasbak", die
 * de rit direct afrondt via `onVoltooiGlas`.
 */
export function OphaalClaimSheet({
  item,
  jouwClaim,
  geclaimdAdres,
  claimBezig,
  foutmelding,
  onClaim,
  onVoltooiGlas,
  voltooiBezig,
  voltooiFoutmelding,
  clubSlug,
}: {
  item: OphaalverzoekNearby;
  jouwClaim: boolean;
  geclaimdAdres: GeclaimdAdres | null;
  claimBezig: boolean;
  foutmelding: string | null;
  onClaim: () => void;
  onVoltooiGlas: () => void;
  voltooiBezig: boolean;
  voltooiFoutmelding: string | null;
  clubSlug: string;
}) {
  const isGlasbak = item.type === "glasbak";

  // Al door een ander team geclaimd: nooit het adres proberen op te halen.
  if (item.status === "geclaimd" && !jouwClaim) {
    return (
      <div className="space-y-3">
        <p className="flex items-center gap-2 text-sm text-gray-500">
          <MapPin className="h-4 w-4 shrink-0" /> Postcode {item.postcode_cijfers}
        </p>
        <p className="rounded-lg bg-gray-50 px-3 py-2.5 text-sm text-gray-500">
          Dit verzoek is al geclaimd door een ander team.
        </p>
      </div>
    );
  }

  // Door ons geclaimd, maar het adres is (nog) niet in de lokale cache
  // — gebeurt kort na een page reload, voordat de achtergrond-fetch
  // klaar is.
  if (item.status === "geclaimd" && jouwClaim && !geclaimdAdres) {
    return (
      <div className="flex items-center justify-center gap-2 py-6 text-gray-400">
        <Loader2 className="h-5 w-5 animate-spin" /> Adres ophalen…
      </div>
    );
  }

  // Ná een geslaagde claim: het echte adres, de opmerking van de
  // donateur en de link naar de anonieme chat — geen telefoonnummer
  // wordt hier meer als contactmiddel aangeboden.
  if (geclaimdAdres) {
    return (
      <div className="space-y-4">
        {isGlasbak && (
          <p className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700">
            💰 {formatEuro(item.donatie_bedrag ?? 0)} direct voor de clubkas — al betaald
          </p>
        )}

        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
          <div className="text-sm">
            <p className="font-semibold text-gray-900">{geclaimdAdres.donateur_naam}</p>
            <p className="text-gray-700">
              {geclaimdAdres.donateur_adres}, {geclaimdAdres.donateur_postcode}
            </p>
          </div>
        </div>

        {geclaimdAdres.opmerking && (
          <p className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {geclaimdAdres.opmerking}
          </p>
        )}

        {voltooiFoutmelding && <p className="text-sm text-red-600">{voltooiFoutmelding}</p>}

        <div className="flex gap-2">
          <Link href={`/club/${clubSlug}/rit/${item.id}/chat`} className="flex-1">
            <Button size="sm" className="w-full">
              <MessageCircleMore className="h-4 w-4" /> Chat met bewoner
            </Button>
          </Link>
          {isGlasbak ? (
            <Button size="sm" variant="secondary" className="flex-1" disabled={voltooiBezig} onClick={onVoltooiGlas}>
              {voltooiBezig ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Glas weggegooid in de wijk-glasbak
            </Button>
          ) : (
            <Link href={`/club/${clubSlug}/upload?verzoek=${item.id}`} className="flex-1">
              <Button size="sm" variant="secondary" className="w-full">
                <Camera className="h-4 w-4" /> Bonnetje uploaden
              </Button>
            </Link>
          )}
        </div>
      </div>
    );
  }

  // Nog niet geclaimd: enkel de geanonimiseerde gegevens + de claim-knop.
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        {isGlasbak && (
          <p className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-violet-600">
            <Wine className="h-3.5 w-3.5" /> 🍾 Glas-naar-Kas Rit
          </p>
        )}
        <p className="flex items-center gap-2 text-sm text-gray-700">
          <MapPin className="h-4 w-4 shrink-0 text-gray-400" />
          {item.afstand_meters !== null ? formatAfstand(item.afstand_meters) : "Afstand onbekend"}
          <span className="text-gray-300">·</span>
          <span className="text-gray-500">Postcode {item.postcode_cijfers}</span>
        </p>
        {isGlasbak ? (
          <p className="flex items-center gap-1.5 text-sm font-semibold text-amber-700">
            💰 {formatEuro(item.donatie_bedrag ?? 0)} Direct voor de clubkas
          </p>
        ) : (
          <p className="flex items-center gap-1.5 text-sm text-gray-600">
            <Package className="h-4 w-4 text-gray-400" /> ± {item.aantal_geschat} flessen/blikjes
          </p>
        )}
      </div>

      <p className="text-xs text-gray-400">
        Het exacte adres zie je pas nadat je hebt geclaimd — zo blijft een donateur veilig tot een team
        écht onderweg is.
      </p>

      {foutmelding && <p className="text-sm text-red-600">{foutmelding}</p>}

      <Button className="w-full" disabled={claimBezig} onClick={onClaim}>
        {claimBezig ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        Claim deze rit
      </Button>
    </div>
  );
}
