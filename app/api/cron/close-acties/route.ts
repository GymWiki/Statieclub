import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { rondActieAf } from "@/lib/actieAfronden";

/**
 * GET /api/cron/close-acties
 * Draait dagelijks (zie vercel.json). Sluit elk doel waarvan
 * `end_date` is gepasseerd en genereert daarbij automatisch
 * betaalverzoeken via `lib/actieAfronden.ts` — de "Set and
 * Forget"-campagne-afrekening.
 *
 * Beveiligd met `Authorization: Bearer <CRON_SECRET>` — Vercel Cron
 * Jobs sturen dit automatisch mee zodra de env var is ingesteld,
 * vandaar `GET` en niet `POST` (Vercel Cron doet altijd een
 * GET-request).
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Niet geautoriseerd." }, { status: 401 });
  }

  const service = createServiceRoleClient();
  const nu = new Date().toISOString();

  const { data: verlopenDoelen, error } = await service
    .from("doelen")
    .select("id, titel")
    .eq("is_actief", true)
    .not("end_date", "is", null)
    .lte("end_date", nu);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const resultaten = [];
  for (const doel of verlopenDoelen ?? []) {
    try {
      const resultaat = await rondActieAf(doel.id);
      resultaten.push({ titel: doel.titel, ...resultaat });
    } catch (err) {
      resultaten.push({
        titel: doel.titel,
        doel_id: doel.id,
        error: err instanceof Error ? err.message : "Onbekende fout.",
      });
    }
  }

  return NextResponse.json({ verwerkt: resultaten.length, resultaten });
}
