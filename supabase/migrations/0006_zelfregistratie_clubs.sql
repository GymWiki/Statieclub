-- Statieclub — zelf-registratie van clubs
--
-- Voorheen kon iemand pas bij een club-dashboard als een ontwikkelaar
-- handmatig een rij in club_admins toevoegde. Dat is nu zelfbediening:
-- wie een account aanmaakt, kan direct zelf een club aanmaken en wordt
-- daarmee automatisch beheerder van die club. Eén account kan zo
-- meerdere clubs beheren.
--
-- Het onderscheid "penningmeester" vs. "bestuurslid" voegde weinig toe
-- (wie dit regelt kan iedereen in een bestuur zijn) — dat rol-veld
-- vervalt daarom.

alter table club_admins drop column if exists rol;
drop type if exists club_rol;

-- ─────────────────────────────────────────────────────────────
-- maak_club_met_beheerder: maakt in één transactie een club aan én
-- koppelt de aanroepende gebruiker (auth.uid()) als beheerder. Als
-- security-definer-functie mag dit ondanks de strikte RLS op clubs/
-- club_admins — maar uitsluitend via déze twee gecontroleerde inserts,
-- er is geen bredere doorbraak van RLS.
-- ─────────────────────────────────────────────────────────────
create or replace function maak_club_met_beheerder(
  p_naam text,
  p_postcode text,
  p_regio text,
  p_actief_spaardoel text,
  p_doelbedrag numeric,
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

  insert into clubs (naam, slug, postcode, regio, actief_spaardoel, doelbedrag, logo_url)
  values (trim(p_naam), kandidaat_slug, p_postcode, p_regio, p_actief_spaardoel, p_doelbedrag, p_logo_url)
  returning * into nieuwe_club;

  insert into club_admins (club_id, user_id) values (nieuwe_club.id, huidige_gebruiker);

  return nieuwe_club;
end;
$$;

grant execute on function maak_club_met_beheerder(text, text, text, text, numeric, text) to authenticated;
