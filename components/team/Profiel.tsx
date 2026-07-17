"use client";

import { useEffect, useState } from "react";
import { Flame, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { BadgesGrid } from "@/components/team/BadgesGrid";
import { useTeam } from "@/components/team/TeamContext";
import { cn, formatEuro } from "@/lib/utils";
import { berekenImpact, impactEmojiRij } from "@/lib/impact";
import type { Badge, BadgeMetStatus, Speler } from "@/lib/types";

const AVATAR_OPTIES = ["🙂", "😎", "🦁", "🐯", "🐼", "🦊", "🐸", "🚀", "⚡", "🔥", "🏆", "⚽"];

export function Profiel() {
  const { gekozenTeam, spelerId } = useTeam();
  const [speler, setSpeler] = useState<Speler | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [ontgrendeld, setOntgrendeld] = useState<Map<string, string>>(new Map());
  const [ladend, setLadend] = useState(true);
  const [avatarOpen, setAvatarOpen] = useState(false);

  useEffect(() => {
    if (!spelerId) return;
    const supabase = createClient();

    (async () => {
      const [{ data: spelerData }, { data: badgeData }, { data: spelerBadgeData }] = await Promise.all([
        supabase.from("spelers").select("*").eq("id", spelerId).maybeSingle(),
        supabase.from("badges").select("*").order("volgorde"),
        supabase.from("speler_badges").select("badge_id, unlocked_at").eq("speler_id", spelerId),
      ]);

      setSpeler(spelerData as Speler | null);
      setBadges((badgeData as Badge[]) ?? []);
      setOntgrendeld(
        new Map(((spelerBadgeData ?? []) as { badge_id: string; unlocked_at: string }[]).map((r) => [r.badge_id, r.unlocked_at]))
      );
      setLadend(false);
    })();

    const channel = supabase
      .channel(`speler-${spelerId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "spelers", filter: `id=eq.${spelerId}` },
        (payload) => setSpeler(payload.new as Speler)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [spelerId]);

  async function kiesAvatar(emoji: string) {
    setAvatarOpen(false);
    setSpeler((prev) => (prev ? { ...prev, avatar_emoji: emoji } : prev));
    await fetch(`/api/spelers/${spelerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatar_emoji: emoji }),
    });
  }

  if (ladend || !speler) {
    return (
      <div className="flex justify-center py-16 text-gray-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const impact = berekenImpact(speler.totaal_opgehaald_euro);
  const badgesMetStatus: BadgeMetStatus[] = badges.map((b) => ({
    ...b,
    ontgrendeld: ontgrendeld.has(b.id),
    unlocked_at: ontgrendeld.get(b.id) ?? null,
  }));

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      {/* Header */}
      <Card className="relative overflow-hidden p-5">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-white" />
        <div className="relative flex items-center gap-4">
          <button
            onClick={() => setAvatarOpen((v) => !v)}
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-brand-200 bg-white text-3xl shadow-sm"
          >
            {speler.avatar_emoji}
          </button>
          <div className="min-w-0">
            <p className="truncate text-lg font-bold text-gray-900">{speler.naam}</p>
            <p className="text-sm text-gray-500">{gekozenTeam?.team_naam ?? "Geen team gekozen"}</p>
          </div>
        </div>

        {avatarOpen && (
          <div className="relative mt-4 grid grid-cols-6 gap-2">
            {AVATAR_OPTIES.map((emoji) => (
              <button
                key={emoji}
                onClick={() => kiesAvatar(emoji)}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg text-lg hover:bg-brand-50",
                  emoji === speler.avatar_emoji && "bg-brand-100"
                )}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* Persoonlijke stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <p className="text-xs text-gray-500">Totaal opgehaald</p>
          <p className="mt-1 text-2xl font-extrabold text-brand-600">
            <AnimatedNumber value={speler.totaal_opgehaald_euro} format={formatEuro} />
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500">Bonnetjes gescand</p>
          <p className="mt-1 text-2xl font-extrabold text-gray-900">
            <AnimatedNumber value={speler.totaal_scans} />
          </p>
        </Card>
      </div>

      {/* Impact */}
      <Card className="p-4">
        <p className="text-sm font-semibold text-gray-900">Jouw impact</p>
        {impact.aantal > 0 ? (
          <>
            <p className="mt-1 text-sm text-gray-600">
              {formatEuro(speler.totaal_opgehaald_euro)} staat gelijk aan {impact.aantal}{" "}
              {impact.aantal === 1 ? impact.object : impact.objectMeervoud}
            </p>
            <p className="mt-2 text-2xl leading-none">{impactEmojiRij(impact.aantal, impact.emoji)}</p>
          </>
        ) : (
          <p className="mt-1 text-sm text-gray-500">Scan je eerste bonnetje om je impact te zien groeien.</p>
        )}
      </Card>

      {/* Streak-meter */}
      <Card className="p-4">
        <p className="text-sm font-semibold text-gray-900">Week-streak</p>
        <div className="mt-2 flex items-center gap-2">
          <div className="flex">
            {Array.from({ length: Math.max(1, Math.min(speler.current_week_streak, 8)) }).map((_, i) => (
              <Flame
                key={i}
                className={cn("h-7 w-7", speler.current_week_streak > 0 ? "text-amber-500" : "text-gray-300")}
              />
            ))}
          </div>
          <span className="text-2xl font-extrabold text-gray-900">
            <AnimatedNumber value={speler.current_week_streak} />
          </span>
          <span className="text-sm text-gray-500">
            {speler.current_week_streak === 1 ? "week" : "weken"} op rij
          </span>
        </div>
        <p className="mt-2 text-xs text-gray-400">
          Langste streak ooit: {speler.longest_streak} {speler.longest_streak === 1 ? "week" : "weken"}
        </p>
      </Card>

      {/* Badges */}
      <Card className="p-4">
        <BadgesGrid badges={badgesMetStatus} />
      </Card>
    </div>
  );
}
