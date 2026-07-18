"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Flag, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export type MeldingReden = "onbeleefd" | "niet_opgedaagd" | "te_jong_voor_glas" | "anders";

export interface MeldingInput {
  reden: MeldingReden;
  toelichting: string;
}

interface MeldingOptie {
  waarde: MeldingReden;
  label: string;
}

const MELDING_OPTIES: MeldingOptie[] = [
  { waarde: "onbeleefd", label: "Persoon was onbeleefd" },
  { waarde: "niet_opgedaagd", label: "Speler is niet komen opdagen" },
  { waarde: "te_jong_voor_glas", label: "Speler was te jong voor glas" },
  { waarde: "anders", label: "Anders…" },
];

interface ReportModalProps {
  open: boolean;
  onClose: () => void;
  /**
   * Optioneel: koppel dit aan een echt endpoint (bijv. `POST
   * /api/meldingen`). Zonder deze prop simuleert de modal het versturen
   * — de UI-flow (opties, toelichting, bevestiging) is de deliverable
   * hier, geen aparte meldingen-backend.
   */
  onSubmit?: (melding: MeldingInput) => Promise<void>;
}

/**
 * Trust & Safety: laagdrempelige meldknop, te openen vanuit een actief
 * ophaalverzoek of de chat. Bewust geen open tekstveld als enige optie
 * — de vaste reden-opties maken het voor het bestuur meteen scanbaar
 * wat er aan de hand is, de toelichting is er voor de context.
 */
export function ReportModal({ open, onClose, onSubmit }: ReportModalProps) {
  const [reden, setReden] = useState<MeldingReden | null>(null);
  const [toelichting, setToelichting] = useState("");
  const [versturen, setVersturen] = useState(false);
  const [verzonden, setVerzonden] = useState(false);
  const [foutmelding, setFoutmelding] = useState<string | null>(null);

  function sluitEnReset() {
    onClose();
    // Kleine vertraging zodat de exit-animatie niet midden in een content-wissel plaatsvindt.
    setTimeout(() => {
      setReden(null);
      setToelichting("");
      setVersturen(false);
      setVerzonden(false);
      setFoutmelding(null);
    }, 200);
  }

  async function verstuurMelding() {
    if (!reden || versturen) return;
    setVersturen(true);
    setFoutmelding(null);

    try {
      if (onSubmit) {
        await onSubmit({ reden, toelichting: toelichting.trim() });
      } else {
        await new Promise((resolve) => setTimeout(resolve, 700));
      }
      setVerzonden(true);
    } catch {
      setFoutmelding("Melding kon niet worden verstuurd. Probeer het opnieuw.");
    } finally {
      setVersturen(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={sluitEnReset}
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm"
            aria-hidden="true"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              key="modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="report-modal-titel"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl"
            >
              <button
                type="button"
                onClick={sluitEnReset}
                aria-label="Sluiten"
                className="absolute right-4 top-4 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>

              {verzonden ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h2 className="mt-1 font-semibold text-gray-900">Melding verstuurd</h2>
                <p className="text-sm text-gray-500">
                  Het clubbestuur is op de hoogte gebracht en neemt dit serieus. Bedankt voor het melden.
                </p>
                <Button className="mt-4" variant="secondary" onClick={sluitEnReset}>
                  Sluiten
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 pr-6">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-red-100 text-red-600">
                    <Flag className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h2 id="report-modal-titel" className="font-semibold text-gray-900">
                      Melding maken
                    </h2>
                    <p className="text-xs text-gray-500">Deze melding gaat direct naar het clubbestuur.</p>
                  </div>
                </div>

                <fieldset className="mt-5 space-y-2">
                  <legend className="sr-only">Wat is er aan de hand?</legend>
                  {MELDING_OPTIES.map((optie) => (
                    <label
                      key={optie.waarde}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 text-sm transition-colors",
                        reden === optie.waarde
                          ? "border-red-300 bg-red-50 text-red-900"
                          : "border-gray-200 text-gray-700 hover:bg-gray-50"
                      )}
                    >
                      <input
                        type="radio"
                        name="melding-reden"
                        value={optie.waarde}
                        checked={reden === optie.waarde}
                        onChange={() => setReden(optie.waarde)}
                        className="h-4 w-4 border-gray-300 text-red-600 focus:ring-red-500/30"
                      />
                      {optie.label}
                    </label>
                  ))}
                </fieldset>

                <div className="mt-4">
                  <label htmlFor="melding-toelichting" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Toelichting <span className="font-normal text-gray-400">(optioneel)</span>
                  </label>
                  <textarea
                    id="melding-toelichting"
                    value={toelichting}
                    onChange={(e) => setToelichting(e.target.value)}
                    rows={3}
                    maxLength={500}
                    placeholder="Vertel wat er is gebeurd…"
                    className="w-full resize-none rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  />
                </div>

                {foutmelding && <p className="mt-3 text-xs font-medium text-red-600">{foutmelding}</p>}

                <Button
                  variant="danger"
                  className="mt-5 w-full justify-center"
                  disabled={!reden || versturen}
                  onClick={verstuurMelding}
                >
                  {versturen ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Versturen…
                    </>
                  ) : (
                    "Verstuur melding"
                  )}
                </Button>
              </>
            )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
