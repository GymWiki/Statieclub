// Centrale TypeScript-types die 1-op-1 aansluiten op het relationele
// databaseschema in supabase/migrations. Bewust geen geneste
// list-structuren in de DB-rijen zelf — joins worden expliciet als
// aparte, benoemde velden gemodelleerd in de *Met... varianten.

export type OphaalverzoekStatus = "open" | "geclaimd" | "ingeleverd" | "voltooid";
/**
 * 'glasbak' is de "Glas-naar-Kas"-service: een vooraf betaalde
 * donatie om oud papier/glas te laten weggooien, zonder bonnetje-scan.
 */
export type OphaalverzoekType = "statiegeld" | "glasbak";
/** Waar een bonnetjes-rij vandaan komt — bepaalt of een foto vereist is en of hij meetelt voor de 5%-platformfee. */
export type BonnetjeBron = "scan" | "glas_naar_kas";
/**
 * De applicatie produceert vanaf de anomaly-detection-uitbreiding
 * alleen nog 'in_afwachting_controle' | 'goedgekeurd' | 'afgekeurd'.
 * De DB-enum bevat om historische/compatibiliteitsredenen ook nog
 * 'ingeleverd', maar dat wordt door de app niet meer geschreven.
 */
export type BonnetjeStatus = "in_afwachting_controle" | "goedgekeurd" | "afgekeurd";
export type FactuurStatus = "concept" | "verzonden" | "betaald";

export interface Club {
  id: string;
  naam: string;
  slug: string;
  logo_url: string | null;
  postcode: string;
  regio: string;
  is_actief: boolean;
  /** Stripe Express-account-id (acct_...) van deze club, aangemaakt via POST /api/stripe/create-connect-account (migratie 0015). */
  stripe_account_id: string | null;
  /** True zodra Stripe (via het account.updated-webhook) bevestigt dat de club charges_enabled + payouts_enabled + details_submitted heeft. */
  onboarding_complete: boolean;
  created_at: string;
  updated_at: string;
}

/** Een spaardoel/campagne van een club — een club kan er 0, 1 of meerdere hebben. */
export interface Doel {
  id: string;
  club_id: string;
  titel: string;
  doelbedrag: number;
  opgehaald_bedrag: number;
  is_actief: boolean;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  club_id: string;
  team_naam: string;
  totaal_punten: number;
  totaal_opgehaald_euro: number;
  /** "Glas-naar-Kas" aan/uit per team — standaard uit, een beheerder zet dit bewust aan (zie migratie 0013). */
  glas_service_actief: boolean;
  created_at: string;
  updated_at: string;
}

/** Koppeling tussen een doel en een team dat ervoor mag meedoen (migratie 0012). */
export interface DoelTeam {
  doel_id: string;
  team_id: string;
}

/**
 * Doel + de teams die ervoor mogen meedoen. Een lege `team_ids` betekent
 * "open voor alle teams van de club" — dat is ook het gedrag van elk
 * doel van vóór migratie 0012, die simpelweg geen rijen in `doel_teams`
 * heeft.
 */
export interface DoelMetTeams extends Doel {
  team_ids: string[];
}

export interface Donateur {
  id: string;
  naam: string;
  email: string;
  adres: string;
  postcode: string;
  telefoonnummer: string | null;
  /** Optioneel — alleen server-side gebruikt (afstand + fuzzy kaart-cirkel), nooit direct naar de client. */
  lat: number | null;
  lng: number | null;
  created_at: string;
  updated_at: string;
}

export interface Ophaalverzoek {
  id: string;
  donateur_id: string;
  club_id: string;
  doel_id: string | null;
  geclaimd_door_team_id: string | null;
  /** Losstaand van geclaimd_door_team_id — puur voor persoonlijke buurt-badges. */
  geclaimd_door_speler_id: string | null;
  status: OphaalverzoekStatus;
  type: OphaalverzoekType;
  /** True zodra de donatie via Stripe Checkout is afgerekend — alleen bij type 'glasbak'. De rij wordt pas aangemaakt ná betaling, dus dit staat bij aanmaak altijd al op true. */
  vooraf_betaald: boolean;
  /** Vast donatiebedrag bij type 'glasbak' (€5/€10/€15); null bij 'statiegeld'. */
  donatie_bedrag: number | null;
  /** Stripe Checkout Session-id die deze 'glasbak'-donatie heeft betaald (migratie 0015) — null bij 'statiegeld'. Dient voor webhook-idempotentie en de lookup vanaf de "bedankt"-pagina. */
  stripe_checkout_session_id: string | null;
  aantal_geschat: number;
  opmerking: string | null;
  aangemaakt_op: string;
  geclaimd_op: string | null;
  ingeleverd_op: string | null;
  voltooid_op: string | null;
}

/** Rij uit de publieke `ophaalverzoeken_prikbord` view (geen PII). */
export interface OphaalverzoekPrikbord {
  id: string;
  club_id: string;
  status: OphaalverzoekStatus;
  geclaimd_door_team_id: string | null;
  aantal_geschat: number;
  postcode_cijfers: string;
  aangemaakt_op: string;
}

/**
 * Volledig verzoek + adres, alleen server-side opgehaald na claim.
 * Bewust geen telefoonnummer: contact loopt via het anonieme
 * chatsysteem, niet via 06-nummers.
 */
export interface OphaalverzoekMetAdres extends Ophaalverzoek {
  donateur_naam: string;
  donateur_adres: string;
  donateur_postcode: string;
}

