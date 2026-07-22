import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Trophy, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Club } from "@/lib/types";

// Generieke doorgeefluik-pagina naar /club/[slug] (login-gateway),
// geen unieke content om op te ranken — noindex, wel follow zodat de
// clublinks erop nog gecrawld worden.
export const metadata: Metadata = {
  title: "Inloggen als speler",
  robots: { index: false, follow: true },
};

/**
 * Generieke "inloggen als speler"-ingang vanaf de marketing-site.
 * Teamleden komen doorgaans al via een clubspecifieke WhatsApp-link
 * (zie campagnebeheer) direct op `/club/[slug]` terecht — deze pagina
 * is er voor wie zonder zo'n link start en zelf zijn/haar club zoekt.
 * Kiezen van een club leidt naar de bestaande, frictieloze
 * team+naam-keuze (`TeamKiezer`) — dát is hier "inloggen".
 */
export default async function SpelerPage() {
  const supabase = await createClient();
  const { data: clubs } = await supabase.from("clubs").select("*").eq("is_actief", true).order("naam");

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:py-16">
      <div className="text-center">
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
          Voor welk team speel jij?
        </h1>
        <p className="mt-2 text-gray-600">
          Kies je club om het scorebord te bekijken en bonnetjes te scannen. Heb je een
          uitnodigingslink van je team gekregen? Gebruik die — dan sta je direct op de juiste plek.
        </p>
      </div>

      <div className="mt-8 space-y-2.5">
        {((clubs as Club[]) ?? []).map((club) => (
          <Link key={club.id} href={`/club/${club.slug}`} className="block">
            <div className="group flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <Trophy className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-gray-900">{club.naam}</p>
                <p className="flex items-center gap-1 text-xs text-gray-500">
                  <MapPin className="h-3 w-3" /> {club.regio} · {club.postcode}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-gray-300 transition-colors group-hover:text-brand-500" />
            </div>
          </Link>
        ))}
        {(!clubs || clubs.length === 0) && (
          <p className="text-center text-sm text-gray-500">Er zijn nog geen actieve clubs.</p>
        )}
      </div>
    </div>
  );
}
