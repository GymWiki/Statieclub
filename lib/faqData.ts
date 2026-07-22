/**
 * Gedeelde FAQ-data — los van `components/marketing/Faq.tsx` (een
 * "use client"-component) omdat een server component (app/page.tsx)
 * geen databinding uit een client-module kan importeren zonder de
 * server/client-boundary te breken. Zowel de zichtbare accordion als
 * de FAQPage-JSON-LD lezen hieruit, dus blijven ze altijd in sync.
 */
export interface FaqVraag {
  vraag: string;
  antwoord: string;
}

export const VRAGEN: FaqVraag[] = [
  {
    vraag: "Moet ik thuisblijven tot een team langskomt?",
    antwoord:
      "Nee — je claimt geen vast tijdstip. Zodra een team jouw adres claimt, kun je via de veilige, ingebouwde chat afstemmen wanneer het uitkomt. Je flessen mogen gewoon buiten of bij de deur staan.",
  },
  {
    vraag: "Hoe communiceer ik met de ophaler?",
    antwoord:
      "Via onze veilige, ingebouwde chat! Je telefoonnummer blijft 100% privé. Zodra je flessen zijn opgehaald, wordt de chat automatisch gesloten en verwijderd.",
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
