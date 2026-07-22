-- Statieclub — bron='scan' bonnetjes via de Stripe-betaalverzoeken-pipeline
--
-- Vervangt de handmatige conceptfactuur (migratie 0005, `facturen`-
-- tabel, `PlatformFactuur.tsx`) en de WhatsApp/Tikkie-herinnering
-- (`CampagneAfronden.tsx`): fysiek statiegeld (bron 'scan') loopt
-- voortaan exact dezelfde weg als zelfgeregistreerd statiegeld
-- (migratie 0016, Virtuele Portemonnee). `rondActieAf()` (migratie
-- 0017) neemt bij het afronden van een actie goedgekeurde scan-
-- bonnetjes mee in de betaalverzoeken-aggregatie per speler, naast de
-- statiegeld_inleveringen. De speler betaalt zijn/haar aandeel via
-- Stripe (iDEAL), waarbij de 5%-platformfee automatisch wordt
-- ingehouden via `application_fee_amount` — geen handmatige
-- B2B-facturatie of informele afspraak meer nodig.
--
-- De `facturen`-tabel zelf blijft ongewijzigd bestaan (historische
-- conceptfacturen blijven leesbaar), er worden alleen geen nieuwe rijen
-- meer aangemaakt.
--
-- `betaalverzoek_id` is hier de "al meegenomen"-markering (mirror van
-- dezelfde kolom op statiegeld_inleveringen, migratie 0017): een
-- bonnetje zonder betaalverzoek_id is nog niet in een betaalverzoek
-- verwerkt en komt in aanmerking bij de eerstvolgende sluitende actie
-- van die club. Bonnetjes hebben geen eigen "processed_for_payment"-
-- tussenstatus nodig — hun bestaande status (goedgekeurd/afgekeurd)
-- blijft uitsluitend over de scan-verificatie gaan, los van betaling.
alter table bonnetjes add column betaalverzoek_id uuid references betaalverzoeken (id) on delete set null;

create index idx_bonnetjes_betaalverzoek on bonnetjes (betaalverzoek_id);
