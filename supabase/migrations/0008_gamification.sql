-- Statieclub — gamification: spelers, badges en streaks
--
-- Tot nu toe kende de app alleen team-brede statistieken (punten,
-- opgehaald bedrag). Deze migratie voegt een individuele laag toe:
-- elke speler krijgt een eigen (frictieloze) identiteit, persoonlijke
-- statistieken, een week-streak en badges — zonder de bewuste
-- no-login-architectuur van het team-gedeelte los te laten. De
-- speler-id wordt client-side gegenereerd (crypto.randomUUID(), zie
-- lib/playerIdentity.ts) en hier enkel gebruikt als stabiele sleutel.

-- ─────────────────────────────────────────────────────────────
-- 1. spelers
-- ─────────────────────────────────────────────────────────────
create table spelers (
  id                     uuid primary key,
  club_id                uuid not null references clubs (id) on delete cascade,
  team_id                uuid references teams (id) on delete set null,
  naam                   text not null,
  avatar_emoji           text not null default '🙂',
  totaal_opgehaald_euro  numeric(10, 2) not null default 0 check (totaal_opgehaald_euro >= 0),
  totaal_scans           int not null default 0 check (totaal_scans >= 0),
  current_week_streak    int not null default 0 check (current_week_streak >= 0),
  longest_streak         int not null default 0 check (longest_streak >= 0),
  laatste_scan_week      date,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index idx_spelers_club on spelers (club_id);
create index idx_spelers_team on spelers (team_id);

create trigger trg_spelers_updated_at before update on spelers
  for each row execute function set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- 2. badges (seed data onderaan) + speler_badges (junction)
-- ─────────────────────────────────────────────────────────────
create table badges (
  id             uuid primary key default gen_random_uuid(),
  naam           text not null,
  beschrijving   text not null,
  icoon          text not null,
  categorie      text not null check (categorie in ('Volume', 'Streak', 'Actie')),
  -- criteria_type + criteria_waarde worden door de applicatielaag
  -- (lib/badges.ts#evaluateBadges) geïnterpreteerd — geen DB-trigger,
  -- zodat nieuwe badge-soorten toevoegen geen migratie vereist.
  criteria_type  text not null,
  criteria_waarde numeric,
  volgorde       int not null default 0,
  created_at     timestamptz not null default now()
);

create table speler_badges (
  id           uuid primary key default gen_random_uuid(),
  speler_id    uuid not null references spelers (id) on delete cascade,
  badge_id     uuid not null references badges (id) on delete cascade,
  unlocked_at  timestamptz not null default now(),
  unique (speler_id, badge_id)
);

create index idx_speler_badges_speler on speler_badges (speler_id);

-- ─────────────────────────────────────────────────────────────
-- 3. bonnetjes: koppeling aan een speler + een bonnetje mag voortaan
--    zonder ophaalverzoek bestaan ("Scan Eigen Statiegeld" — direct
--    inleveren zonder adres-claim).
-- ─────────────────────────────────────────────────────────────
alter table bonnetjes alter column ophaalverzoek_id drop not null;
alter table bonnetjes add column speler_id uuid references spelers (id) on delete set null;
create index idx_bonnetjes_speler on bonnetjes (speler_id);

-- ─────────────────────────────────────────────────────────────
-- 4. Speler-statistieken bijhouden: totaal, aantal scans en de
--    week-streak. Losse functies (i.p.v. inline in de triggers)
--    omdat dezelfde logica op twee plekken nodig is (nieuw bonnetje
--    direct goedgekeurd, of een eerder geflagd bonnetje alsnog
--    goedgekeurd door de penningmeester).
-- ─────────────────────────────────────────────────────────────
create or replace function credit_speler_voor_bonnetje(p_speler_id uuid, p_bedrag numeric)
returns void as $$
declare
  v_huidige_week date := date_trunc('week', now())::date;
  v_laatste_week date;
  v_streak int;
begin
  if p_speler_id is null then
    return;
  end if;

  select laatste_scan_week, current_week_streak into v_laatste_week, v_streak
  from spelers where id = p_speler_id;

  if v_laatste_week is null then
    v_streak := 1;
  elsif v_laatste_week = v_huidige_week then
    -- deze week al gescand, streak blijft gelijk
    null;
  elsif v_huidige_week - v_laatste_week = 7 then
    v_streak := v_streak + 1;
  else
    -- gat van meer dan 1 week -> streak breekt, telt opnieuw vanaf 1
    v_streak := 1;
  end if;

  update spelers
    set totaal_opgehaald_euro = totaal_opgehaald_euro + p_bedrag,
        totaal_scans = totaal_scans + 1,
        current_week_streak = v_streak,
        longest_streak = greatest(longest_streak, v_streak),
        laatste_scan_week = v_huidige_week,
        updated_at = now()
    where id = p_speler_id;
end;
$$ language plpgsql;

-- Bij het afkeuren van een eerder goedgekeurd bonnetje worden bedrag
-- en scan-telling teruggedraaid. De streak zelf wordt bewust NIET
-- teruggedraaid (een latere afkeuring van een oud bonnetje mag niet
-- met terugwerkende kracht een streak van vandaag breken) — bekende,
-- geaccepteerde beperking.
create or replace function ontkrediteer_speler_voor_bonnetje(p_speler_id uuid, p_bedrag numeric)
returns void as $$
begin
  if p_speler_id is null then
    return;
  end if;

  update spelers
    set totaal_opgehaald_euro = greatest(0, totaal_opgehaald_euro - p_bedrag),
        totaal_scans = greatest(0, totaal_scans - 1),
        updated_at = now()
    where id = p_speler_id;
end;
$$ language plpgsql;

create or replace function apply_bonnetje_insert()
returns trigger as $$
declare
  v_doel_id uuid;
begin
  select doel_id into v_doel_id from ophaalverzoeken where id = new.ophaalverzoek_id;

  if new.status = 'goedgekeurd' then
    new.geverifieerd_op = now();

    update teams
      set totaal_opgehaald_euro = totaal_opgehaald_euro + new.bedrag_euro,
          totaal_punten = totaal_punten + new.punten
      where id = new.team_id;

    if v_doel_id is not null then
      update doelen
        set opgehaald_bedrag = opgehaald_bedrag + new.bedrag_euro
        where id = v_doel_id;
    end if;

    perform credit_speler_voor_bonnetje(new.speler_id, new.bedrag_euro);

    update ophaalverzoeken
      set status = 'voltooid',
          ingeleverd_op = now(),
          voltooid_op = now()
      where id = new.ophaalverzoek_id;
  else
    update ophaalverzoeken
      set status = 'ingeleverd',
          ingeleverd_op = now()
      where id = new.ophaalverzoek_id;
  end if;

  return new;
end;
$$ language plpgsql;

create or replace function apply_bonnetje_status_change()
returns trigger as $$
declare
  v_doel_id uuid;
begin
  select doel_id into v_doel_id from ophaalverzoeken where id = new.ophaalverzoek_id;

  if old.status = 'goedgekeurd' and new.status = 'afgekeurd' then
    update teams
      set totaal_opgehaald_euro = totaal_opgehaald_euro - old.bedrag_euro,
          totaal_punten = totaal_punten - old.punten
      where id = old.team_id;

    if v_doel_id is not null then
      update doelen set opgehaald_bedrag = opgehaald_bedrag - old.bedrag_euro where id = v_doel_id;
    end if;

    perform ontkrediteer_speler_voor_bonnetje(old.speler_id, old.bedrag_euro);
  end if;

  if new.status = 'goedgekeurd' and old.status <> 'goedgekeurd' then
    new.geverifieerd_op = now();

    update teams
      set totaal_opgehaald_euro = totaal_opgehaald_euro + new.bedrag_euro,
          totaal_punten = totaal_punten + new.punten
      where id = new.team_id;

    if v_doel_id is not null then
      update doelen set opgehaald_bedrag = opgehaald_bedrag + new.bedrag_euro where id = v_doel_id;
    end if;

    perform credit_speler_voor_bonnetje(new.speler_id, new.bedrag_euro);

    update ophaalverzoeken
      set status = 'voltooid',
          voltooid_op = now()
      where id = new.ophaalverzoek_id;
  end if;

  return new;
end;
$$ language plpgsql;

-- ─────────────────────────────────────────────────────────────
-- 5. RLS: spelers/badges/speler_badges zijn publiek leesbaar (nodig
--    voor het scorebord, de MVP-lijst en de badge-showcase van
--    andere spelers) — schrijven gebeurt uitsluitend via de
--    service-role in route handlers, zelfde patroon als teams/doelen.
-- ─────────────────────────────────────────────────────────────
alter table spelers enable row level security;
alter table badges enable row level security;
alter table speler_badges enable row level security;

create policy "spelers zijn publiek leesbaar"
  on spelers for select
  using (true);

create policy "badges zijn publiek leesbaar"
  on badges for select
  using (true);

create policy "speler_badges zijn publiek leesbaar"
  on speler_badges for select
  using (true);

-- Live scorebord/profiel-updates (MVP-lijst, "Klapper van de Week",
-- streak-meter) luisteren via Supabase Realtime naar spelers.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'spelers'
  ) then
    alter publication supabase_realtime add table spelers;
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────
-- 6. Seed: minimaal 10 badges verdeeld over Volume/Streak/Actie.
-- ─────────────────────────────────────────────────────────────
insert into badges (naam, beschrijving, icoon, categorie, criteria_type, criteria_waarde, volgorde) values
  ('De IJsbreker',        'Je eerste bonnetje ooit gescand.',                     '🧊', 'Actie',  'eerste_scan',       null, 1),
  ('Kleine Klapper',      '€5 of meer opgehaald met één bonnetje.',               '👏', 'Actie',  'enkele_scan_euro',  5,    2),
  ('Grote Vangst',        '€20 of meer opgehaald met één bonnetje.',              '🎣', 'Actie',  'enkele_scan_euro',  20,   3),
  ('Vijftigpunter',       '€50 in totaal opgehaald.',                             '🥈', 'Volume', 'totaal_euro',       50,   4),
  ('Honderdklapper',      '€100 in totaal opgehaald.',                            '💯', 'Volume', 'totaal_euro',       100,  5),
  ('Tweehonderdklapper',  '€200 in totaal opgehaald.',                            '🏆', 'Volume', 'totaal_euro',       200,  6),
  ('Vijfhonderdheld',     '€500 in totaal opgehaald.',                            '👑', 'Volume', 'totaal_euro',       500,  7),
  ('Volhouder',           '10 bonnetjes gescand.',                                '🚴', 'Volume', 'aantal_scans',      10,   8),
  ('Serieuze Speler',     '25 bonnetjes gescand.',                                '⭐', 'Volume', 'aantal_scans',      25,   9),
  ('Week-Streak',         '2 weken op rij minstens 1 bonnetje gescand.',          '🔥', 'Streak', 'week_streak',       2,    10),
  ('Maand-Streak',        '4 weken op rij minstens 1 bonnetje gescand.',          '🔥', 'Streak', 'week_streak',       4,    11),
  ('IJzeren Streak',      '8 weken op rij minstens 1 bonnetje gescand.',          '⚡', 'Streak', 'week_streak',       8,    12);
