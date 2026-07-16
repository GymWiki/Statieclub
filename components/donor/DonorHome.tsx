"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { ClubCard } from "@/components/donor/ClubCard";
import { postcodeCijfers } from "@/lib/utils";
import type { Club, Doel } from "@/lib/types";

export function DonorHome({
  initialClubs,
  doelenPerClub,
  initialPostcode = "",
}: {
  initialClubs: Club[];
  doelenPerClub: Record<string, Doel[]>;
  initialPostcode?: string;
}) {
  const [postcode, setPostcode] = useState(initialPostcode);

  const gesorteerdeClubs = useMemo(() => {
    const cijfers = postcodeCijfers(postcode);
    if (!cijfers) return initialClubs;

    const inRegio = initialClubs.filter((c) => c.postcode.replace(/\s/g, "").startsWith(cijfers));
    const overig = initialClubs.filter((c) => !c.postcode.replace(/\s/g, "").startsWith(cijfers));
    return [...inRegio, ...overig];
  }, [initialClubs, postcode]);

  const cijfers = postcodeCijfers(postcode);
  const aantalInRegio = cijfers
    ? initialClubs.filter((c) => c.postcode.replace(/\s/g, "").startsWith(cijfers)).length
    : 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-16">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
          Statiegeld inleveren?
          <br />
          <span className="text-brand-600">Steun de club om de hoek.</span>
        </h1>
        <p className="mt-3 text-gray-600">
          Vul je postcode in en kies een lokale sportclub die je flessen op komt halen.
        </p>
      </div>

      <div className="relative mx-auto mt-8 max-w-md">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <Input
          value={postcode}
          onChange={(e) => setPostcode(e.target.value)}
          placeholder="Postcode, bijv. 7511 AB"
          className="pl-12 text-center text-lg"
          inputMode="text"
          autoComplete="postal-code"
        />
      </div>

      {cijfers && (
        <p className="mt-3 text-center text-sm text-gray-500">
          {aantalInRegio > 0
            ? `${aantalInRegio} club${aantalInRegio === 1 ? "" : "s"} gevonden in jouw buurt`
            : "Geen clubs in jouw buurt gevonden — bekijk clubs verderop"}
        </p>
      )}

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {gesorteerdeClubs.map((club) => (
          <ClubCard key={club.id} club={club} doelen={doelenPerClub[club.id] ?? []} />
        ))}
        {gesorteerdeClubs.length === 0 && (
          <p className="col-span-full text-center text-gray-500">
            Er zijn nog geen actieve clubcampagnes.
          </p>
        )}
      </div>
    </div>
  );
}
