"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useFadeUpVariants } from "@/lib/motion";
import { cn } from "@/lib/utils";

const VRAGEN: { vraag: string; antwoord: string }[] = [
  {
    vraag: "Moet ik thuisblijven tot een team langskomt?",
    antwoord:
      "Nee — je claimt geen vast tijdstip. Zodra een team jouw adres claimt, sturen ze je vooraf een WhatsApp-berichtje. Je flessen mogen gewoon buiten of bij de deur staan.",
  },
  {
    vraag: "Is er een AVG-risico als ik mijn adres deel?",
    antwoord:
      "Je adres is alleen zichtbaar voor het team dat jouw verzoek claimt, nooit publiek op het prikbord. We bewaren enkel wat nodig is om het ophalen te laten werken en delen niets met derden.",
  },
  {
    vraag: "Kost het gebruik van Statieclub geld voor onze club?",
    antwoord:
      "Meedoen is gratis. We rekenen alleen een klein platformpercentage (5%) over daadwerkelijk goedgekeurde en opgehaalde bedragen — geen abonnement, geen verborgen kosten.",
  },
  {
    vraag: "Wat als de scanner het bedrag op mijn bonnetje niet goed leest?",
    antwoord:
      "Geen probleem — je bevestigt altijd zelf het bedrag voordat het wordt opgeslagen. Herkent de scanner niets, dan vul je het gewoon handmatig in; de foto blijft bewaard.",
  },
  {
    vraag: "Kan ik als donateur meerdere clubs steunen?",
    antwoord:
      "Zeker. Je kunt zo vaak als je wilt een ophaalverzoek plaatsen bij verschillende clubs in jouw buurt — daar zit geen limiet op.",
  },
  {
    vraag: "Hoe weet ik zeker dat mijn statiegeld echt bij de club terechtkomt?",
    antwoord:
      "Elk goedgekeurd bonnetje wordt direct en transparant bijgeschreven op het live scorebord van het team en het spaardoel van de club — je kunt de voortgang zelf volgen.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  const item = useFadeUpVariants();

  return (
    <section className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-5 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={item}
          className="text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">Veelgestelde vragen</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Nog twijfels?
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={item}
          transition={{ delay: 0.1 }}
          className="mt-12 divide-y divide-slate-200 overflow-hidden rounded-3xl border border-slate-200 bg-white/60 backdrop-blur-xl"
        >
          {VRAGEN.map((v, i) => {
            const isOpen = open === i;
            return (
              <div key={v.vraag}>
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span className="font-semibold text-slate-900">{v.vraag}</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-slate-400 transition-transform",
                      isOpen && "rotate-180"
                    )}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-5 text-sm leading-relaxed text-slate-600">{v.antwoord}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
