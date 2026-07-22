import Link from "next/link";
import { Heart, MapPin, PiggyBank } from "lucide-react";
import { vereisDonateurToegang } from "@/lib/donateurAuth";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { UitloggenKnop } from "@/components/donor/UitloggenKnop";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { formatEuro } from "@/lib/utils";

interface ActieveRij {
  id: string;
  status: string;
  type: string;
  aangemaakt_op: string;
  clubs: { naam: string; slug: string } | null;
  doelen: { titel: string } | null;
}

interface BonnetjeMetDoel {
  bedrag_euro: number;
  ophaalverzoeken: { doel_id: string | null; doelen: { titel: string } | null } | null;
}

/**
 * Optioneel donateur-dashboard ("aanbieder", Punt 6) — toegankelijk via
 * een account dat volledig los staat van de bestaande anonieme
 * donatieflow. Toont exact de twee dingen die de opdracht vraagt: de
 * actieve ophaalacties van deze donateur, en het totaal gedoneerd
 * bedrag per actie + overall (op basis van de goedgekeurde `bonnetjes`
 * die aan zijn/haar ophaalverzoeken hangen — zowel statiegeld- als
 * glasbak-ritten resulteren in zo'n bonnetje-rij zodra ze voltooid
 * zijn, zie README).
 */
export default async function AanbiederDashboardPage() {
  const { donateur } = await vereisDonateurToegang();
  const service = createServiceRoleClient();

  const { data: actieveVerzoeken } = await service
    .from("ophaalverzoeken")
    .select("id, status, type, aangemaakt_op, clubs(naam, slug), doelen(titel)")
    .eq("donateur_id", donateur.id)
    .neq("status", "voltooid")
    .order("aangemaakt_op", { ascending: false });

  const { data: goedgekeurdeBonnetjes } = await service
    .from("bonnetjes")
    .select("bedrag_euro, ophaalverzoeken!inner(doel_id, donateur_id, doelen(titel))")
    .eq("ophaalverzoeken.donateur_id", donateur.id)
    .eq("status", "goedgekeurd");

  const perActie = new Map<string, { titel: string; totaal: number }>();
  let totaalOverall = 0;

  for (const rij of (goedgekeurdeBonnetjes ?? []) as unknown as BonnetjeMetDoel[]) {
    const bedrag = Number(rij.bedrag_euro);
    totaalOverall += bedrag;

    const doelId = rij.ophaalverzoeken?.doel_id ?? "geen-actie";
    const titel = rij.ophaalverzoeken?.doelen?.titel ?? "Zonder specifieke actie";
    const bestaand = perActie.get(doelId) ?? { titel, totaal: 0 };
    bestaand.totaal += bedrag;
    perActie.set(doelId, bestaand);
  }

  const actiesLijst = Array.from(perActie.values()).sort((a, b) => b.totaal - a.totaal);

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-1.5 text-lg font-bold text-gray-900">
            <Heart className="h-5 w-5 text-brand-600" /> Mijn donaties
          </h1>
          <p className="text-sm text-gray-500">{donateur.email}</p>
        </div>
        <UitloggenKnop />
      </div>

      <Card className="p-5">
        <p className="flex items-center gap-1.5 text-sm text-gray-500">
          <PiggyBank className="h-4 w-4" /> Totaal gedoneerd
        </p>
        <p className="mt-1 text-3xl font-extrabold text-gray-900">{formatEuro(totaalOverall)}</p>

        {actiesLijst.length > 0 && (
          <ul className="mt-4 space-y-2 border-t border-gray-100 pt-4">
            {actiesLijst.map((actie) => (
              <li key={actie.titel} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{actie.titel}</span>
                <span className="font-semibold text-gray-900">{formatEuro(actie.totaal)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div>
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
          <MapPin className="h-4 w-4" /> Actieve ophaalacties
        </h2>

        {!actieveVerzoeken || actieveVerzoeken.length === 0 ? (
          <Card className="p-5 text-center text-sm text-gray-500">
            Je hebt momenteel geen openstaande ophaalacties.
          </Card>
        ) : (
          <div className="space-y-2">
            {(actieveVerzoeken as unknown as ActieveRij[]).map((verzoek) => (
              <Card key={verzoek.id} className="flex items-center justify-between p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium text-gray-900">{verzoek.clubs?.naam ?? "Onbekende club"}</p>
                  <p className="truncate text-xs text-gray-500">
                    {verzoek.doelen?.titel ?? "Geen specifieke actie"} ·{" "}
                    {verzoek.type === "glasbak" ? "Glas-naar-Kas" : "Statiegeld"}
                  </p>
                </div>
                <StatusBadge status={verzoek.status} />
              </Card>
            ))}
          </div>
        )}
      </div>

      <p className="text-center text-xs text-gray-400">
        Nieuwe ophaalactie nodig?{" "}
        <Link href="/donateren" className="font-semibold text-brand-700 hover:underline">
          Zoek je club op /donateren
        </Link>
        .
      </p>
    </div>
  );
}
