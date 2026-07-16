-- Statieclub — meerdere spaardoelen per club
--
-- Een club had tot nu toe precies één ingebakken doel (actief_spaardoel
-- + doelbedrag + opgehaald_bedrag als kolommen op `clubs`). Dat wordt
-- losgetrokken in een eigen `doelen`-tabel: een club kan er nul, één of
-- meerdere hebben (na elkaar of gelijktijdig), en het aanmaken van een
-- club vereist niet langer meteen een doel.

-- ─────────────────────────────────────────────────────────────
-- 1. doelen
-- ─────────────────────────────────────────────────────────────
create table doelen (
  id                 uuid primary key default gen_random_uuid(),
  club_id            uuid not null references clubs (id) on delete cascade,
  titel              text not null,
  doelbedrag         numeric(10, 2) not null check (doelbedrag >= 0),
  opgehaald_bedrag   numeric(10, 2) not null default 0 check (opgehaald_bedrag >= 0),
  is_actief          boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index idx_doelen_club on doelen (club_id);

create trigger trg_doelen_updated_at before update on doelen
  for each row execute function set_updated_at();

-- Bestaande clubs hadden precies 1 doel — dat migreert 1-op-1 naar een rij hier.
insert into doelen (club_id, titel, doelbedrag, opgehaald_bedrag, is_actief)
select id, actief_spaardoel, doelbedrag, opgehaald_bedrag, true
from clubs;

-- ─────────────────────────────────────────────────────────────
-- 2. ophaalverzoeken.doel_id — een donateur steunt voortaan een
--    specifiek doel van de club, niet enkel "de club" in het algemeen.
-- ─────────────────────────────────────────────────────────────
alter table ophaalverzoeken add column doel_id uuid references doelen (id) on delete set null;
create index idx_ophaalverzoeken_doel on ophaalverzoeken (doel_id);

-- Backfill: bij de migratie hierboven kreeg elke club precies 1 doel,
-- dus dit is op dit moment nog een eenduidige koppeling.
update ophaalverzoeken o
  set doel_id = d.id
  from doelen d
  where d.club_id = o.club_id;

-- ─────────────────────────────────────────────────────────────
-- 3. Bonnetje-triggers crediteren voortaan ook het gekoppelde doel
--    (naast het team, ongewijzigd). Geen doel gekoppeld? Dan telt het
--    bonnetje nog gewoon mee voor het team, alleen niet voor een doel.
-- ─────────────────────────────────────────────────────────────
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

    update ophaalverzoeken
      set status = 'voltooid',
          voltooid_op = now()
      where id = new.ophaalverzoek_id;
  end if;

  return new;
end;
$$ language plpgsql;

-- ─────────────────────────────────────────────────────────────
-- 4. clubs.opgehaald_bedrag bestond als afgeleide som van alle teams —
--    dat concept verhuist naar doelen (opgehaald per doel i.p.v. per
--    club), dus de oude sync-trigger en de kolommen zelf vervallen.
-- ─────────────────────────────────────────────────────────────
drop trigger if exists trg_teams_sync_club on teams;
drop function if exists sync_club_opgehaald_bedrag();

alter table clubs drop column if exists actief_spaardoel;
alter table clubs drop column if exists doelbedrag;
alter table clubs drop column if exists opgehaald_bedrag;

-- ─────────────────────────────────────────────────────────────
-- 5. maak_club_met_beheerder: club aanmaken vereist niet langer een
--    doel. Postgres staat geen wijziging van een parameterlijst toe
--    via create or replace, dus eerst de oude functie weg.
-- ─────────────────────────────────────────────────────────────
drop function if exists maak_club_met_beheerder(text, text, text, text, numeric, text);

create function maak_club_met_beheerder(
  p_naam text,
  p_postcode text,
  p_regio text,
  p_logo_url text default null
)
returns clubs
language plpgsql
security definer
set search_path = public
as $$
declare
  nieuwe_club clubs;
  basis_slug text;
  kandidaat_slug text;
  teller int := 1;
  huidige_gebruiker uuid := auth.uid();
begin
  if huidige_gebruiker is null then
    raise exception 'Niet ingelogd.';
  end if;
  if coalesce(trim(p_naam), '') = '' then
    raise exception 'Naam is verplicht.';
  end if;

  basis_slug := regexp_replace(lower(trim(p_naam)), '[^a-z0-9]+', '-', 'g');
  basis_slug := trim(both '-' from basis_slug);
  if basis_slug = '' then
    basis_slug := 'club';
  end if;

  kandidaat_slug := basis_slug;
  while exists (select 1 from clubs where slug = kandidaat_slug) loop
    teller := teller + 1;
    kandidaat_slug := basis_slug || '-' || teller;
  end loop;

  insert into clubs (naam, slug, postcode, regio, logo_url)
  values (trim(p_naam), kandidaat_slug, p_postcode, p_regio, p_logo_url)
  returning * into nieuwe_club;

  insert into club_admins (club_id, user_id) values (nieuwe_club.id, huidige_gebruiker);

  return nieuwe_club;
end;
$$;

grant execute on function maak_club_met_beheerder(text, text, text, text) to authenticated;

-- ─────────────────────────────────────────────────────────────
-- 6. RLS voor doelen: publiek leesbaar (donateurs kiezen een actief
--    doel), schrijven uitsluitend via de service-role in route
--    handlers na een club_admins-check — zelfde patroon als teams.
-- ─────────────────────────────────────────────────────────────
alter table doelen enable row level security;

create policy "doelen zijn publiek leesbaar"
  on doelen for select
  using (true);

-- Live voortgangsbalken (donor-pagina + penningmeester-dashboard)
-- luisteren via Supabase Realtime naar wijzigingen op doelen. Voeg de
-- tabel toe aan de realtime-publicatie als dat nog niet zo is (defensief,
-- want een tweede keer toevoegen geeft anders een foutmelding).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'doelen'
  ) then
    alter publication supabase_realtime add table doelen;
  end if;
end $$;
