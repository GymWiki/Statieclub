-- Statieclub — Row Level Security
--
-- Ontwerpprincipe: schrijfacties op tabellen met persoonsgegevens
-- (donateurs, ophaalverzoeken, bonnetjes) lopen uitsluitend via de
-- Next.js route handlers (server-side, met de service-role key die
-- RLS omzeilt). De anon-key (browser) krijgt alleen leesrechten op
-- niet-privacygevoelige tabellen (clubs, teams) zodat het
-- leaderboard en de campagne-voortgang direct + realtime kunnen
-- worden gelezen. Alles wat een donateursnaam, adres of
-- telefoonnummer bevat, is dus nooit rechtstreeks vanuit de browser
-- opvraagbaar.

alter table clubs enable row level security;
alter table teams enable row level security;
alter table donateurs enable row level security;
alter table ophaalverzoeken enable row level security;
alter table bonnetjes enable row level security;
alter table club_admins enable row level security;
alter table team_members enable row level security;

-- clubs: publiek leesbaar (landingspagina, campagne-cards)
create policy "clubs zijn publiek leesbaar"
  on clubs for select
  using (true);

-- teams: publiek leesbaar (live leaderboard zonder login)
create policy "teams zijn publiek leesbaar"
  on teams for select
  using (true);

-- donateurs / ophaalverzoeken / bonnetjes: geen anon-policies.
-- Alleen de service_role (gebruikt in route handlers) kan hier
-- rechtstreeks bij, en die rol negeert RLS sowieso.

-- club_admins: een gebruiker mag zien in welke club(s) hij/zij
-- penningmeester of bestuurslid is (nodig om naar het juiste
-- admin-dashboard te routeren).
create policy "admins zien hun eigen koppelingen"
  on club_admins for select
  using (auth.uid() = user_id);

-- team_members: een gebruiker mag zien bij welk(e) team(s) hij/zij hoort.
create policy "leden zien hun eigen teamkoppeling"
  on team_members for select
  using (auth.uid() = user_id);

-- Publieke view op ophaalverzoeken t.b.v. het "Ophaal Prikbord":
-- toont géén naam, adres of telefoonnummer van de donateur — enkel
-- de gegevens die een team nodig heeft om een aanbod te kunnen
-- claimen. Het volledige adres wordt pas na claimen server-side
-- getoond (zie API-route), zodat privacygevoelige data niet
-- onnodig breed zichtbaar is.
-- security_invoker = false (standaard): de view draait met de rechten
-- van de eigenaar (postgres), zodat hij dwars door de strikte RLS op
-- ophaalverzoeken/donateurs heen mag lezen — maar dan wél alleen de
-- kolommen die hieronder expliciet zijn opgenomen.
create view ophaalverzoeken_prikbord
as
select
  o.id,
  o.club_id,
  o.status,
  o.geclaimd_door_team_id,
  o.aantal_geschat,
  left(d.postcode, 4) as postcode_cijfers,
  o.aangemaakt_op
from ophaalverzoeken o
join donateurs d on d.id = o.donateur_id
where o.status in ('open', 'geclaimd');

grant select on ophaalverzoeken_prikbord to anon, authenticated;
