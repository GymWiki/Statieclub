"use client";

import { FormEvent, useState } from "react";
import {
  Loader2,
  PlusCircle,
  Target,
  Lock,
  LockOpen,
  Users,
  Pencil,
  CalendarClock,
  Zap,
  Receipt,
  MessageCircleMore,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusBadge } from "@/components/ui/Badge";
import { bouwWhatsappUrl, cn, formatEuro, formatVoortgang } from "@/lib/utils";
import type { Betaalverzoek, DoelMetTeams, Team } from "@/lib/types";

type BetaalverzoekMetSpeler = Betaalverzoek & { spelers: { naam: string } | null };

function TeamsPicker({
  teams,
  geselecteerd,
  onToggle,
}: {
  teams: Team[];
  geselecteerd: string[];
  onToggle: (teamId: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {teams.map((team) => {
        const actief = geselecteerd.includes(team.id);
        return (
          <label
            key={team.id}
            className={cn(
              "flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
              actief ? "border-brand-500 bg-brand-50 text-brand-700" : "border-gray-200 text-gray-600 hover:border-gray-300"
            )}
          >
            <input type="checkbox" className="sr-only" checked={actief} onChange={() => onToggle(team.id)} />
            {team.team_naam}
          </label>
        );
      })}
    </div>
  );
}

function BetaalverzoekenLijst({ betaalverzoeken }: { betaalverzoeken: BetaalverzoekMetSpeler[] }) {
  const basisUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");

  if (betaalverzoeken.length === 0) {
    return <p className="py-3 text-center text-xs text-gray-400">Geen betaalverzoeken gegenereerd bij deze actie.</p>;
  }

  return (
    <div className="divide-y divide-gray-100">
      {betaalverzoeken.map((verzoek) => {
        const naam = verzoek.spelers?.naam ?? "Onbekende speler";
        const link = `${basisUrl}/api/checkout/${verzoek.id}`;
        const bericht = `Hoi! De actie is afgerond. Je hebt in totaal ${formatEuro(verzoek.bedrag)} opgehaald, super bedankt! Je kunt het via deze veilige iDEAL link overmaken naar de club: ${link}`;

        return (
          <div key={verzoek.id} className="flex items-center justify-between gap-2 py-2.5 text-sm">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-gray-900">{naam}</p>
              <p className="text-xs text-gray-500">{formatEuro(verzoek.bedrag)}</p>
            </div>
            <StatusBadge status={verzoek.status} />
            {verzoek.status === "open" && (
              <a
                href={bouwWhatsappUrl(null, bericht)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex shrink-0 items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
              >
                <MessageCircleMore className="h-3.5 w-3.5" /> Deel via WhatsApp
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function DoelenBeheer({
  clubSlug,
  initialDoelen,
  initialTeams,
}: {
  clubSlug: string;
  initialDoelen: DoelMetTeams[];
  initialTeams: Team[];
}) {
  const [doelen, setDoelen] = useState(initialDoelen);
  const [teams] = useState(initialTeams);
  const [titel, setTitel] = useState("");
  const [doelbedrag, setDoelbedrag] = useState("");
  const [eindDatum, setEindDatum] = useState("");
  const [nieuweTeamIds, setNieuweTeamIds] = useState<string[]>([]);
  const [bezig, setBezig] = useState(false);
  const [bezigId, setBezigId] = useState<string | null>(null);
  const [foutmelding, setFoutmelding] = useState<string | null>(null);

  const [bewerkTeamsVoorId, setBewerkTeamsVoorId] = useState<string | null>(null);
  const [bewerkSelectie, setBewerkSelectie] = useState<string[]>([]);
  const [bewerkBezig, setBewerkBezig] = useState(false);

  const [afrondenBezigId, setAfrondenBezigId] = useState<string | null>(null);
  const [getoondeBetaalverzoekenId, setGetoondeBetaalverzoekenId] = useState<string | null>(null);
  const [betaalverzoekenLadend, setBetaalverzoekenLadend] = useState(false);
  const [betaalverzoekenPerDoel, setBetaalverzoekenPerDoel] = useState<Map<string, BetaalverzoekMetSpeler[]>>(
    new Map()
  );

  const teamNaamPerId = new Map(teams.map((t) => [t.id, t.team_naam]));

  function toggleNieuwTeam(teamId: string) {
    setNieuweTeamIds((prev) => (prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId]));
  }

  async function doelToevoegen(e: FormEvent) {
    e.preventDefault();
    setBezig(true);
    setFoutmelding(null);

    try {
      const res = await fetch(`/api/clubs/${clubSlug}/doelen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titel,
          doelbedrag: Number(doelbedrag),
          team_ids: nieuweTeamIds,
          end_date: eindDatum || null,
        }),
      });
      const json = await res.json();

      if (!res.ok) {
        setFoutmelding(json.error ?? "Kon doel niet aanmaken.");
        return;
      }

      setDoelen((prev) => [...prev, json.doel]);
      setTitel("");
      setDoelbedrag("");
      setEindDatum("");
      setNieuweTeamIds([]);
    } finally {
      setBezig(false);
    }
  }

  async function toggleActief(doel: DoelMetTeams) {
    setBezigId(doel.id);
    try {
      const res = await fetch(`/api/doelen/${doel.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_actief: !doel.is_actief }),
      });
      const json = await res.json();
      if (res.ok) {
        setDoelen((prev) => prev.map((d) => (d.id === doel.id ? json.doel : d)));
      }
    } finally {
      setBezigId(null);
    }
  }

  function beginTeamsBewerken(doel: DoelMetTeams) {
    setBewerkTeamsVoorId(doel.id);
    setBewerkSelectie(doel.team_ids);
  }

  function toggleBewerkTeam(teamId: string) {
    setBewerkSelectie((prev) => (prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId]));
  }

  async function teamsOpslaan(doelId: string) {
    setBewerkBezig(true);
    try {
      const res = await fetch(`/api/doelen/${doelId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team_ids: bewerkSelectie }),
      });
      const json = await res.json();
      if (res.ok) {
        setDoelen((prev) => prev.map((d) => (d.id === doelId ? json.doel : d)));
        setBewerkTeamsVoorId(null);
      }
    } finally {
      setBewerkBezig(false);
    }
  }

  async function actieAfronden(doel: DoelMetTeams) {
    if (!confirm(`Actie "${doel.titel}" nu afronden? Dit sluit de actie en genereert betaalverzoeken.`)) return;

    setAfrondenBezigId(doel.id);
    setFoutmelding(null);
    try {
      const res = await fetch(`/api/doelen/${doel.id}/afronden`, { method: "POST" });
      const json = await res.json();

      if (!res.ok) {
        setFoutmelding(json.error ?? "Kon de actie niet afronden.");
        return;
      }

      setDoelen((prev) => prev.map((d) => (d.id === doel.id ? { ...d, is_actief: false } : d)));
      await toonBetaalverzoeken(doel.id, true);
    } finally {
      setAfrondenBezigId(null);
    }
  }

  async function toonBetaalverzoeken(doelId: string, forceerHerladen = false) {
    if (getoondeBetaalverzoekenId === doelId && !forceerHerladen) {
      setGetoondeBetaalverzoekenId(null);
      return;
    }

    setGetoondeBetaalverzoekenId(doelId);
    if (betaalverzoekenPerDoel.has(doelId) && !forceerHerladen) return;

    setBetaalverzoekenLadend(true);
    try {
      const res = await fetch(`/api/betaalverzoeken?doel_id=${doelId}`);
      const json = await res.json();
      if (res.ok) {
        setBetaalverzoekenPerDoel((prev) => new Map(prev).set(doelId, json.betaalverzoeken ?? []));
      }
    } finally {
      setBetaalverzoekenLadend(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <h2 className="font-semibold text-gray-900">Nieuw doel toevoegen</h2>
        <p className="mt-1 text-sm text-gray-500">
          Een club kan meerdere doelen tegelijk (of na elkaar) hebben — elke donateur kiest zelf welk doel hij steunt.
        </p>
        <form onSubmit={doelToevoegen} className="mt-4 space-y-3">
          <div>
            <Label htmlFor="titel">Waar spaart de club voor?</Label>
            <Input
              id="titel"
              required
              value={titel}
              onChange={(e) => setTitel(e.target.value)}
              placeholder="bijv. Nieuwe jeugddoeltjes"
            />
          </div>
          <div>
            <Label htmlFor="doelbedrag">Doelbedrag (€)</Label>
            <Input
              id="doelbedrag"
              type="number"
              min={1}
              step="0.01"
              required
              value={doelbedrag}
              onChange={(e) => setDoelbedrag(e.target.value)}
              placeholder="2500"
            />
          </div>
          <div>
            <Label htmlFor="eind-datum">Einddatum (optioneel)</Label>
            <p className="mb-1.5 mt-0.5 text-xs text-gray-500">
              Gezet? Dan sluit deze actie automatisch op deze datum en genereren we betaalverzoeken voor iedereen die
              spaarde via de Virtuele Portemonnee — &ldquo;Set and Forget&rdquo;.
            </p>
            <Input id="eind-datum" type="date" value={eindDatum} onChange={(e) => setEindDatum(e.target.value)} />
          </div>
          {teams.length > 0 && (
            <div>
              <Label>Welke teams mogen dit doel steunen?</Label>
              <p className="mb-2 mt-0.5 text-xs text-gray-500">
                Laat alles uitgevinkt om dit doel open te stellen voor alle teams. Vink specifieke teams aan om
                bijvoorbeeld twee acties naast elkaar te laten lopen voor verschillende teams.
              </p>
              <TeamsPicker teams={teams} geselecteerd={nieuweTeamIds} onToggle={toggleNieuwTeam} />
            </div>
          )}
          <Button type="submit" className="w-full" disabled={bezig}>
            {bezig ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
            Doel toevoegen
          </Button>
        </form>
        {foutmelding && <p className="mt-2 text-sm text-red-600">{foutmelding}</p>}
      </Card>

      <Card className="p-5">
        <h2 className="font-semibold text-gray-900">Doelen van deze club</h2>

        <div className="mt-4 space-y-3">
          {doelen.length === 0 && (
            <p className="py-6 text-center text-sm text-gray-400">Nog geen doelen — voeg er hierboven één toe.</p>
          )}

          {doelen.map((doel) => {
            const percentage = formatVoortgang(doel.opgehaald_bedrag, doel.doelbedrag);
            const teamsBewerken = bewerkTeamsVoorId === doel.id;
            const betaalverzoekenGetoond = getoondeBetaalverzoekenId === doel.id;
            return (
              <div key={doel.id} className="rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-brand-600" />
                    <p className="font-medium text-gray-900">{doel.titel}</p>
                    {!doel.is_actief && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                        Gesloten
                      </span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={bezigId === doel.id}
                    onClick={() => toggleActief(doel)}
                  >
                    {bezigId === doel.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : doel.is_actief ? (
                      <Lock className="h-3.5 w-3.5" />
                    ) : (
                      <LockOpen className="h-3.5 w-3.5" />
                    )}
                    {doel.is_actief ? "Sluiten" : "Heropenen"}
                  </Button>
                </div>
                <div className="mt-3 space-y-1">
                  <ProgressBar percentage={percentage} />
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      {formatEuro(doel.opgehaald_bedrag)} van {formatEuro(doel.doelbedrag)}
                    </span>
                    <span className="font-semibold text-brand-700">{percentage}%</span>
                  </div>
                </div>

                {doel.end_date && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
                    <CalendarClock className="h-3.5 w-3.5" />
                    Sluit automatisch op{" "}
                    {new Date(doel.end_date).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                )}

                <div className="mt-3 border-t border-gray-100 pt-3">
                  {teamsBewerken ? (
                    <div className="space-y-2">
                      {teams.length > 0 ? (
                        <TeamsPicker teams={teams} geselecteerd={bewerkSelectie} onToggle={toggleBewerkTeam} />
                      ) : (
                        <p className="text-xs text-gray-400">Deze club heeft nog geen teams.</p>
                      )}
                      <div className="flex gap-2">
                        <Button size="sm" disabled={bewerkBezig} onClick={() => teamsOpslaan(doel.id)}>
                          {bewerkBezig && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Opslaan
                        </Button>
                        <Button size="sm" variant="ghost" disabled={bewerkBezig} onClick={() => setBewerkTeamsVoorId(null)}>
                          Annuleren
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => beginTeamsBewerken(doel)}
                      className="flex w-full items-center justify-between gap-2 text-left text-xs text-gray-500 hover:text-gray-700"
                    >
                      <span className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        {doel.team_ids.length === 0
                          ? "Open voor alle teams"
                          : `Alleen: ${doel.team_ids.map((id) => teamNaamPerId.get(id) ?? "onbekend team").join(", ")}`}
                      </span>
                      <Pencil className="h-3 w-3 shrink-0" />
                    </button>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-2 border-t border-gray-100 pt-3">
                  {doel.is_actief && (
                    <Button size="sm" variant="secondary" disabled={afrondenBezigId === doel.id} onClick={() => actieAfronden(doel)}>
                      {afrondenBezigId === doel.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Zap className="h-3.5 w-3.5" />
                      )}
                      Actie nu afronden &amp; Verzoeken genereren
                    </Button>
                  )}
                  {!doel.is_actief && (
                    <Button size="sm" variant="ghost" onClick={() => toonBetaalverzoeken(doel.id)}>
                      <Receipt className="h-3.5 w-3.5" />
                      {betaalverzoekenGetoond ? "Verberg betaalverzoeken" : "Bekijk betaalverzoeken"}
                    </Button>
                  )}
                </div>

                {betaalverzoekenGetoond && (
                  <div className="mt-2 rounded-lg bg-gray-50 px-3">
                    {betaalverzoekenLadend ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                      </div>
                    ) : (
                      <BetaalverzoekenLijst betaalverzoeken={betaalverzoekenPerDoel.get(doel.id) ?? []} />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
