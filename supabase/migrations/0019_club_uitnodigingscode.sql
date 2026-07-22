-- Statieclub — "Mijn clubs" lege staat: bestaande club selecteren via
-- een uitnodigingscode
--
-- Punt 3 vraagt een tweede actie naast "nieuwe club toevoegen": een
-- BESTAANDE club selecteren. Zonder gate zou dat iedereen toegang geven
-- tot het financiële dashboard van een willekeurige club (clubs zijn
-- publiek leesbaar, migratie 0002) — dus geen open self-join, maar een
-- korte, unieke code per club die een bestaande beheerder buiten de app
-- om deelt met een nieuwe (mede-)beheerder, zoals een team-invite-link.

alter table clubs add column uitnodigingscode text;

update clubs set uitnodigingscode = substr(md5(random()::text || id::text), 1, 8)
  where uitnodigingscode is null;

alter table clubs alter column uitnodigingscode set not null;
alter table clubs add constraint uq_clubs_uitnodigingscode unique (uitnodigingscode);

comment on column clubs.uitnodigingscode is
  'Korte, unieke code waarmee een ingelogde gebruiker zichzelf via de RPC voeg_beheerder_toe_via_code() als extra beheerder aan deze club toevoegt. Zichtbaar voor bestaande beheerders op /admin/[slug], te delen buiten de app om met een nieuwe mede-beheerder.';

-- ─────────────────────────────────────────────────────────────
-- maak_club_met_beheerder: genereert voortaan ook meteen een unieke
-- code voor de nieuwe club. Zelfde functie-signatuur als migratie
-- 0007, dus create or replace volstaat.
-- ─────────────────────────────────────────────────────────────
create or replace function maak_club_met_beheerder(
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
  nieuwe_code text;
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

  loop
    nieuwe_code := substr(md5(random()::text), 1, 8);
    exit when not exists (select 1 from clubs where uitnodigingscode = nieuwe_code);
  end loop;

  insert into clubs (naam, slug, postcode, regio, logo_url, uitnodigingscode)
  values (trim(p_naam), kandidaat_slug, p_postcode, p_regio, p_logo_url, nieuwe_code)
  returning * into nieuwe_club;

  insert into club_admins (club_id, user_id) values (nieuwe_club.id, huidige_gebruiker);

  return nieuwe_club;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- voeg_beheerder_toe_via_code: koppelt de aanroepende gebruiker als
-- extra beheerder aan de club die bij deze code hoort. Security
-- definer nodig omdat club_admins geen insert-policy heeft (migratie
-- 0002) — hetzelfde patroon als maak_club_met_beheerder hierboven, nu
-- voor een BESTAANDE club i.p.v. een nieuwe. `on conflict do nothing`
-- omdat een gebruiker die zijn eigen code nogmaals invoert (of al
-- beheerder is) geen foutmelding hoort te krijgen.
-- ─────────────────────────────────────────────────────────────
create or replace function voeg_beheerder_toe_via_code(p_code text)
returns clubs
language plpgsql
security definer
set search_path = public
as $$
declare
  gevonden_club clubs;
  huidige_gebruiker uuid := auth.uid();
begin
  if huidige_gebruiker is null then
    raise exception 'Niet ingelogd.';
  end if;

  select * into gevonden_club from clubs where uitnodigingscode = trim(p_code);
  if not found then
    raise exception 'Ongeldige uitnodigingscode.';
  end if;

  insert into club_admins (club_id, user_id)
  values (gevonden_club.id, huidige_gebruiker)
  on conflict (club_id, user_id) do nothing;

  return gevonden_club;
end;
$$;

grant execute on function voeg_beheerder_toe_via_code(text) to authenticated;
