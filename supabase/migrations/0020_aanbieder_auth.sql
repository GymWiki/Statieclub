-- Statieclub — optioneel donateur-account ("aanbieder"-dashboard, Punt 6)
--
-- De bestaande, frictieloze anonieme donatieflow (`/donateren`,
-- `OphaalForm.tsx`, Stripe-webhook) blijft volledig ongewijzigd — dit
-- is een NIEUWE, additieve laag ernaast: wie dat wil, kan een account
-- aanmaken (Supabase Auth, e-mail + wachtwoord, zelfde patroon als
-- club-beheerders in migratie 0006) en krijgt daarmee een dashboard met
-- zijn/haar actieve ophaalacties en totaal gedoneerd bedrag.
--
-- `donateurs.email` is en blijft de enige natuurlijke sleutel tussen de
-- anonieme flow en een account: een donateur die zich later aanmeldt
-- met hetzelfde e-mailadres waarmee hij eerder (anoniem) doneerde,
-- koppelt zijn account aan die bestaande geschiedenis. Iemand die zich
-- aanmeldt VOORDAT hij ooit gedoneerd heeft, krijgt een lege
-- `donateurs`-rij (vandaar `naam`/`adres`/`postcode` los van hun
-- oorspronkelijke NOT NULL-constraint) — die vult zichzelf vanzelf op
-- zodra de eerstvolgende (evt. weer anonieme) donatie op hetzelfde
-- e-mailadres binnenkomt, want die flow doet toch al een upsert op
-- `email` (zie de Stripe-webhook en `POST /api/ophaalverzoeken`).

alter table donateurs alter column naam drop not null;
alter table donateurs alter column adres drop not null;
alter table donateurs alter column postcode drop not null;

alter table donateurs add column user_id uuid references auth.users (id) on delete set null;
alter table donateurs add constraint uq_donateurs_user unique (user_id);

comment on column donateurs.user_id is
  'Optionele koppeling naar een Supabase Auth-account (migratie 0020) — null betekent dat deze donateur nooit is ingelogd/nog volledig anoniem is. Gezet via de RPC koppel_donateur_account().';

-- ─────────────────────────────────────────────────────────────
-- koppel_donateur_account: koppelt (of maakt) de donateurs-rij van de
-- AANROEPENDE gebruiker, op basis van diens eigen, geverifieerde
-- auth.users-e-mailadres (nooit een los meegegeven parameter — dat zou
-- iemand anders' donatiegeschiedenis kunnen laten claimen). Security
-- definer nodig omdat donateurs geen insert/update-policy heeft voor
-- authenticated gebruikers (zelfde vertrouwensmodel als bonnetjes/
-- ophaalverzoeken: uitsluitend via de service-role of een expliciet
-- gecontroleerde RPC). Idempotent: bij elke login opnieuw aan te roepen.
-- ─────────────────────────────────────────────────────────────
create or replace function koppel_donateur_account()
returns donateurs
language plpgsql
security definer
set search_path = public
as $$
declare
  huidige_gebruiker uuid := auth.uid();
  huidige_email text;
  resultaat donateurs;
begin
  if huidige_gebruiker is null then
    raise exception 'Niet ingelogd.';
  end if;

  select email into huidige_email from auth.users where id = huidige_gebruiker;
  if huidige_email is null then
    raise exception 'Geen e-mailadres gevonden voor dit account.';
  end if;
  huidige_email := lower(trim(huidige_email));

  select * into resultaat from donateurs where email = huidige_email;

  if found then
    if resultaat.user_id is null then
      update donateurs set user_id = huidige_gebruiker where id = resultaat.id returning * into resultaat;
    end if;
  else
    insert into donateurs (email, user_id) values (huidige_email, huidige_gebruiker) returning * into resultaat;
  end if;

  return resultaat;
end;
$$;

grant execute on function koppel_donateur_account() to authenticated;
