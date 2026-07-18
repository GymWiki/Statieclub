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
  type: string;
  donatie_bedrag: number | null;
  aantal_geschat: number;
  geclaimd_door_team_id: string | null;
  doel_id: string | null;
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
 *
 * `team_id` (optioneel) filtert verzoeken waarvan het gekoppelde doel
 * beperkt is tot specifieke teams (`doel_teams`, migratie 0012) — zo
 * kunnen twee acties naast elkaar lopen zonder dat team A verzoeken
 * van team B's actie op zijn prikbord ziet. Een doel zonder rijen in
 * `doel_teams` (of een verzoek zonder doel) blijft voor alle teams
 * zichtbaar. Diezelfde `team_id` filtert ook `type: 'glasbak'`-
 * verzoeken weg voor een team waarvan `glas_service_actief` uitstaat
 * (migratie 0013) — die service is bewust per team aan/uit-zetbaar
 * vanwege het zware tilwerk, dus een jeugdteam mag zo'n rit nooit
 * eens te zien krijgen.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clubId = searchParams.get("club_id");
  const teamId = searchParams.get("team_id");
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
    .select(
      "id, status, type, donatie_bedrag, aantal_geschat, geclaimd_door_team_id, doel_id, aangemaakt_op, donateurs(postcode, lat, lng)"
    )
    .eq("club_id", clubId)
    .in("status", ["open", "geclaimd"]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let toegankelijkeVerzoeken = (verzoeken ?? []) as unknown as OphaalverzoekRij[];

  if (teamId) {
    const doelIds = Array.from(
      new Set(toegankelijkeVerzoeken.map((v) => v.doel_id).filter((id): id is string => id !== null))
    );
    if (doelIds.length > 0) {
      const { data: koppelingen } = await supabase.from("doel_teams").select("doel_id, team_id").in("doel_id", doelIds);
      const beperkteDoelIds = new Set((koppelingen ?? []).map((k) => k.doel_id));
      const toegestaanVoorTeam = new Set(
        (koppelingen ?? []).filter((k) => k.team_id === teamId).map((k) => k.doel_id)
      );
      toegankelijkeVerzoeken = toegankelijkeVerzoeken.filter(
        (v) => !v.doel_id || !beperkteDoelIds.has(v.doel_id) || toegestaanVoorTeam.has(v.doel_id)
      );
    }

    if (toegankelijkeVerzoeken.some((v) => v.type === "glasbak")) {
      const { data: team } = await supabase
        .from("teams")
        .select("glas_service_actief")
        .eq("id", teamId)
        .maybeSingle();
      if (!team?.glas_service_actief) {
        toegankelijkeVerzoeken = toegankelijkeVerzoeken.filter((v) => v.type !== "glasbak");
      }
    }
  }

  const gesaneerd = toegankelijkeVerzoeken.map((verzoek) => {
    const donateurLocatie: Coordinaat | null =
      verzoek.donateurs.lat !== null && verzoek.donateurs.lng !== null
        ? { lat: verzoek.donateurs.lat, lng: verzoek.donateurs.lng }
        : null;

    return {
      id: verzoek.id,
      status: verzoek.status,
      type: verzoek.type,
      donatie_bedrag: verzoek.donatie_bedrag,
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
