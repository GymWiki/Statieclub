-- Statieclub — anoniem chatsysteem tussen speler en donateur
--
-- Vervangt de WhatsApp-integratie bij het claimen: spelers en
-- donateurs wisselen nooit meer telefoonnummers uit. Berichten hangen
-- direct aan het ophaalverzoek — geen aparte chat-sessie-laag nodig,
-- want er is precies één gesprek per ophaalverzoek.

create type berichten_afzender_type as enum ('speler', 'donateur', 'systeem');

create table berichten (
  id                 uuid primary key default gen_random_uuid(),
  ophaalverzoek_id   uuid not null references ophaalverzoeken (id) on delete cascade,
  afzender_type      berichten_afzender_type not null,
  bericht_tekst      text not null check (char_length(bericht_tekst) between 1 and 500),
  aangemaakt_op      timestamptz not null default now()
);

create index idx_berichten_ophaalverzoek on berichten (ophaalverzoek_id, aangemaakt_op);

-- Geen publieke RLS-policies — zelfde vertrouwensmodel als donateurs/
-- ophaalverzoeken/bonnetjes: geen van beide gesprekspartners heeft een
-- account, dus er is geen auth.uid() om een rij-conditie op te
-- baseren. Een publieke policy (zelfs "using (true)") zou hier een
-- onbedoeld lek betekenen: zonder rij-conditie kan elke anon-key-
-- gebruiker gewoon de hele tabel leeglezen, niet enkel het ene
-- ophaalverzoek waarvan hij toevallig de (onraadbare) id kent. Lezen
-- en schrijven gaat daarom uitsluitend via route handlers met de
-- service-role (zie app/api/berichten), zowel voor de speler-kant
-- (binnen de app) als de donateur-kant (de "magic link"-statuspagina,
-- waar het ophaalverzoek-id zelf fungeert als het gedeelde geheim).
alter table berichten enable row level security;
