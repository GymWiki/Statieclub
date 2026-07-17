import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { berekenAfstandMeters, vervaagCoordinaat, type Coordinaat } from "@/lib/geo";
import { postcodeCijfers } from "@/lib/utils";

interface DonateurRij {
  postcode: string;
  lat: number | null;
  lng: number | null;
}

interface OphaalverzoekRij {
  id: string;
  status: string;
  aantal_geschat: number;
  geclaimd_door_team_id: string | null;
  aangemaakt_op: string;
  donateurs: DonateurRij;
}

/**
 * GET /api/ophaalverzoeken/nearby?club_id=...&lat=...&lng=...
 *
 * De "getNearbyRequests"-functie: berekent per open/geclaimd
 * ophaalverzoek de afstand tot de huidige positie van de speler.
 * Vereist de service-role, want `donateurs` heeft geen publieke
 * leesrechten — en dat is precies het punt: dit endpoint is de ENIGE
 * plek die de exacte donateur-coördinaat (en het adres) ooit ziet.
 *
 * Wat hier NIET wordt teruggegeven, expliciet gestript vóórdat de
 * response de deur uitgaat: donateurs.naam, .adres, .telefoonnummer en
 * de echte .lat/.lng. In plaats daarvan komt er een `fuzzy_locatie`
 * mee — een met `vervaagCoordinaat` willekeurig verschoven punt
 * (150-300m), enkel bruikbaar om een globale zone op de mock-kaart te
 * tekenen. Het echte adres verschijnt pas via `POST
 * /api/ophaalverzoeken/[id]/claim`, ná een geslaagde claim.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clubId = searchParams.get("club_id");
  const spelerLat = Number(searchParams.get("lat"));
  const spelerLng = Number(searchParams.get("lng"));
  const heeftSpelerLocatie = Number.isFinite(spelerLat) && Number.isFinite(spelerLng);
  const spelerLocatie: Coordinaat | null = heeftSpelerLocatie ? { lat: spelerLat, lng: spelerLng } : null;

  if (!clubId) {
    return NextResponse.json({ error: "club_id is verplicht." }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const { data: verzoeken, error } = await supabase
    .from("ophaalverzoeken")
    .select("id, status, aantal_geschat, geclaimd_door_team_id, aangemaakt_op, donateurs(postcode, lat, lng)")
    .eq("club_id", clubId)
    .in("status", ["open", "geclaimd"]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const gesaneerd = ((verzoeken ?? []) as unknown as OphaalverzoekRij[]).map((verzoek) => {
    const donateurLocatie: Coordinaat | null =
      verzoek.donateurs.lat !== null && verzoek.donateurs.lng !== null
        ? { lat: verzoek.donateurs.lat, lng: verzoek.donateurs.lng }
        : null;

    return {
      id: verzoek.id,
      status: verzoek.status,
      aantal_geschat: verzoek.aantal_geschat,
      geclaimd_door_team_id: verzoek.geclaimd_door_team_id,
      aangemaakt_op: verzoek.aangemaakt_op,
      postcode_cijfers: postcodeCijfers(verzoek.donateurs.postcode),
      afstand_meters:
        spelerLocatie && donateurLocatie ? Math.round(berekenAfstandMeters(spelerLocatie, donateurLocatie)) : null,
      fuzzy_locatie: donateurLocatie ? vervaagCoordinaat(donateurLocatie, verzoek.id) : null,
      // Bewust NIET meegegeven: donateurs.naam, .adres, .telefoonnummer, .lat, .lng.
    };
  });

  gesaneerd.sort((a, b) => (a.afstand_meters ?? Infinity) - (b.afstand_meters ?? Infinity));

  return NextResponse.json({ ophaalverzoeken: gesaneerd });
}
