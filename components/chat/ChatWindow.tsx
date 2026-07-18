"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Flag, Loader2, Lock, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReportModal } from "@/components/ui/ReportModal";
import type { Bericht, BerichtAfzenderType } from "@/lib/types";

const POLL_INTERVAL_MS = 2500;

/**
 * Herbruikbare chat-interface, gedeeld door de speler-kant (in de app)
 * en de donateur-kant (de "magic link"-statuspagina) — enkel
 * `afzenderType` verschilt, de rest van het gedrag is identiek. Geen
 * telefoonnummers, geen WhatsApp: alle berichten hangen aan het
 * ophaalverzoek en lopen via `/api/berichten` (service-role, want
 * `berichten` heeft bewust geen publieke leesrechten).
 *
 * "Realtime" is hier bewust korte polling i.p.v. een Supabase Realtime
 * subscription: dat laatste vereist een publieke SELECT-policy, en
 * zonder een auth.uid() om een rij-conditie op te hangen zou dat de
 * hele tabel voor iedereen leesbaar maken — zie migratie 0011.
 */
export function ChatWindow({
  ophaalverzoekId,
  afzenderType,
  gesloten,
}: {
  ophaalverzoekId: string;
  afzenderType: Exclude<BerichtAfzenderType, "systeem">;
  gesloten: boolean;
}) {
  const [berichten, setBerichten] = useState<Bericht[]>([]);
  const [ladend, setLadend] = useState(true);
  const [tekst, setTekst] = useState("");
  const [versturen, setVersturen] = useState(false);
  const [verzendfout, setVerzendfout] = useState<string | null>(null);
  const [meldingOpen, setMeldingOpen] = useState(false);
  const bodemRef = useRef<HTMLDivElement>(null);

  const laadBerichten = useCallback(async () => {
    const res = await fetch(`/api/berichten?ophaalverzoek_id=${ophaalverzoekId}`);
    if (res.ok) {
      const json = await res.json();
      setBerichten(json.berichten ?? []);
    }
    setLadend(false);
  }, [ophaalverzoekId]);

  useEffect(() => {
    laadBerichten();
    const interval = setInterval(laadBerichten, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [laadBerichten]);

  useEffect(() => {
    bodemRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [berichten.length]);

  async function verstuur(e: React.FormEvent) {
    e.preventDefault();
    const bericht = tekst.trim();
    if (!bericht || gesloten || versturen) return;

    setVersturen(true);
    setVerzendfout(null);
    setTekst("");
    try {
      const res = await fetch("/api/berichten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ophaalverzoek_id: ophaalverzoekId,
          afzender_type: afzenderType,
          bericht_tekst: bericht,
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setVerzendfout(json?.error ?? "Bericht kon niet worden verstuurd. Probeer het opnieuw.");
        // Niet klakkeloos overschrijven als er intussen alweer iets nieuws getypt is.
        setTekst((huidige) => huidige || bericht);
        return;
      }

      await laadBerichten();
    } catch {
      setVerzendfout("Kon geen verbinding maken. Probeer het opnieuw.");
      setTekst((huidige) => huidige || bericht);
    } finally {
      setVersturen(false);
    }
  }

  return (
    <div className="flex h-[28rem] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="flex items-center justify-end border-b border-gray-100 px-3 py-2">
        <button
          type="button"
          onClick={() => setMeldingOpen(true)}
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <Flag className="h-3.5 w-3.5" /> Melding maken
        </button>
      </div>
      <div className="flex-1 space-y-2.5 overflow-y-auto p-4">
        {ladend && (
          <div className="flex justify-center py-6 text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}
        {!ladend && berichten.length === 0 && (
          <p className="py-6 text-center text-sm text-gray-400">Nog geen berichten — zeg gerust hallo!</p>
        )}
        {berichten.map((bericht) => {
          if (bericht.afzender_type === "systeem") {
            return (
              <p
                key={bericht.id}
                className="mx-auto max-w-[85%] rounded-full bg-gray-100 px-3 py-1.5 text-center text-xs text-gray-500"
              >
                {bericht.bericht_tekst}
              </p>
            );
          }

          const eigen = bericht.afzender_type === afzenderType;
          return (
            <div key={bericht.id} className={cn("flex", eigen ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm",
                  eigen ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-800"
                )}
              >
                {bericht.bericht_tekst}
                <p className={cn("mt-0.5 text-[10px]", eigen ? "text-white/70" : "text-gray-400")}>
                  {new Date(bericht.aangemaakt_op).toLocaleTimeString("nl-NL", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bodemRef} />
      </div>

      {gesloten ? (
        <div className="flex items-center gap-2 border-t border-gray-200 bg-gray-50 px-4 py-3.5 text-sm text-gray-500">
          <Lock className="h-4 w-4 shrink-0" /> Deze ophaalactie is afgerond. De chat is gesloten.
        </div>
      ) : (
        <form onSubmit={verstuur} className="border-t border-gray-200 p-3">
          {verzendfout && (
            <p className="mb-2 flex items-center gap-1.5 text-xs text-red-600">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {verzendfout}
            </p>
          )}
          <div className="flex items-center gap-2">
            <input
              value={tekst}
              onChange={(e) => setTekst(e.target.value)}
              placeholder="Typ een bericht…"
              maxLength={500}
              className="flex-1 rounded-full border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
            <button
              type="submit"
              disabled={!tekst.trim() || versturen}
              aria-label="Verstuur bericht"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-600 text-white transition-opacity disabled:opacity-40"
            >
              {versturen ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </form>
      )}

      <ReportModal open={meldingOpen} onClose={() => setMeldingOpen(false)} />
    </div>
  );
}
