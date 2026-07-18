import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { normaliseerPostcode } from "@/lib/utils";
import type { OphaalformulierInput } from "@/lib/types";

/**
 * POST /api/ophaalverzoeken
 * Frictieloos ophaalformulier: upsert de donateur op e-mailadres (zo
 * blijft er 1 donateursrecord bestaan, ongeacht hoe vaak iemand doneert
 * of van club wisselt) en maakt daarna het ophaalverzoek aan.
 *
 * `type` (optioneel, standaard 'statiegeld'): bij 'glasbak' ("Glas-naar-
 * Kas") is er geen geschat aantal flessen — in plaats daarvan een vast,
 * al betaald donatiebedrag. De echte betaalstap is client-side
 * gesimuleerd (mock iDeal/Tikkie); dit endpoint vertrouwt erop dat de
 * client alleen aanroept ná die simulatie en zet `vooraf_betaald`
 * daarom altijd op true voor dit type — er is geen echte betaalprovider
 * om hier server-side te verifiëren.
 *
 * Draait server-side met de service-role, zodat donateurs/ophaalverzoeken
 * nooit rechtstreeks vanuit de browser beschreven worden (zie RLS-policies).
 */
export async function POST(request: NextRequest) {
  const body = (await request.json()) as OphaalformulierInput;

  const naam = body.naam?.trim();
  const email = body.email?.trim().toLowerCase();
  const adres = body.adres?.trim();
  const postcode = body.postcode ? normaliseerPostcode(body.postcode) : "";
  const clubId = body.club_id;
  const doelId = body.doel_id;
  const type = body.type === "glasbak" ? "glasbak" : "statiegeld";

  if (!naam || !email || !adres || !postcode || !clubId || !doelId) {
    return NextResponse.json({ error: "Vul alle verplichte velden correct in." }, { status: 400 });
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: "Ongeldig e-mailadres." }, { status: 400 });
  }

  let aantalGeschat = 1;
  let donatieBedrag: number | null = null;

  if (type === "glasbak") {
    donatieBedrag = Number(body.donatie_bedrag);
    if (!Number.isFinite(donatieBedrag) || donatieBedrag <= 0) {
      return NextResponse.json({ error: "Kies een donatiebedrag." }, { status: 400 });
    }
    donatieBedrag = Math.round(donatieBedrag * 100) / 100;
  } else {
    aantalGeschat = Number(body.aantal_geschat);
    if (!Number.isFinite(aantalGeschat) || aantalGeschat <= 0) {
      return NextResponse.json({ error: "Vul alle verplichte velden correct in." }, { status: 400 });
    }
  }

  const supabase = createServiceRoleClient();

  const { data: doel } = await supabase
    .from("doelen")
    .select("id")
    .eq("id", doelId)
    .eq("club_id", clubId)
    .eq("is_actief", true)
    .maybeSingle();

  if (!doel) {
    return NextResponse.json({ error: "Dit doel bestaat niet (meer) of is niet actief." }, { status: 400 });
  }

  // lat/lng zitten hier bewust alleen in de payload als ze zijn
  // meegegeven (browser-geolocatie toegestaan): bij een upsert update
  // Supabase alleen de kolommen die je meestuurt, dus een donateur die
  // een volgende keer zónder locatietoestemming doneert, verliest zijn
  // eerder vastgelegde coördinaat niet.
  const donateurData: Record<string, unknown> = {
    naam,
    email,
    adres,
    postcode,
    telefoonnummer: body.telefoonnummer?.trim() || null,
  };
  if (Number.isFinite(body.lat) && Number.isFinite(body.lng)) {
    donateurData.lat = body.lat;
    donateurData.lng = body.lng;
  }

  const { data: donateur, error: donateurError } = await supabase
    .from("donateurs")
    .upsert(donateurData, { onConflict: "email" })
    .select()
    .single();

  if (donateurError || !donateur) {
    return NextResponse.json(
      { error: donateurError?.message ?? "Kon donateur niet opslaan." },
      { status: 500 }
    );
  }

  const { data: verzoek, error: verzoekError } = await supabase
    .from("ophaalverzoeken")
    .insert({
      donateur_id: donateur.id,
      club_id: clubId,
      doel_id: doelId,
      type,
      vooraf_betaald: type === "glasbak",
      donatie_bedrag: donatieBedrag,
      aantal_geschat: aantalGeschat,
      opmerking: body.opmerking?.trim() || null,
    })
    .select()
    .single();

  if (verzoekError || !verzoek) {
    return NextResponse.json(
      { error: verzoekError?.message ?? "Kon ophaalverzoek niet aanmaken." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ophaalverzoek: verzoek,
    donateurProfiel: {
      naam: donateur.naam,
      email: donateur.email,
      adres: donateur.adres,
      postcode: donateur.postcode,
      telefoonnummer: donateur.telefoonnummer,
    },
  });
}
