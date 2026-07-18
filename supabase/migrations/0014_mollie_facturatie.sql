-- Statieclub — Mollie SEPA Automatische Incasso + maandelijkse
-- "rollover"-facturatie
--
-- Vervangt de handmatige "genereer conceptfactuur"-knop (migratie
-- 0005, `facturen`-tabel, `PlatformFactuur.tsx`) niet — die blijft
-- bestaan als losstaand, handmatig te gebruiken instrument. Dit is een
-- NIEUW, volledig geautomatiseerd spoor ernaast: de 5%-fee wordt
-- voortaan real-time opgebouwd op `clubs.openstaand_saldo_fee` (bij
-- élk goedgekeurd bonnetje, ongeacht bron — scan of Glas-naar-Kas) en
-- een maandelijkse cron-job incasseert dat bedrag via Mollie zodra het
-- de rollover-drempel van €2,50 haalt.
--
-- Bewust een NIEUWE tabel (`platform_incassos`) i.p.v. de bestaande
-- `facturen` te hergebruiken/wijzigen: andere status-vocabulaire
-- (pending/paid/failed i.p.v. concept/verzonden/betaald), andere vorm
-- (maand/jaar + één bedrag i.p.v. een periode + apart
-- goedgekeurd-bedrag/fee-bedrag) en een ander ontstaansmoment
-- (automatisch per maand i.p.v. handmatig op verzoek). Twee facturen-
-- achtige tabellen naast elkaar is niet ideaal, maar wijzigen van de
-- bestaande, al werkende `facturen`-tabel/-UI is een groter, apart te
-- beoordelen besluit dat hier niet stilzwijgend wordt genomen.

-- ─────────────────────────────────────────────────────────────
-- 1. clubs: Mollie-koppeling + real-time fee-opbouw
-- ─────────────────────────────────────────────────────────────
alter table clubs add column mollie_customer_id text;
alter table clubs add column mollie_mandate_id text;
alter table clubs add column openstaand_saldo_fee numeric(10, 2) not null default 0.00
  check (openstaand_saldo_fee >= 0);

comment on column clubs.mollie_mandate_id is
  'Aanwezig zodra de club een geldig SEPA-machtiging heeft via Mollie — bepaalt of automatische incasso mogelijk is.';
comment on column clubs.openstaand_saldo_fee is
  '5%-platformfee, real-time opgebouwd door apply_bonnetje_insert/apply_bonnetje_status_change bij elk goedgekeurd bonnetje. Wordt door de maandelijkse cron-job (/api/cron/monthly-billing) geïnd zodra dit >= 2,50 staat, en dan teruggezet naar 0.';

-- ─────────────────────────────────────────────────────────────
-- 2. platform_incassos — één rij per club per maand waarin de
--    rollover-drempel is gehaald en er dus daadwerkelijk geïncasseerd
--    is (géén rij bij een maand waarin het bedrag doorschuift).
-- ─────────────────────────────────────────────────────────────
create type platform_incasso_status as enum ('pending', 'paid', 'failed');

create table platform_incassos (
  id                  uuid primary key default gen_random_uuid(),
  club_id             uuid not null references clubs (id) on delete cascade,
  maand               smallint not null check (maand between 1 and 12),
  jaar                smallint not null check (jaar >= 2024),
  bedrag              numeric(10, 2) not null check (bedrag > 0),
  status              platform_incasso_status not null default 'pending',
  mollie_payment_id   text,
  aangemaakt_op       timestamptz not null default now(),
  bijgewerkt_op       timestamptz not null default now(),

  -- Voorkomt dat een dubbel draaiende/herstarte cron-run dezelfde
  -- club in dezelfde maand twee keer incasseert.
  unique (club_id, maand, jaar)
);

create index idx_platform_incassos_club on platform_incassos (club_id, jaar desc, maand desc);
create index idx_platform_incassos_status on platform_incassos (status);

create trigger trg_platform_incassos_updated_at before update on platform_incassos
  for each row execute function set_updated_at();

alter table platform_incassos enable row level security;
-- Zelfde vertrouwensmodel als `facturen`: geen publieke policies,
-- uitsluitend via de service-role — de cron-job (met CRON_SECRET) en
-- het admin-dashboard (ná een club_admins-check in de route/page).

-- ─────────────────────────────────────────────────────────────
-- 3. Real-time fee-opbouw: apply_bonnetje_insert en
--    apply_bonnetje_status_change (ongewijzigd sinds migratie 0008)
--    schrijven voortaan ook 5% van het bedrag bij op/af van
--    clubs.openstaand_saldo_fee — voor élk goedgekeurd bonnetje, dus
--    ook `bron = 'glas_naar_kas'` (die service valt bewust onder
--    dezelfde 5%-regel, geen uitzondering).
--
--    0.05 staat hier hard gecodeerd (moet in sync blijven met
--    PLATFORM_FEE_PERCENTAGE in lib/utils.ts) — een trigger kan geen
--    JS-constante lezen, dit is dezelfde aanpak als elders in het
--    schema waar een bedrijfsregel-constante niet gedeeld kan worden
--    tussen SQL en TypeScript.
-- ─────────────────────────────────────────────────────────────
create or replace function apply_bonnetje_insert()
returns trigger as $$
declare
  v_doel_id uuid;
  v_club_id uuid;
begin
  select doel_id into v_doel_id from ophaalverzoeken where id = new.ophaalverzoek_id;
  select club_id into v_club_id from teams where id = new.team_id;

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

    update clubs
      set openstaand_saldo_fee = openstaand_saldo_fee + round(new.bedrag_euro * 0.05, 2)
      where id = v_club_id;

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
  v_club_id uuid;
begin
  select doel_id into v_doel_id from ophaalverzoeken where id = new.ophaalverzoek_id;
  select club_id into v_club_id from teams where id = new.team_id;

  if old.status = 'goedgekeurd' and new.status = 'afgekeurd' then
    update teams
      set totaal_opgehaald_euro = totaal_opgehaald_euro - old.bedrag_euro,
          totaal_punten = totaal_punten - old.punten
      where id = old.team_id;

    if v_doel_id is not null then
      update doelen set opgehaald_bedrag = opgehaald_bedrag - old.bedrag_euro where id = v_doel_id;
    end if;

    update clubs
      set openstaand_saldo_fee = greatest(0, openstaand_saldo_fee - round(old.bedrag_euro * 0.05, 2))
      where id = v_club_id;

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

    update clubs
      set openstaand_saldo_fee = openstaand_saldo_fee + round(new.bedrag_euro * 0.05, 2)
      where id = v_club_id;

    perform credit_speler_voor_bonnetje(new.speler_id, new.bedrag_euro);

    update ophaalverzoeken
      set status = 'voltooid',
          voltooid_op = now()
      where id = new.ophaalverzoek_id;
  end if;

  return new;
end;
$$ language plpgsql;
