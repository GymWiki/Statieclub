import Link from "next/link";
import Image from "next/image";
import { MapPin, Trophy } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatEuro, formatVoortgang } from "@/lib/utils";
import type { Club, Doel } from "@/lib/types";

export function ClubCard({ club, doelen }: { club: Club; doelen: Doel[] }) {
  const actieveDoelen = doelen.filter((d) => d.is_actief);
  const hoofdDoel = actieveDoelen[0];
  const percentage = hoofdDoel ? formatVoortgang(hoofdDoel.opgehaald_bedrag, hoofdDoel.doelbedrag) : 0;

  return (
    <Link href={`/clubs/${club.slug}`}>
      <Card className="group flex h-full flex-col gap-4 p-5 transition-shadow hover:shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-50 text-brand-700">
            {club.logo_url ? (
              <Image src={club.logo_url} alt={club.naam} width={48} height={48} className="h-full w-full object-cover" />
            ) : (
              <Trophy className="h-6 w-6" />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-gray-900">{club.naam}</h3>
            <p className="flex items-center gap-1 text-xs text-gray-500">
              <MapPin className="h-3 w-3" /> {club.regio} · {club.postcode}
            </p>
          </div>
        </div>

        {hoofdDoel ? (
          <>
            <p className="text-sm text-gray-600">
              Spaart voor: <span className="font-medium text-gray-800">{hoofdDoel.titel}</span>
              {actieveDoelen.length > 1 && (
                <span className="ml-1.5 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                  +{actieveDoelen.length - 1} ander{actieveDoelen.length - 1 === 1 ? "" : "e"} doel
                  {actieveDoelen.length - 1 === 1 ? "" : "en"}
                </span>
              )}
            </p>

            <div className="mt-auto space-y-1.5">
              <ProgressBar percentage={percentage} />
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>
                  {formatEuro(hoofdDoel.opgehaald_bedrag)} van {formatEuro(hoofdDoel.doelbedrag)}
                </span>
                <span className="font-semibold text-brand-700">{percentage}%</span>
              </div>
            </div>
          </>
        ) : (
          <p className="mt-auto text-sm text-gray-400">Momenteel geen actieve inzamelingsactie.</p>
        )}
      </Card>
    </Link>
  );
}
