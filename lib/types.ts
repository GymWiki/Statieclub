// Centrale TypeScript-types die 1-op-1 aansluiten op het relationele
// databaseschema in supabase/migrations. Bewust geen geneste
// list-structuren in de DB-rijen zelf — joins worden expliciet als
// aparte, benoemde velden gemodelleerd in de *Met... varianten.

export type OphaalverzoekStatus = "open" | "geclaimd" | "ingeleverd" | "voltooid";
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
  actief_spaardoel: string;
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
  created_at: string;
  updated_at: string;
}

export interface Donateur {
  id: string;
  naam: string;
  email: string;
  adres: string;
  postcode: string;
  telefoonnummer: string | null;
  created_at: string;
  updated_at: string;
}

export interface Ophaalverzoek {
  id: string;
  donateur_id: string;
  club_id: string;
  geclaimd_door_team_id: string | null;
  status: OphaalverzoekStatus;
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

/** Volledig verzoek + adres, alleen server-side opgehaald na claim. */
export interface OphaalverzoekMetAdres extends Ophaalverzoek {
  donateur_naam: string;
  donateur_adres: string;
  donateur_postcode: string;
  donateur_telefoonnummer: string | null;
}

export interface Bonnetje {
  id: string;
  ophaalverzoek_id: string;
  team_id: string;
  foto_url: string;
  bedrag_euro: number;
  punten: number;
  status: BonnetjeStatus;
  flag_reden: string | null;
  geverifieerd_door: string | null;
  geverifieerd_op: string | null;
  created_at: string;
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
  club_id: string;
  aantal_geschat: number;
  opmerking?: string;
}
