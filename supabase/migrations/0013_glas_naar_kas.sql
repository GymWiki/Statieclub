-- Statieclub — "Glas-naar-Kas" service
--
-- Premium upsell naast de bestaande statiegeld-ophaalflow: een
-- buurtbewoner betaalt vooraf een vaste donatie (gesimuleerde iDeal/
-- Tikkie-stap, geen echte betaalintegratie) om oud papier of zware
-- glasbak-flessen door een team te laten weggooien. Geen OCR-scan,
-- geen penningmeester-verificatie — het bedrag staat al vast en is al
-- betaald, dus een team hoeft alleen nog te bevestigen dat het glas is
-- weggegooid.

-- ─────────────────────────────────────────────────────────────
-- 1. ophaalverzoeken: type + betaalstatus
-- ─────────────────────────────────────────────────────────────
create type ophaalverzoek_type as enum ('statiegeld', 'glasbak');

alter table ophaalverzoeken add column type ophaalverzoek_type not null default 'statiegeld';
alter table ophaalverzoeken add column vooraf_betaald boolean not null default false;
alter table ophaalverzoeken add column donatie_bedrag numeric(10, 2);

alter table ophaalverzoeken add constraint chk_glasbak_vooraf_betaald check (
  (type = 'glasbak' and vooraf_betaald = true and donatie_bedrag is not null and donatie_bedrag > 0)
  or (type = 'statiegeld' and donatie_bedrag is null)
);

create index idx_ophaalverzoeken_type on ophaalverzoeken (type);

-- ─────────────────────────────────────────────────────────────
-- 2. teams: per-team aan/uit — een club kan de service voor jonge
--    jeugdteams uitlaten (zwaar tillen, scherven) en voor oudere
--    teams aanzetten. Standaard uit: een team moet expliciet worden
--    aangezet door een beheerder, nooit stilzwijgend actief.
-- ─────────────────────────────────────────────────────────────
alter table teams add column glas_service_actief boolean not null default false;

-- ─────────────────────────────────────────────────────────────
-- 3. bonnetjes: herkomst + optionele foto. Een "Glas-naar-Kas"-
--    voltooiing maakt gewoon een normale bonnetjes-rij aan (zodat de
--    bestaande credit-triggers, streaks en badges automatisch werken)
--    maar zonder foto en meteen als 'goedgekeurd' — er is niets te
--    verifiëren, het bedrag is al vooraf betaald.
-- ─────────────────────────────────────────────────────────────
create type bonnetje_bron as enum ('scan', 'glas_naar_kas');

alter table bonnetjes add column bron bonnetje_bron not null default 'scan';
alter table bonnetjes alter column foto_url drop not null;

alter table bonnetjes add constraint chk_foto_url_vereist_voor_scan check (
  bron = 'glas_naar_kas' or foto_url is not null
);

-- ─────────────────────────────────────────────────────────────
-- 4. Facturatie: "100% naar de clubkas" is een expliciete belofte in
--    de marketing (PricingPromise) — Glas-naar-Kas-donaties mogen dus
--    NOOIT meetellen in de 5%-platformfee-berekening. De
--    facturen-route en het admin-dashboard filteren zelf op
--    `bron <> 'glas_naar_kas'`; hier geen schemawijziging nodig, enkel
--    een reminder in de kolomnaam-conventie hierboven.
-- ─────────────────────────────────────────────────────────────
