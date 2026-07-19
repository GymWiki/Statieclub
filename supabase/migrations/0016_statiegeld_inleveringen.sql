-- Statieclub — Virtuele Portemonnee voor clubleden
--
-- Een clublid dat zelf flessen/blikjes inlevert bij de supermarkt kan
-- dat bedrag hier registreren i.p.v. het meteen (gratis) te laten
-- meetellen zoals bij "Scan Eigen Statiegeld" (migratie 0008,
-- `bonnetjes`-tabel met `bron = 'scan'`). Het verschil is fundamenteel:
-- bij "Scan Eigen Statiegeld" gaat het geld nog altijd fysiek naar de
-- club (het lid draagt het gewoon af), en is de bonnetjes-rij puur een
-- scoreregistratie. Hier houdt het lid het statiegeld zelf en betaalt
-- het bedrag ZELF terug aan de club via een échte Stripe-betaling —
-- maar pas zodra het opgespaarde saldo minimaal €20 is, om de vaste
-- iDEAL/Stripe-transactiekosten niet op elk klein bonnetje afzonderlijk
-- te laten drukken. Beide mechanismen bestaan dus naast elkaar, voor
-- verschillende situaties.
--
-- `user_id` uit de opdracht is hier `speler_id` geworden: deze app
-- heeft geen Supabase Auth voor clubleden/spelers (zie
-- lib/playerIdentity.ts — een frictieloze, client-gegenereerde
-- identiteit, bewust zonder inlogstap), dus de enige bestaande
-- "gebruiker"-identiteit voor een clublid is `spelers.id`.

create type statiegeld_inlevering_status as enum ('pending', 'paid');

create table statiegeld_inleveringen (
  id                          uuid primary key default gen_random_uuid(),
  speler_id                   uuid not null references spelers (id) on delete cascade,
  club_id                     uuid not null references clubs (id) on delete cascade,
  bedrag                      numeric(10, 2) not null check (bedrag > 0),
  status                      statiegeld_inlevering_status not null default 'pending',
  image_url                   text,
  -- Gezet zodra dit record is meegenomen in een afreken-poging (zie
  -- POST /api/stripe/create-checkout-session, scenario 'wallet_payout')
  -- — het webhook-event zet vervolgens exact déze rijen op 'paid',
  -- nooit rijen die ná het aanmaken van de sessie zijn toegevoegd.
  stripe_checkout_session_id  text,
  created_at                  timestamptz not null default now()
);

create index idx_statiegeld_inleveringen_speler on statiegeld_inleveringen (speler_id, status);
create index idx_statiegeld_inleveringen_session on statiegeld_inleveringen (stripe_checkout_session_id);

alter table statiegeld_inleveringen enable row level security;
-- Zelfde vertrouwensmodel als bonnetjes/donateurs/ophaalverzoeken:
-- geen publieke policies, uitsluitend via de service-role in
-- POST/GET /api/statiegeld-inleveringen en het Stripe-webhook.