/**
 * Rij uit `GET /api/ophaalverzoeken/nearby` (de "getNearbyRequests"-
 * functie) — bewust GEEN adres/naam/telefoonnummer/exacte coördinaat.
 * `fuzzy_locatie` is een willekeurig verschoven punt (150-300m), enkel
 * voor de zone-cirkel op de mock-kaart; `afstand_meters` is wél de
 * echte afstand (die verklapt zelf geen richting/locatie).
 */
export interface OphaalverzoekNearby {
  id: string;
  status: OphaalverzoekStatus;
  type: OphaalverzoekType;
  /** Bij type 'glasbak': het vaste, al betaalde donatiebedrag — publiek, want het is nooit gekoppeld aan een adres. */
  donatie_bedrag: number | null;
  aantal_geschat: number;
  geclaimd_door_team_id: string | null;
  aangemaakt_op: string;
  postcode_cijfers: string;
  afstand_meters: number | null;
  fuzzy_locatie: { lat: number; lng: number } | null;
}

// ─────────────────────────────────────────────────────────────
// Anoniem chatsysteem (speler ↔ donateur, per ophaalverzoek)
// ─────────────────────────────────────────────────────────────

export type BerichtAfzenderType = "speler" | "donateur" | "systeem";

export interface Bericht {
  id: string;
  ophaalverzoek_id: string;
  afzender_type: BerichtAfzenderType;
  bericht_tekst: string;
  aangemaakt_op: string;
}

export interface Bonnetje {
  id: string;
  ophaalverzoek_id: string | null;
  team_id: string;
  speler_id: string | null;
  /** Null bij bron 'glas_naar_kas' — daar is geen foto, het bedrag ligt al vast. */
  foto_url: string | null;
  bedrag_euro: number;
  punten: number;
  status: BonnetjeStatus;
  bron: BonnetjeBron;
  flag_reden: string | null;
  geverifieerd_door: string | null;
  geverifieerd_op: string | null;
  created_at: string;
}

// ─────────────────────────────────────────────────────────────
// Gamification: spelers, badges
// ─────────────────────────────────────────────────────────────

export type BadgeCategorie = "Volume" | "Streak" | "Actie";

/**
 * Machine-sleutel die lib/badges.ts#evaluateBadges begrijpt. Nieuwe
 * soorten badges toevoegen is een kwestie van een rij in `badges` +
 * (indien echt een nieuw soort criterium) een extra case daar — geen
 * schemawijziging nodig.
 */
export type BadgeCriteriaType =
  | "eerste_scan"
  | "enkele_scan_euro"
  | "exact_bedrag"
  | "totaal_euro"
  | "aantal_scans"
  | "week_streak"
  | "aantal_claims"
  | "snelle_claim";

export interface Speler {
  id: string;
  club_id: string;
  team_id: string | null;
  naam: string;
  avatar_emoji: string;
  totaal_opgehaald_euro: number;
  totaal_scans: number;
  current_week_streak: number;
  longest_streak: number;
  laatste_scan_week: string | null;
  created_at: string;
  updated_at: string;
}

export interface Badge {
  id: string;
  naam: string;
  beschrijving: string;
  icoon: string;
  categorie: BadgeCategorie;
  criteria_type: BadgeCriteriaType;
  criteria_waarde: number | null;
  volgorde: number;
  /** "Easter egg": naam/icoon/beschrijving blijven verborgen totdat de speler hem ontgrendelt. */
  verborgen: boolean;
  created_at: string;
}

export interface SpelerBadge {
  id: string;
  speler_id: string;
  badge_id: string;
  unlocked_at: string;
}

/** Badge + of/wanneer de speler hem al ontgrendeld heeft — gebruikt door BadgesGrid. */
export interface BadgeMetStatus extends Badge {
  ontgrendeld: boolean;
  unlocked_at: string | null;
}

/** Platform-factuur: 5% software-fee over goedgekeurde bonnetjes in een periode. */
export interface Factuur {
  id: string;
  club_id: string;
  periode_start: string;
  periode_eind: string;
  totaal_goedgekeurd_bedrag: number;
  platform_fee_percentage: number;
  platform_fee_bedrag: number;
  status: FactuurStatus;
  aangemaakt_door: string | null;
  aangemaakt_op: string;
}

export interface ClubAdmin {
  id: string;
  club_id: string;
  user_id: string;
  created_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  naam: string;
  created_at: string;
}

/** Gegevens die de donateur invult in het ophaalformulier. */
export interface OphaalformulierInput {
  naam: string;
  email: string;
  adres: string;
  postcode: string;
  telefoonnummer?: string;
  /** Optioneel — alleen gevuld als de browser-geolocatie werd toegestaan. */
  lat?: number;
  lng?: number;
  club_id: string;
  doel_id: string;
  /** Weggelaten of 'statiegeld': normale flow, aantal_geschat verplicht. 'glasbak': donatie_bedrag verplicht i.p.v. aantal_geschat. */
  type?: OphaalverzoekType;
  aantal_geschat?: number;
  donatie_bedrag?: number;
  opmerking?: string;
}

/** Body voor POST /api/stripe/create-checkout-session — start een echte Stripe-betaling voor een 'glasbak'-donatie (migratie 0015). */
export interface GlasCheckoutInput {
  naam: string;
  email: string;
  adres: string;
  postcode: string;
  telefoonnummer?: string;
  club_id: string;
  doel_id: string;
  bedrag: number;
  opmerking?: string;
}
