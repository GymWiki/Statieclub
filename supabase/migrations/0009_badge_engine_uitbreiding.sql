-- Statieclub — badge-engine uitbreiding: buurt-badges, snelheids-badge
-- en verborgen "easter egg"-badges.
--
-- Twee nieuwe dimensies naast de bestaande volume/streak-badges:
-- 1. Hoeveel adressen heeft een speler zelf geclaimd én afgerond
--    (i.p.v. enkel team-breed bijgehouden) — vereist dat een claim
--    voortaan ook aan een speler gekoppeld wordt, niet alleen aan een
--    team.
-- 2. Hoe snel een speler een open verzoek claimt nadat het is
--    aangemaakt.
-- Daarnaast: badges kunnen nu `verborgen` zijn — de UI toont dan geen
-- naam/beschrijving/criteria totdat de speler hem daadwerkelijk
-- ontgrendelt ("easter eggs").

-- ─────────────────────────────────────────────────────────────
-- 1. ophaalverzoeken.geclaimd_door_speler_id — naast het bestaande
--    geclaimd_door_team_id (dat blijft de bron van waarheid voor de
--    team-toewijzing zelf; dit is puur extra voor persoonlijke
--    badge-telling).
-- ─────────────────────────────────────────────────────────────
alter table ophaalverzoeken
  add column geclaimd_door_speler_id uuid references spelers (id) on delete set null;

create index idx_ophaalverzoeken_geclaimd_speler on ophaalverzoeken (geclaimd_door_speler_id);

-- ─────────────────────────────────────────────────────────────
-- 2. badges.verborgen — "easter egg"-badges: de UI verstopt naam,
--    icoon en beschrijving zolang de badge nog niet ontgrendeld is.
-- ─────────────────────────────────────────────────────────────
alter table badges add column verborgen boolean not null default false;

-- ─────────────────────────────────────────────────────────────
-- 3. Hernoem twee bestaande badges zodat de namen aansluiten bij de
--    productbeslissing hieronder (zelfde criterium, alleen de naam
--    verandert — geen impact op al ontgrendelde badges).
-- ─────────────────────────────────────────────────────────────
update badges set naam = 'Gouden Munt' where naam = 'Vijftigpunter' and criteria_type = 'totaal_euro';
update badges set naam = 'Grote Klapper' where naam = 'Grote Vangst' and criteria_type = 'enkele_scan_euro';
update badges set naam = 'Halve Rug' where naam = 'Vijfhonderdheld' and criteria_type = 'totaal_euro';

-- ─────────────────────────────────────────────────────────────
-- 4. Nieuwe badges.
-- ─────────────────────────────────────────────────────────────
insert into badges (naam, beschrijving, icoon, categorie, criteria_type, criteria_waarde, volgorde, verborgen) values
  ('Tientje',                    '€10 in totaal opgehaald.',                                       '💰', 'Volume', 'totaal_euro',   10,   0,  false),
  ('Briefje van 50',             '€50 of meer opgehaald met één bonnetje.',                        '💵', 'Actie',  'enkele_scan_euro', 50, 13, false),
  ('De Buurtverkenner',          '1 adres geclaimd en afgerond.',                                  '🚴‍♂️', 'Actie', 'aantal_claims', 1,   14, false),
  ('Wijkagent',                  '5 adressen geclaimd en afgerond.',                               '👮', 'Actie',  'aantal_claims', 5,   15, false),
  ('Burgemeester van de Straat', '10 adressen geclaimd en afgerond.',                              '🎩', 'Actie',  'aantal_claims', 10,  16, false),
  -- criteria_waarde in minuten: geclaimd binnen dit aantal minuten na aanmaken.
  ('Snelle Service',             'Een verzoek geclaimd binnen 1 uur nadat het was aangemaakt.',    '⚡', 'Actie',  'snelle_claim',  60,  17, false),
  ('Precies Goed',               'Een bonnetje van exact €1,00 gescand.',                          '🎯', 'Actie',  'exact_bedrag',  1,   18, true),
  ('Lucky Number',               'Een bonnetje van exact €7,77 gescand.',                          '🍀', 'Actie',  'exact_bedrag',  7.77, 19, true);
