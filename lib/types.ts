// Centrale TypeScript-types die 1-op-1 aansluiten op het relationele
// databaseschema in supabase/migrations. Bewust geen geneste
// list-structuren in de DB-rijen zelf — joins worden expliciet als
// aparte, benoemde velden gemodelleerd in de *Met... varianten.

export type OphaalverzoekStatus = "open" | "geclaimd" | "ingeleverd" | "voltooid";
export type BonnetjeStatus = "ingeleverd" | "goedgekeurd" | "afgekeurd";
export type ClubRol = "penningmeester" | "bestuurslid";

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
  geverifieerd_door: string | null;
  geverifieerd_op: string | null;
  created_at: string;
}

export interface ClubAdmin {
  id: string;
  club_id: string;
  user_id: string;
  rol: ClubRol;
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
