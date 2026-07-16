-- Statieclub — initieel databaseschema
-- Volledig relationeel opgezet (geen geneste/array/JSON lijst-kolommen):
-- elke 1-op-veel relatie is een aparte tabel met een foreign key.

create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────────────────────
-- Enums
-- ─────────────────────────────────────────────────────────────
create type ophaalverzoek_status as enum ('open', 'geclaimd', 'ingeleverd', 'voltooid');
create type bonnetje_status as enum ('ingeleverd', 'goedgekeurd', 'afgekeurd');
create type club_rol as enum ('penningmeester', 'bestuurslid');

-- Vaste omrekenfactor voor gamification: punten per opgehaalde euro statiegeld.
-- (Bewust een applicatie-constante i.p.v. instelbaar per club, om de eerste versie simpel te houden.)
-- 10 punten per euro.

-- ─────────────────────────────────────────────────────────────
-- 1. clubs
-- ─────────────────────────────────────────────────────────────
create table clubs (
  id                 uuid primary key default gen_random_uuid(),
  naam               text not null,
  slug               text not null unique,
  logo_url           text,
  postcode           text not null,
  regio              text not null,
  actief_spaardoel   text not null,
  doelbedrag         numeric(10, 2) not null default 0 check (doelbedrag >= 0),
  opgehaald_bedrag   numeric(10, 2) not null default 0 check (opgehaald_bedrag >= 0),
  is_actief          boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index idx_clubs_postcode on clubs (postcode);
create index idx_clubs_actief on clubs (is_actief);

-- ─────────────────────────────────────────────────────────────
-- 2. teams
-- ─────────────────────────────────────────────────────────────
create table teams (
  id                      uuid primary key default gen_random_uuid(),
  club_id                 uuid not null references clubs (id) on delete cascade,
  team_naam               text not null,
  totaal_punten           integer not null default 0 check (totaal_punten >= 0),
  totaal_opgehaald_euro   numeric(10, 2) not null default 0 check (totaal_opgehaald_euro >= 0),
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  unique (club_id, team_naam)
);

create index idx_teams_club_id on teams (club_id);

-- ─────────────────────────────────────────────────────────────
-- 3. donateurs
-- Persoonsgegevens: apart van ophaalverzoeken zodat een donateur
-- bij een volgende actie met 1 klik (via e-mail lookup) een andere
-- club kan kiezen zonder gegevens opnieuw in te vullen.
-- ─────────────────────────────────────────────────────────────
create table donateurs (
  id               uuid primary key default gen_random_uuid(),
  naam             text not null,
  email            text not null unique,
  adres            text not null,
  postcode         text not null,
  telefoonnummer   text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index idx_donateurs_postcode on donateurs (postcode);

-- ─────────────────────────────────────────────────────────────
-- 4. ophaalverzoeken
-- ─────────────────────────────────────────────────────────────
create table ophaalverzoeken (
  id                     uuid primary key default gen_random_uuid(),
  donateur_id            uuid not null references donateurs (id) on delete cascade,
  club_id                uuid not null references clubs (id) on delete cascade,
  geclaimd_door_team_id  uuid references teams (id) on delete set null,
  status                 ophaalverzoek_status not null default 'open',
  aantal_geschat         integer not null check (aantal_geschat > 0),
  opmerking              text,
  aangemaakt_op          timestamptz not null default now(),
  geclaimd_op            timestamptz,
  ingeleverd_op          timestamptz,
  voltooid_op            timestamptz,

  constraint chk_geclaimd_team_consistent check (
    (status = 'open' and geclaimd_door_team_id is null)
    or (status <> 'open' and geclaimd_door_team_id is not null)
  )
);

create index idx_ophaalverzoeken_club_status on ophaalverzoeken (club_id, status);
create index idx_ophaalverzoeken_donateur on ophaalverzoeken (donateur_id);
create index idx_ophaalverzoeken_team on ophaalverzoeken (geclaimd_door_team_id);

-- ─────────────────────────────────────────────────────────────
-- 5. bonnetjes (statiegeldbonnen, geüpload door teamleden)
-- ─────────────────────────────────────────────────────────────
create table bonnetjes (
  id                 uuid primary key default gen_random_uuid(),
  ophaalverzoek_id   uuid not null references ophaalverzoeken (id) on delete cascade,
  team_id            uuid not null references teams (id) on delete cascade,
  foto_url           text not null,
  bedrag_euro        numeric(10, 2) not null check (bedrag_euro > 0),
  punten             integer not null check (punten >= 0),
  status             bonnetje_status not null default 'ingeleverd',
  geverifieerd_door  text,
  geverifieerd_op    timestamptz,
  created_at         timestamptz not null default now()
);

create index idx_bonnetjes_team on bonnetjes (team_id);
create index idx_bonnetjes_status on bonnetjes (status);
create index idx_bonnetjes_ophaalverzoek on bonnetjes (ophaalverzoek_id);

-- ─────────────────────────────────────────────────────────────
-- 6. club_admins — koppelt Supabase Auth-gebruikers aan een club
--    (penningmeester-dashboard toegang)
-- ─────────────────────────────────────────────────────────────
create table club_admins (
  id          uuid primary key default gen_random_uuid(),
  club_id     uuid not null references clubs (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  rol         club_rol not null default 'penningmeester',
  created_at  timestamptz not null default now(),
  unique (club_id, user_id)
);

-- ─────────────────────────────────────────────────────────────
-- 7. team_members — koppelt Supabase Auth-gebruikers aan een team
--    (voor claimen van ophaalverzoeken / bonnetjes uploaden)
-- ─────────────────────────────────────────────────────────────
create table team_members (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid not null references teams (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  naam        text not null,
  created_at  timestamptz not null default now(),
  unique (team_id, user_id)
);

create index idx_team_members_user on team_members (user_id);

-- ─────────────────────────────────────────────────────────────
-- updated_at trigger helper
-- ─────────────────────────────────────────────────────────────
create function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_clubs_updated_at before update on clubs
  for each row execute function set_updated_at();

create trigger trg_teams_updated_at before update on teams
  for each row execute function set_updated_at();

create trigger trg_donateurs_updated_at before update on donateurs
  for each row execute function set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- Gamification-trigger: zodra een bonnetje wordt ingeleverd (insert),
-- worden punten/euro's DIRECT bijgeschreven op het team (instant
-- gratification voor het leaderboard) en de bijbehorende status van
-- het ophaalverzoek gaat naar 'ingeleverd'. De club-teller telt
-- automatisch mee via de teams-trigger.
-- ─────────────────────────────────────────────────────────────
create function apply_bonnetje_insert()
returns trigger as $$
begin
  update teams
    set totaal_opgehaald_euro = totaal_opgehaald_euro + new.bedrag_euro,
        totaal_punten = totaal_punten + new.punten
    where id = new.team_id;

  update ophaalverzoeken
    set status = 'ingeleverd',
        ingeleverd_op = now()
    where id = new.ophaalverzoek_id;

  return new;
end;
$$ language plpgsql;

create trigger trg_bonnetje_insert after insert on bonnetjes
  for each row execute function apply_bonnetje_insert();

-- Als een penningmeester een bonnetje afkeurt nadat het al meetelde,
-- corrigeer dan de teamtotalen weer terug.
create function apply_bonnetje_status_change()
returns trigger as $$
begin
  if old.status <> 'afgekeurd' and new.status = 'afgekeurd' then
    update teams
      set totaal_opgehaald_euro = totaal_opgehaald_euro - old.bedrag_euro,
          totaal_punten = totaal_punten - old.punten
      where id = old.team_id;
  end if;

  if new.status = 'goedgekeurd' and old.status <> 'goedgekeurd' then
    new.geverifieerd_op = now();
    update ophaalverzoeken
      set status = 'voltooid',
          voltooid_op = now()
      where id = new.ophaalverzoek_id;
  end if;

  return new;
end;
$$ language plpgsql;

create trigger trg_bonnetje_status_change before update on bonnetjes
  for each row execute function apply_bonnetje_status_change();

-- Houd clubs.opgehaald_bedrag synchroon met de som van alle teams
-- binnen die club (het "virtuele" saldo op het penningmeester-dashboard).
create function sync_club_opgehaald_bedrag()
returns trigger as $$
declare
  affected_club_id uuid;
begin
  affected_club_id := coalesce(new.club_id, old.club_id);

  update clubs
    set opgehaald_bedrag = (
      select coalesce(sum(totaal_opgehaald_euro), 0)
      from teams
      where club_id = affected_club_id
    )
    where id = affected_club_id;

  return null;
end;
$$ language plpgsql;

create trigger trg_teams_sync_club after insert or update of totaal_opgehaald_euro or delete on teams
  for each row execute function sync_club_opgehaald_bedrag();

-- ─────────────────────────────────────────────────────────────
-- Claim-logica: zodra geclaimd_door_team_id gezet wordt, timestamp bijwerken
-- ─────────────────────────────────────────────────────────────
create function set_claim_timestamp()
returns trigger as $$
begin
  if old.geclaimd_door_team_id is null and new.geclaimd_door_team_id is not null then
    new.status = 'geclaimd';
    new.geclaimd_op = now();
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_ophaalverzoek_claim before update on ophaalverzoeken
  for each row execute function set_claim_timestamp();
