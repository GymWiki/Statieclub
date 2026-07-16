import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { OphaalForm } from "@/components/donor/OphaalForm";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatEuro, formatVoortgang } from "@/lib/utils";
import type { Club } from "@/lib/types";

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

  const percentage = formatVoortgang(club.opgehaald_bedrag, club.doelbedrag);

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <Link href="/" className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" /> Kies een andere club
      </Link>

      <h1 className="text-2xl font-bold text-gray-900">{club.naam}</h1>
      <p className="mt-1 text-gray-600">{club.regio} · {club.postcode}</p>

      <div className="mt-4 space-y-1.5">
        <p className="text-sm text-gray-700">
          Spaart voor: <span className="font-semibold">{club.actief_spaardoel}</span>
        </p>
        <ProgressBar percentage={percentage} />
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{formatEuro(club.opgehaald_bedrag)} van {formatEuro(club.doelbedrag)}</span>
          <span className="font-semibold text-brand-700">{percentage}%</span>
        </div>
      </div>

      <div className="mt-8">
        <OphaalForm clubId={club.id} clubNaam={club.naam} />
      </div>
    </div>
  );
}
