-- Statieclub — Stripe Connect (Destination Charges) als betaalmotor
-- voor échte online donaties, ter vervanging van de Mollie SEPA-
-- incasso-architectuur uit migratie 0014.
--
-- BELANGRIJKE BEPERKING (bewust, na expliciete keuze): Stripe Connect
-- kan alleen een 5%-fee inhouden op geld dat daadwerkelijk ALS BETALING
-- door Stripe stroomt. Dat geldt voor de "Glas-naar-Kas"-donaties
-- (voorheen gesimuleerd, nu een echte Stripe Checkout-sessie met
-- `application_fee_amount`). Het geldt NIET voor fysiek opgehaald
-- statiegeld via een normale scan (`bron = 'scan'`) — dat geld gaat
-- nooit door het platform, dus daar is geen automatische inning
-- mogelijk. Voor die stroom valt de fee-inning terug op de bestaande,
-- ongewijzigde HANDMATIGE conceptfactuur-flow (migratie 0005,
-- `facturen`-tabel, `PlatformFactuur.tsx`) — niets gaat daarmee
-- verloren, alleen de automatische inning via SEPA-incasso vervalt.
--
-- ─────────────────────────────────────────────────────────────
-- 1. Mollie-architectuur (migratie 0014) volledig verwijderen
-- ─────────────────────────────────────────────────────────────
drop table if exists platform_incassos;
drop type if exists platform_incasso_status;

alter table clubs drop column if exists mollie_customer_id;
alter table clubs drop column if exists mollie_mandate_id;
alter table clubs drop column if exists openstaand_saldo_fee;

-- apply_bonnetje_insert/apply_bonnetje_status_change terug naar de
-- vorm van migratie 0008 — geen openstaand_saldo_fee-boekhouding meer
-- (die kolom bestaat niet meer; de fee komt voortaan real-time uit
-- Stripe's application_fee_amount, of loopt via de handmatige
-- facturen-flow, nooit via een trigger op deze tabellen).
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
-- 2. clubs: Stripe Connect-koppeling
-- ─────────────────────────────────────────────────────────────
alter table clubs add column stripe_account_id text;
alter table clubs add column onboarding_complete boolean not null default false;

comment on column clubs.stripe_account_id is
  'Stripe Express-account-id (acct_...) van deze club, aangemaakt via POST /api/stripe/create-connect-account.';
comment on column clubs.onboarding_complete is
  'True zodra Stripe via het account.updated-webhook-event bevestigt dat de club charges_enabled + payouts_enabled + details_submitted heeft — pas dan mag er een Checkout-sessie met deze club als bestemming worden aangemaakt.';

-- ─────────────────────────────────────────────────────────────
-- 3. ophaalverzoeken: koppeling naar de Stripe Checkout Session die
--    een 'glasbak'-donatie heeft betaald. De rij zelf wordt pas
--    aangemaakt ZODRA het `checkout.session.completed`-webhook-event
--    binnenkomt (niet vooraf, en niet client-side) — dus
--    `vooraf_betaald` is bij aanmaak altijd al true, net als vóór deze
--    migratie. Deze kolom dient puur voor idempotentie (een herhaalde
--    webhook-aanroep voor dezelfde sessie mag niet twee keer een rij
--    aanmaken) en voor de lookup vanaf de "bedankt"-pagina
--    (GET /api/stripe/checkout-session-status?session_id=...).
-- ─────────────────────────────────────────────────────────────
alter table ophaalverzoeken add column stripe_checkout_session_id text;
alter table ophaalverzoeken add constraint uq_ophaalverzoeken_stripe_session unique (stripe_checkout_session_id);
