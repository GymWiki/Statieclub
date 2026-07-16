-- Statieclub — demo/seed data voor lokale ontwikkeling
-- Voer uit met: supabase db reset  (draait migraties + dit bestand)

insert into clubs (id, naam, slug, logo_url, postcode, regio, actief_spaardoel, doelbedrag)
values
  ('11111111-1111-1111-1111-111111111111', 'SV De Meteoor', 'sv-de-meteoor', null, '7511 AB', 'Enschede', 'Nieuwe jeugddoeltjes', 2500.00),
  ('22222222-2222-2222-2222-222222222222', 'HC Groenoord', 'hc-groenoord', null, '7513 CD', 'Enschede', 'Materiaal voor de F-jes', 1500.00),
  ('33333333-3333-3333-3333-333333333333', 'VV Bataven', 'vv-bataven', null, '7521 EF', 'Enschede', 'Renovatie kantine', 4000.00);

insert into teams (id, club_id, team_naam)
values
  ('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'JO11-1'),
  ('a1111111-1111-1111-1111-111111111112', '11111111-1111-1111-1111-111111111111', 'JO13-2'),
  ('a1111111-1111-1111-1111-111111111113', '11111111-1111-1111-1111-111111111111', 'Heren 3'),
  ('a2222222-2222-2222-2222-222222222221', '22222222-2222-2222-2222-222222222222', 'Dames 1'),
  ('a2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'F-jes'),
  ('a3333333-3333-3333-3333-333333333331', '33333333-3333-3333-3333-333333333333', 'JO15-1');

insert into donateurs (id, naam, email, adres, postcode, telefoonnummer)
values
  ('d1111111-1111-1111-1111-111111111111', 'Fam. Jansen', 'jansen@example.com', 'Meteorstraat 12', '7511 AB', '0612345678'),
  ('d2222222-2222-2222-2222-222222222222', 'Fam. de Vries', 'devries@example.com', 'Groenoordlaan 4', '7513 CD', '0623456789'),
  ('d3333333-3333-3333-3333-333333333333', 'Fam. Bakker', 'bakker@example.com', 'Bataafseweg 88', '7521 EF', '0634567890'),
  ('d4444444-4444-4444-4444-444444444444', 'Fam. Smit', 'smit@example.com', 'Meteorstraat 40', '7511 AB', '0645678901');

insert into ophaalverzoeken (id, donateur_id, club_id, geclaimd_door_team_id, status, aantal_geschat, opmerking)
values
  ('e1111111-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', null, 'open', 25, 'Kratten staan bij de schuurdeur'),
  ('e1111111-1111-1111-1111-111111111112', 'd2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', null, 'open', 40, null),
  ('e1111111-1111-1111-1111-111111111113', 'd3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333331', 'geclaimd', 15, 'Graag na 17:00 langskomen');

-- Voorbeeld van een al verwerkt bonnetje (JO11-1, bedrag onder de
-- anomaly-drempel -> automatisch goedgekeurd, punten direct toegekend)
insert into ophaalverzoeken (id, donateur_id, club_id, geclaimd_door_team_id, status, aantal_geschat)
values
  ('e1111111-1111-1111-1111-111111111114', 'd1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'geclaimd', 30);

insert into bonnetjes (ophaalverzoek_id, team_id, foto_url, bedrag_euro, punten, status)
values
  ('e1111111-1111-1111-1111-111111111114', 'a1111111-1111-1111-1111-111111111111', 'https://placehold.co/400x600?text=Bonnetje', 7.50, 75, 'goedgekeurd');

-- Voorbeeld van een geflagd bonnetje (Heren 3, bedrag >= €30 ->
-- wacht op controle door de penningmeester, telt nog niet mee)
insert into ophaalverzoeken (id, donateur_id, club_id, geclaimd_door_team_id, status, aantal_geschat)
values
  ('e1111111-1111-1111-1111-111111111115', 'd4444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111113', 'geclaimd', 80);

insert into bonnetjes (ophaalverzoek_id, team_id, foto_url, bedrag_euro, punten, status, flag_reden)
values
  ('e1111111-1111-1111-1111-111111111115', 'a1111111-1111-1111-1111-111111111113', 'https://placehold.co/400x600?text=Bonnetje', 34.20, 342, 'in_afwachting_controle', 'Hoog bedrag (≥ €30,00)');
