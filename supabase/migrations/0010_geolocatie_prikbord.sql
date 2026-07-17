-- Statieclub — geolocatie voor het Ophaal Prikbord
--
-- Het prikbord krijgt een afstandsindicatie ("~800m hiervandaan") en
-- een kaartweergave met vage privacyzones. Daarvoor heeft een
-- donateur optioneel exacte coördinaten nodig. Nullable: bestaande en
-- nieuwe donateurs zonder coördinaten (bijv. geen locatietoestemming
-- gegeven) werken gewoon door — voor hun verzoek wordt dan simpelweg
-- geen afstand/kaart-cirkel getoond, enkel de postcode-cijfers.
--
-- Belangrijk: deze kolommen krijgen bewust GEEN publieke RLS-policy.
-- Ze worden uitsluitend server-side gelezen (route handlers met de
-- service-role) om een afstand te berekenen en een vervaagde
-- ("fuzzy") coördinaat af te leiden — de exacte waarden zelf bereiken
-- de browser nooit, ook niet ná een claim (dan wordt alleen het adres
-- vrijgegeven, nooit lat/lng).
alter table donateurs add column lat numeric(9, 6);
alter table donateurs add column lng numeric(9, 6);
