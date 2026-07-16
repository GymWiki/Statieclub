import Link from "next/link";
import Image from "next/image";
import { MapPin, Trophy } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatEuro, formatVoortgang } from "@/lib/utils";
import type { Club } from "@/lib/types";

export function ClubCard({ club }: { club: Club }) {
  const percentage = formatVoortgang(club.opgehaald_bedrag, club.doelbedrag);

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

        <p className="text-sm text-gray-600">
          Spaart voor: <span className="font-medium text-gray-800">{club.actief_spaardoel}</span>
        </p>

        <div className="mt-auto space-y-1.5">
          <ProgressBar percentage={percentage} />
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              {formatEuro(club.opgehaald_bedrag)} van {formatEuro(club.doelbedrag)}
            </span>
            <span className="font-semibold text-brand-700">{percentage}%</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
