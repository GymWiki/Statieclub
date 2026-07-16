-- Statieclub — Anomaly Detection workflow + platform-facturatie (5%)

-- ─────────────────────────────────────────────────────────────
-- Bonnetjes: reden van vlaggen + nieuwe default
-- ─────────────────────────────────────────────────────────────
alter table bonnetjes add column flag_reden text;

-- Nieuwe bonnetjes komen voortaan altijd expliciet binnen met status
-- 'goedgekeurd' (automatisch, bedrag < drempel) of
-- 'in_afwachting_controle' (bedrag >= drempel of verdacht scanpatroon).
-- De default is bewust "fail-safe": zonder expliciete status wordt een
-- bonnetje nooit stilzwijgend goedgekeurd.
alter table bonnetjes alter column status set default 'in_afwachting_controle';

-- ─────────────────────────────────────────────────────────────
-- Bonnetje-insert: alleen bij automatische goedkeuring (bedrag onder
-- de anomaly-drempel) worden punten/euro's DIRECT bijgeschreven —
-- instant gratification. Bij 'in_afwachting_controle' wacht het team
-- op de penningmeester voordat het meetelt op het leaderboard.
--
-- BEFORE INSERT (i.p.v. AFTER) omdat we hier ook geverifieerd_op op de
-- nieuwe rij zelf willen zetten, wat alleen in een BEFORE-trigger kan.
-- ─────────────────────────────────────────────────────────────
create or replace function apply_bonnetje_insert()
returns trigger as $$
begin
  if new.status = 'goedgekeurd' then
    new.geverifieerd_op = now();

    update teams
      set totaal_opgehaald_euro = totaal_opgehaald_euro + new.bedrag_euro,
          totaal_punten = totaal_punten + new.punten
      where id = new.team_id;

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

drop trigger if exists trg_bonnetje_insert on bonnetjes;
create trigger trg_bonnetje_insert before insert on bonnetjes
  for each row execute function apply_bonnetje_insert();

-- ─────────────────────────────────────────────────────────────
-- Bonnetje-statuswijziging door de penningmeester:
-- - 'in_afwachting_controle' -> 'goedgekeurd' (evt. met overschreven
--   bedrag_euro/punten in dezelfde update): credit het team nu alsnog,
--   met de (mogelijk gecorrigeerde) NEW-waarden.
-- - 'goedgekeurd' -> 'afgekeurd': corrigeer de eerder bijgeschreven
--   punten/euro's weer terug.
-- ─────────────────────────────────────────────────────────────
create or replace function apply_bonnetje_status_change()
returns trigger as $$
begin
  if old.status = 'goedgekeurd' and new.status = 'afgekeurd' then
    update teams
      set totaal_opgehaald_euro = totaal_opgehaald_euro - old.bedrag_euro,
          totaal_punten = totaal_punten - old.punten
      where id = old.team_id;
  end if;

  if new.status = 'goedgekeurd' and old.status <> 'goedgekeurd' then
    new.geverifieerd_op = now();

    update teams
      set totaal_opgehaald_euro = totaal_opgehaald_euro + new.bedrag_euro,
          totaal_punten = totaal_punten + new.punten
      where id = new.team_id;

    update ophaalverzoeken
      set status = 'voltooid',
          voltooid_op = now()
      where id = new.ophaalverzoek_id;
  end if;

  return new;
end;
$$ language plpgsql;

-- (trigger trg_bonnetje_status_change bestaat al sinds migratie 0001
-- en blijft ongewijzigd gekoppeld aan deze functie)

-- ─────────────────────────────────────────────────────────────
-- Facturen — B2B platform-facturatie: 5% software-fee over uitsluitend
-- de bonnetjes die door de penningmeester zijn goedgekeurd. Elke
-- factuur legt een periode vast (vanaf het einde van de vorige factuur,
-- of vanaf het ontstaan van de club) zodat bedragen nooit dubbel
-- gefactureerd worden.
-- ─────────────────────────────────────────────────────────────
create type factuur_status as enum ('concept', 'verzonden', 'betaald');

create table facturen (
  id                          uuid primary key default gen_random_uuid(),
  club_id                     uuid not null references clubs (id) on delete cascade,
  periode_start               timestamptz not null,
  periode_eind                timestamptz not null,
  totaal_goedgekeurd_bedrag   numeric(10, 2) not null check (totaal_goedgekeurd_bedrag >= 0),
  platform_fee_percentage     numeric(5, 2) not null default 5.00,
  platform_fee_bedrag         numeric(10, 2) not null check (platform_fee_bedrag >= 0),
  status                      factuur_status not null default 'concept',
  aangemaakt_door             uuid references auth.users (id) on delete set null,
  aangemaakt_op               timestamptz not null default now(),

  constraint chk_periode check (periode_eind > periode_start)
);

create index idx_facturen_club on facturen (club_id, periode_eind desc);

alter table facturen enable row level security;
-- Geen anon/authenticated policies: net als donateurs/ophaalverzoeken/
-- bonnetjes is deze tabel uitsluitend via de service-role (in route
-- handlers, na controle op club_admins) te lezen en te schrijven.
