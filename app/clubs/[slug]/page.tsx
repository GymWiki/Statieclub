import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Target } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { OphaalFlow } from "@/components/donor/OphaalFlow";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Card } from "@/components/ui/Card";
import { formatEuro, formatVoortgang } from "@/lib/utils";
import type { Club, Doel } from "@/lib/types";

export default async function ClubDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: club } = await supabase
    .from("clubs")
    .select("*")
    .eq("slug", slug)
    .eq("is_actief", true)
    .single<Club>();

  if (!club) notFound();

  const { data: doelen } = await supabase
    .from("doelen")
    .select("*")
    .eq("club_id", club.id)
    .eq("is_actief", true)
    .order("created_at", { ascending: true });

  const actieveDoelen = (doelen as Doel[]) ?? [];

  // "Glas-naar-Kas" alleen aanbieden als er minstens één team is dat
  // de service heeft aangezet (anders belandt een donatieverzoek nooit
  // bij een team dat het kan claimen) ÉN de club Stripe-onboarding
  // heeft afgerond (anders kan er geen echte betaling aan deze club
  // worden doorgestort).
  const { count: glasTeamsAantal } = await supabase
    .from("teams")
    .select("id", { count: "exact", head: true })
    .eq("club_id", club.id)
    .eq("glas_service_actief", true);
  const glasServiceBeschikbaar =
    (glasTeamsAantal ?? 0) > 0 && !!club.stripe_account_id && club.onboarding_complete;

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <Link href="/" className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" /> Kies een andere club
      </Link>

      <h1 className="text-2xl font-bold text-gray-900">{club.naam}</h1>
      <p className="mt-1 text-gray-600">{club.regio} · {club.postcode}</p>

      <div className="mt-4 space-y-3">
        {actieveDoelen.length === 0 && (
          <p className="text-sm text-gray-500">Deze club heeft momenteel geen actieve inzamelingsactie.</p>
        )}

        {actieveDoelen.map((doel) => {
          const percentage = formatVoortgang(doel.opgehaald_bedrag, doel.doelbedrag);
          return (
            <Card key={doel.id} className="p-4">
              <p className="flex items-center gap-1.5 text-sm text-gray-700">
                <Target className="h-4 w-4 text-brand-600" />
                Spaart voor: <span className="font-semibold">{doel.titel}</span>
              </p>
              <div className="mt-2 space-y-1">
                <ProgressBar percentage={percentage} />
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{formatEuro(doel.opgehaald_bedrag)} van {formatEuro(doel.doelbedrag)}</span>
                  <span className="font-semibold text-brand-700">{percentage}%</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {actieveDoelen.length > 0 && (
        <div className="mt-8">
          <OphaalFlow
            clubId={club.id}
            clubNaam={club.naam}
            doelen={actieveDoelen}
            glasServiceBeschikbaar={glasServiceBeschikbaar}
          />
        </div>
      )}
    </div>
  );
}
