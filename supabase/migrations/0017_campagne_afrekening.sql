-- Statieclub — "Set and Forget" campagne-afrekening
--
-- Een "Actie" uit de opdracht is hier `doelen` (die tabel is al
-- precies dat concept — een tijdelijke inzamelcampagne, migratie
-- 0007). `is_actief = false` was al de bestaande manier om een
-- campagne te sluiten (zie de al bestaande "Sluiten"/"Heropenen"-knop
-- in DoelenBeheer.tsx) — dit hergebruikt dat veld voor "afgerond"
-- i.p.v. een nieuwe status-kolom te introduceren.
--
-- Aggregatie: bij het afronden van een doel worden alle 'pending'
-- statiegeld_inleveringen (migratie 0016) van die club gegroepeerd per
-- speler. Rijen die al aan géén enkel doel gekoppeld waren (`doel_id
-- is null` — bijv. na een eerdere rollover) tellen automatisch mee,
-- naast rijen die specifiek aan dít doel gekoppeld zijn.

-- ─────────────────────────────────────────────────────────────
-- 1. doelen.end_date — wanneer de campagne automatisch moet sluiten
-- ─────────────────────────────────────────────────────────────
alter table doelen add column end_date timestamptz;

comment on column doelen.end_date is
  'Optioneel: wanneer gezet, sluit de dagelijkse cron (/api/cron/close-acties) dit doel automatisch zodra deze datum is gepasseerd en genereert betaalverzoeken. Kan ook handmatig vervroegd worden via POST /api/doelen/[id]/afronden.';

-- ─────────────────────────────────────────────────────────────
-- 2. betaalverzoeken — één rij per speler per afgeronde actie waarin
--    de €1-drempel is gehaald.
-- ─────────────────────────────────────────────────────────────
create type betaalverzoek_status as enum ('open', 'betaald');

create table betaalverzoeken (
  id                          uuid primary key default gen_random_uuid(),
  speler_id                   uuid not null references spelers (id) on delete cascade,
  club_id                     uuid not null references clubs (id) on delete cascade,
  doel_id                     uuid references doelen (id) on delete set null,
  bedrag                      numeric(10, 2) not null check (bedrag > 0),
  status                      betaalverzoek_status not null default 'open',
  stripe_checkout_session_id  text,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create index idx_betaalverzoeken_speler on betaalverzoeken (speler_id, status);
create index idx_betaalverzoeken_doel on betaalverzoeken (doel_id);

create trigger trg_betaalverzoeken_updated_at before update on betaalverzoeken
  for each row execute function set_updated_at();

alter table betaalverzoeken enable row level security;
-- Zelfde vertrouwensmodel als statiegeld_inleveringen/bonnetjes: geen
-- publieke policies, uitsluitend via service-role (API routes +
-- webhook).

-- ─────────────────────────────────────────────────────────────
-- 3. statiegeld_inleveringen: koppeling naar een doel (actie) en,
--    zodra geaggregeerd, naar het betaalverzoek dat deze rij dekt.
--    `betaalverzoek_id` is bewust een DIRECTE koppeling (i.p.v. enkel
--    op status te matchen) — een speler kan tegelijk een openstaand
--    betaalverzoek van een eerdere, nog niet betaalde actie hebben én
--    een nieuwe actie die net sluit; zonder deze koppeling zou het
--    webhook niet kunnen zien welke rijen bij wélk betaalverzoek horen
--    wanneer er twee tegelijk 'processed_for_payment' staan.
-- ─────────────────────────────────────────────────────────────
alter table statiegeld_inleveringen add column doel_id uuid references doelen (id) on delete set null;
alter table statiegeld_inleveringen add column betaalverzoek_id uuid references betaalverzoeken (id) on delete set null;

create index idx_statiegeld_inleveringen_doel on statiegeld_inleveringen (doel_id);
create index idx_statiegeld_inleveringen_betaalverzoek on statiegeld_inleveringen (betaalverzoek_id);

-- Nieuwe tussenstatus: 'pending' -> 'processed_for_payment' (zodra
-- meegenomen in een betaalverzoek) -> 'paid' (zodra dat betaalverzoek
-- via Stripe is afgerekend). Moet als apart statement vóór eventueel
-- gebruik ervan, want Postgres staat niet toe dat een nieuwe
-- enum-waarde in dezelfde transactie wordt toegevoegd én gebruikt.
alter type statiegeld_inlevering_status add value 'processed_for_payment';
