# Statieclub

Regionaal platform dat buurtbewoners (donateurs) die van hun statiegeld
af willen, koppelt aan lokale sportclubs. Teams binnen een club strijden
via een live, gegamificeerd leaderboard om de meeste flessen op te halen.

## Stack

- **Next.js 14 (App Router)** + **React 18** + **TypeScript**
- **Tailwind CSS** voor styling, **Framer Motion** voor animatie, **Lucide React** voor iconen
- **Supabase** (PostgreSQL + Auth + Realtime + Storage)

## De 3 rollen en hun routes

| Rol | Binnenkomst | Kernroutes |
|---|---|---|
| **Aanbieder** (buurtbewoner, geen account) | `/` (marketing) → `/donateren` (postcode) | `/clubs/[slug]` — thermometer + frictieloos ophaalformulier; na indienen een link naar `/status/[ophaalverzoekId]` (status + anonieme chat) |
| **Clublid** (lichte teamkeuze, geen account) | `/` (marketing) → `/speler` (kies club) → `/club/[slug]` (kies team + naam) | `/club/[slug]/leaderboard` (scorebord + MVP's + Klapper van de Week), `/club/[slug]/prikbord` (claim-flow), `/club/[slug]/rit/[id]/chat` (anonieme chat met de donateur), `/club/[slug]/upload` (OCR-scanner, adres-gebonden), `/club/[slug]/scan-eigen` (**Scan Eigen Statiegeld**, zonder adres — via de FAB), `/club/[slug]/profiel` (persoonlijke stats, streak, badges) |
| **Beheerder** (echt account, e-mail+wachtwoord) | `/` (marketing) → `/admin/login` → `/admin` | `/admin/[slug]` (dashboard), `/admin/[slug]/controle` (anomaly-verificatie), `/admin/[slug]/campagne-beheer` (teams + uitnodigingslinks) |

Bewuste keuzes t.o.v. een 1-op-1 "ideale" routenaamgeving: de donor-flow
heet `/donateren` + `/clubs/[slug]` i.p.v. `/zoek` + `/club/[clubId]` —
die laatste naam was al in gebruik voor de teamlid-sectie. Clubleden
loggen bewust niet in met een account (zie hieronder); "inloggen" voor
hen is de lichte teamkeuze + naam. `/speler` is een generieke
club-zoekpagina voor wie zonder clubspecifieke WhatsApp-uitnodiging
start (zie "Rolscheiding op de landingspagina" hieronder).

### Rolscheiding op de landingspagina

De marketing-site is een dynamisch, verhalend platform met een
**"Global Role State"**-architectuur i.p.v. een statische
informatiedump: `LandingPageContainer`
(`components/marketing/LandingPageContainer.tsx`) beheert één
`activeRole: RolKey` (`'bestuur' | 'lid' | 'donateur'`, gedefinieerd in
`lib/rollen.ts`) en geeft die als prop door aan alle rol-bewuste
secties, zodat de hele pagina in lockstap meewisselt zonder
overbodige informatie van de andere rollen te tonen:

- **`HeroSelector`** (nu een controlled component, `activeRole`/
  `onRoleChange` props i.p.v. eigen state): de rol-tabs bovenaan sturen
  de gedeelde state aan. De donateur-tab behoudt de signature
  postcode-zoeker met radar-ping; de andere twee linken door naar hun
  instapscherm.
- **`Features`** (`components/marketing/Features.tsx`, vervangt de oude
  statische `RoleSelector`): drie pitch-kaarten met exact op de rol
  toegespitste copy, plus een visueel mockup-blok dat de rol invult
  zonder er tekstueel over uit te weiden — een live
  campagne-dashboard met staafdiagram voor bestuur, een
  leaderboard+badges-mockup voor leden, en een vertrouwens-rij
  (chat/privacy/iDEAL) voor donateurs.
- **`HowItWorks`** en **`CallToAction`**: respectievelijk de 3-stappen-
  uitleg en de slot-CTA, allebei volledig herschreven per rol (andere
  stappen, andere iconen, andere CTA-tekst/link).
- Alle rolwissels animeren met Framer Motion (`AnimatePresence
  mode="wait"`, fade+slide) — geen abrupte content-sprong.
- De actieve rol wordt gespiegeld in de URL (`?rol=bestuur`) via
  `router.replace(..., { scroll: false })`, zodat een rol-specifieke
  landingspagina deelbaar/bookmarkbaar is. `app/page.tsx` wrapt de
  container daarom in een `<Suspense>` (vereist door
  `useSearchParams()` in de App Router).
- **Navbar** (`Nav.tsx`): de "Voor Besturen"-link scrollt niet langer
  naar een losse, statische sectie — hij roept `onKiesRol("bestuur")`
  aan (zet de gedeelde state) én scrollt naar `#features`, zodat de
  bezoeker meteen de bestuur-specifieke pitch ziet. De "Inloggen"-knop
  blijft een dropdown met twee opties — "Inloggen als Speler"
  (`/speler`) en "Inloggen als Penningmeester" (`/admin/login`).
- **Verwijderd**: de oude statische `RoleSelector.tsx` ("wie ben jij?"
  3-kaarten-grid) en `ClubPitch.tsx` (donkere bento-grid met
  `id="voor-besturen"`) zijn volledig vervangen door de rol-bewuste
  `Features`/`CallToAction` — beide mengden voorheen lid-content
  (leaderboard, badges) in een sectie die nominaal "voor besturen" was,
  wat lijnrecht tegen het nieuwe uitgangspunt "geen overbodige
  informatie van andere rollen" inging. De herbruikbare mockup-visuals
  (leaderboard, badges) zijn overgezet naar `Features` bij de rol
  waar ze inhoudelijk thuishoren (lid), niet bestuur.
- **`/speler`** (`app/speler/page.tsx`): een lichte lijst van actieve
  clubs die doorlinkt naar `/club/[slug]`. Teamleden komen normaal al
  via een clubspecifieke WhatsApp-uitnodiging (campagnebeheer) direct
  op de juiste plek terecht; deze pagina vangt het geval op van iemand
  die zonder zo'n link zelf zijn/haar club zoekt. Kiezen van een club
  leidt naar de bestaande `TeamKiezer` — dát is voor een speler
  "inloggen", niet een wachtwoord.

## Mappenstructuur

```
app/
  page.tsx                        Marketing-landingspagina — LandingPageContainer (rol-bewust: Nav/Hero/ActivityTicker/Features/ImpactStats/PricingPromise/HowItWorks/WhyBetter/CallToAction/Faq/Footer)
  donateren/page.tsx              Functionele donor-flow (postcode + live clubgrid, met ?postcode=)
  clubs/[slug]/page.tsx           Club-detail + ophaalformulier (donor)
  speler/page.tsx                 Generieke club-zoekpagina voor "Inloggen als Speler"
  status/[ophaalverzoekId]/       Donateur "magic link"-statuspagina + anonieme chat
  club/[slug]/layout.tsx          Mobiele shell voor teamleden (teamkeuze + bottom nav)
  club/[slug]/leaderboard/        Live scorebord + persoonlijke topscorers + Klapper van de Week
  club/[slug]/prikbord/           Ophaal Prikbord (lijst/kaart-toggle, privacy-veilige claim-flow)
  club/[slug]/rit/[id]/chat/      Speler-kant van de anonieme chat met de donateur
  club/[slug]/upload/             Hybride OCR Bonnetjes Scanner (ReceiptScanner), adres-gebonden
  club/[slug]/scan-eigen/         Scan Eigen Statiegeld — zelfde scanner, zonder geclaimd adres
  club/[slug]/profiel/            Persoonlijk profiel: impact-stats, streak-meter, badge-showcase
  admin/login/                    Login/registratie (e-mail + wachtwoord)
  admin/nieuwe-club/              Zelfregistratie: nieuwe club aanmaken
  admin/[slug]/layout.tsx         Gedeelde toegangscheck + tab-navigatie
  admin/[slug]/page.tsx           Dashboard (saldo, campagne afronden, platform-factuur)
  admin/[slug]/controle/          Anomaly-detection-verificatie (VerificatieLijst)
  admin/[slug]/campagne-beheer/   Teams aanmaken + deelbare WhatsApp-uitnodigingslink
  auth/callback/                  Supabase Auth e-mailbevestiging-callback (na registratie)
  api/                            Route handlers (schrijfacties, service-role)

components/
  marketing/                      Landingspagina-secties (LandingPageContainer, Nav, HeroSelector, ActivityTicker, Features, HowItWorks, CallToAction, WhyBetter, Faq, Footer)
  ui/                             Generieke UI-bouwstenen (Button, Card, ProgressBar, BottomSheet, ...)
  chat/                           ChatWindow — gedeeld door speler- en donateur-kant van de anonieme chat
  donor/                          Donor-dashboard componenten
  team/                           Club/team mobiele-view componenten (Prikbord, PrikbordLijst/Kaart, OphaalClaimSheet)
  admin/                          Clubbeheer-componenten (dashboard, controle, campagnebeheer)

lib/
  supabase/                       Browser-, server- en service-role Supabase clients
  adminAuth.ts                    Gedeelde "is deze gebruiker beheerder van deze club"-check
  types.ts                        TypeScript-types die 1-op-1 het DB-schema volgen
  utils.ts                        Formatting, puntenberekening, anomaly-detection-regels, WhatsApp-URL-builder, chatIsGesloten
  ocr.ts                          Client-side "OCR-engine" (gesimuleerd) + regex-extractie
  geo.ts                          Haversine-afstand, fuzzy-coördinaat, 2D-projectie (Ophaal Prikbord)
  impact.ts                       Euro → tastbaar object-vertaling (Profiel "Jouw impact")
  badges.ts                       Badge-engine: evaluateBadges(spelerId, scanBedrag)
  motion.ts                       Gedeelde Framer Motion fade-up variant (respecteert reduced-motion)
  donorProfile.ts / teamSelection.ts  Lichte lokale "wie ben ik"-opslag (localStorage, incl. spelersnaam)
  playerIdentity.ts               Persistente, client-gegenereerde speler-id (localStorage, geen login)

supabase/
  migrations/0001_init_schema.sql Tabellen, enums, triggers
  migrations/0002_rls_policies.sql Row Level Security + publieke prikbord-view
  migrations/0003_storage.sql     Storage-bucket voor bonnetje-foto's
  migrations/0004_bonnetje_status_enum.sql  Nieuwe status 'in_afwachting_controle'
  migrations/0005_anomaly_detection_en_facturatie.sql  flag_reden, herziene triggers, facturen-tabel
  migrations/0006_zelfregistratie_clubs.sql  RPC maak_club_met_beheerder (v1), rol-kolom weg
  migrations/0007_meerdere_doelen_per_club.sql  doelen-tabel, ophaalverzoeken.doel_id, RPC v2 zonder doel
  migrations/0008_gamification.sql  spelers, badges, speler_badges + streak-/badge-logica
  migrations/0009_badge_engine_uitbreiding.sql  buurt-/snelheids-/verborgen badges, geclaimd_door_speler_id
  migrations/0010_geolocatie_prikbord.sql  donateurs.lat/lng voor afstand + fuzzy kaartweergave
  migrations/0011_anoniem_chatsysteem.sql  berichten-tabel (speler ↔ donateur per ophaalverzoek)
  migrations/0012_doel_team_scoping.sql  doel_teams-tabel (doelen scopen naar specifieke teams)
  migrations/0013_glas_naar_kas.sql  "Glas-naar-Kas": ophaalverzoeken.type, teams.glas_service_actief, bonnetjes.bron
  seed.sql                        Demodata voor lokale ontwikkeling
```

## Database-architectuur

Volledig relationeel, geen geneste/array/JSON-lijstkolommen — elke
1-op-veel relatie is een eigen tabel met een foreign key:

| Tabel | Belangrijkste kolommen |
|---|---|
| `clubs` | naam, slug, postcode, regio |
| `doelen` | club_id, titel, doelbedrag, opgehaald_bedrag, is_actief |
| `doel_teams` | doel_id, team_id — welke teams een doel mogen steunen |
| `teams` | club_id, team_naam, totaal_punten, totaal_opgehaald_euro, glas_service_actief |
| `donateurs` | naam, email (uniek), adres, postcode, telefoonnummer |
| `ophaalverzoeken` | donateur_id, club_id, doel_id, geclaimd_door_team_id, status, type, vooraf_betaald, donatie_bedrag, aantal_geschat |
| `bonnetjes` | ophaalverzoek_id (optioneel), team_id, speler_id (optioneel), foto_url (optioneel), bedrag_euro, punten, status, bron, flag_reden |
| `spelers` | club_id, team_id, naam, avatar_emoji, totaal_opgehaald_euro, totaal_scans, current_week_streak, longest_streak |
| `badges` | naam, beschrijving, icoon, categorie (Volume/Streak/Actie), criteria_type, criteria_waarde |
| `speler_badges` | speler_id, badge_id, unlocked_at |
| `club_admins` | club_id, user_id (Supabase Auth) |
| `team_members` | team_id, user_id (Supabase Auth), naam |
| `facturen` | club_id, periode_start, periode_eind, totaal_goedgekeurd_bedrag, platform_fee_bedrag, status |

Een club heeft dus **0, 1 of meerdere `doelen`** (spaarcampagnes) —
zowel na elkaar als gelijktijdig. Het aanmaken van een club vraagt niet
meer om een doel; dat voeg je apart toe via
`/admin/[slug]/doelen`. Een donateur kiest bij het invullen van het
ophaalformulier welk actief doel van de club hij steunt
(`ophaalverzoeken.doel_id`).

**Doelen scopen naar specifieke teams** (migratie 0012, `doel_teams`):
bij het aanmaken of bewerken van een doel kan een beheerder kiezen
welke teams ervoor mogen meedoen (`DoelenBeheer.tsx`, teams-picker met
checkboxes). Geen team aangevinkt = open voor alle teams van de club —
exact het gedrag van elk doel van vóór deze migratie, die simpelweg
geen rijen in `doel_teams` heeft. Zijn er wél specifieke teams
gekoppeld, dan is die scoping overal doorgetrokken:
- **Prikbord** (`GET /api/ophaalverzoeken/nearby?team_id=...`): een
  team ziet alleen ophaalverzoeken van doelen die open zijn voor alle
  teams óf specifiek voor hun eigen team — zo kunnen twee acties naast
  elkaar lopen zonder dat de ene lijst de andere overlapt.
- **Claimen** (`POST /api/ophaalverzoeken/[id]/claim`): dezelfde check
  wordt server-side herhaald (403 bij een niet-toegelaten team), want
  de prikbord-filter is enkel UX en voorkomt geen rechtstreekse POST.
- **Scorebord** (`Leaderboard.tsx`): de "Waar we samen voor
  sparen"-kaart toont alleen doelen die voor het eigen team gelden.
- **Penningmeester-dashboard** (`SaldoOverzicht.tsx`): toont bij elk
  doel welke teams eraan gekoppeld zijn ("Alle teams" of de
  teamnamen), zodat parallelle acties er niet als één geheel uitzien.

Team-scoping wordt bewust client-side gefilterd op het scorebord (niet
server-side zoals het prikbord): welk team er lokaal gekozen is, is
enkel bij de browser bekend (geen login/cookies), dus `doel_teams`
wordt server-side gewoon volledig meegestuurd en pas in
`Leaderboard.tsx` toegepast op basis van `useTeam().gekozenTeam`.

**Triggers** houden de scores automatisch consistent:
- Bij het inleveren van een bonnetje bepaalt de anomaly-detection-check
  (zie hieronder) of het meteen `goedgekeurd` wordt — dan gaan de
  punten/euro's **direct** naar het team (instant gratification) en het
  ophaalverzoek naar `voltooid` — of dat het op `in_afwachting_controle`
  blijft staan totdat de penningmeester het beoordeelt.
- Wordt een bonnetje goedgekeurd, dan telt het bedrag zowel mee voor het
  team (`teams.totaal_opgehaald_euro`, ongewijzigd) als — via het
  `doel_id` van het bijbehorende ophaalverzoek — voor het specifieke
  doel dat die donateur koos (`doelen.opgehaald_bedrag`). Geen doel
  gekoppeld? Dan telt het gewoon alleen voor het team.
- Keurt de penningmeester een bonnetje later alsnog goed (of overschrijft
  het bedrag), dan worden de punten/euro's op dát moment bijgeschreven en
  gaat het ophaalverzoek naar `voltooid`.
- Keurt de penningmeester een bonnetje af nadat het al meetelde, dan
  wordt het bedrag automatisch weer van het team én het doel afgetrokken.

### Anomaly Detection & verificatie-workflow (Penningmeester Dashboard)

Bij elke upload (`POST /api/bonnetjes`) wordt het gesimuleerde OCR-bedrag
getoetst aan twee regels (`lib/utils.ts#beoordeelAnomalie`):

1. **Bedrag** ≥ €30,00 (`ANOMALIE_BEDRAG_DREMPEL_EURO`) → verdacht.
2. **Patroon**: dit zou de 5e-of-latere scan van hetzelfde team zijn
   binnen 10 minuten (`ANOMALIE_SCANS_DREMPEL` / `_VENSTER_MINUTEN`) → verdacht.

Is er geen van beide van toepassing, dan wordt het bonnetje direct
`goedgekeurd` en verschijnt de score meteen op het leaderboard. Anders
krijgt het `status = 'in_afwachting_controle'` plus een leesbare
`flag_reden`, en verschijnt het in de verificatielijst van het
penningmeester-dashboard (`components/admin/VerificatieLijst.tsx`) met
drie acties:
- **Goedkeuren** — bedrag klopt, punten alsnog toekennen.
- **Afkeuren** — telt nooit mee.
- **Bedrag overschrijven** — de penningmeester typt het juiste bedrag
  (op basis van de foto) in; dat gecorrigeerde bedrag wordt direct
  goedgekeurd en de punten herberekend.

### Het 5%-verdienmodel: platform-facturatie

`components/admin/PlatformFactuur.tsx` + `POST /api/clubs/[slug]/facturen`
berekenen een conceptfactuur van 5% (`PLATFORM_FEE_PERCENTAGE` in `lib/utils.ts`) over
uitsluitend de bonnetjes met status `goedgekeurd` sinds het einde van de
vorige factuurperiode (of sinds het ontstaan van de club, bij de eerste
factuur) — zo wordt nooit twee keer over hetzelfde bedrag gefactureerd.
Afgekeurde scans en bonnetjes die nog `in_afwachting_controle` staan
tellen dus nooit mee. De UI communiceert expliciet dat deze facturatie
uitsluitend is gebaseerd op de in-app goedgekeurde scans, **onafhankelijk**
van het moment waarop teamleden het bedrag fysiek naar de clubkas
overmaken (dat blijft de aparte, sociale "Campagne afronden"-stap
richting de teams via WhatsApp/Tikkie).

Een donateur blijft **1 record**: het ophaalformulier doet een `upsert`
op e-mailadres, dus bij een volgende actie (ook bij een andere club)
hoeft iemand niets opnieuw in te vullen. Prefill gebeurt via een lokaal
bewaard profiel in de browser (geen open "zoek op e-mailadres"-endpoint,
om het risico van het lekken van namen/adressen via e-mail-enumeratie
uit te sluiten).

### Stripe Connect: échte donatiebetalingen (`/admin/[slug]/facturatie`)

Statieclub gebruikt Stripe Connect (**destination charges**) als
betaalmotor voor online donaties — momenteel uitsluitend de
"Glas-naar-Kas"-donatie (zie verderop), het enige geldbedrag in deze
app dat daadwerkelijk als betaling door het platform stroomt. Dit
verving in migratie `0015_stripe_connect.sql` een eerdere, volledig
uitgewerkte Mollie SEPA-incasso-architectuur — zie de migratie zelf
voor de volledige onderbouwing van die knip.

> **Bewuste beperking.** Fysiek opgehaald statiegeld (`bron = 'scan'`)
> gaat nooit door het platform — daar valt dus nooit automatisch een
> fee op in te houden. Voor die stroom blijft de **handmatige**
> conceptfactuur (hierboven, `PlatformFactuur.tsx` /
> `POST /api/clubs/[slug]/facturen`) de manier om de 5%-fee te innen —
> die rekent gewoon over alle goedgekeurde bonnetjes, ongeacht bron, en
> is door deze migratie niet aangeraakt. Alleen de vroegere *automatische*
> SEPA-incasso op die stroom is vervallen.

- **Onboarding: Stripe Express-account.**
  `POST /api/stripe/create-connect-account` maakt (indien nog niet
  aanwezig) een Express-account aan voor de club
  (`clubs.stripe_account_id`) en retourneert een Account Link waarmee
  de penningmeester de Stripe-onboarding doorloopt (bedrijfsgegevens,
  bankrekening, identiteitsverificatie). `clubs.onboarding_complete`
  wordt hier bewust NIET gezet — dat gebeurt pas server-side zodra
  Stripe het zelf bevestigt.
- **`account.updated`-webhook = bron van waarheid voor onboarding-status.**
  `POST /api/stripe/webhook` zet `onboarding_complete` op true zodra
  een account tegelijk `details_submitted`, `charges_enabled` én
  `payouts_enabled` heeft. Zolang dat niet zo is, toont
  `/admin/[slug]/facturatie` de "nog niet gekoppeld"-waarschuwing en
  blijft de "Glas-naar-Kas"-optie verborgen op de donateurspagina
  (`app/clubs/[slug]/page.tsx`).
- **Stripe-webhooks zijn ondertekend en dus wél te vertrouwen** —
  anders dan bij Mollie's "onbetrouwbare ping" bevat de Stripe-payload
  de volledige event-data. Na verificatie via
  `stripe.webhooks.constructEventAsync(...)` met `STRIPE_WEBHOOK_SECRET`
  wordt de payload zelf gebruikt, geen aparte re-fetch nodig. Vereist
  de rauwe request-body (`request.text()`, niet `request.json()`) — de
  handtekening is berekend over de exacte bytes.
- **`POST /api/stripe/create-checkout-session`**: bouwt een Checkout
  Session met iDeal ingeschakeld en
  `payment_intent_data.transfer_data.destination` naar
  `clubs.stripe_account_id`, met `application_fee_amount` op 5% van het
  bedrag (`PLATFORM_FEE_PERCENTAGE` in `lib/utils.ts`) — een
  "destination charge": Stripe stort het restbedrag automatisch door
  naar de club, de fee blijft op de platformrekening. Maakt **bewust
  nog geen** `ophaalverzoeken`-rij aan — dat gebeurt pas in het
  webhook, ná bevestigde betaling, zodat een afgebroken/nooit-voltooide
  betaling nooit een rij oplevert die een team zou kunnen claimen.
- **`checkout.session.completed`** in de webhook maakt daarna alsnog de
  donateur (upsert op e-mail) en het `ophaalverzoeken`-record aan
  (`type: 'glasbak'`, `vooraf_betaald: true`) — identiek aan wat
  `POST /api/ophaalverzoeken` altijd al deed, nu alleen getriggerd door
  een echte betaling in plaats van een gesimuleerde stap. De rij wordt
  gekoppeld via `stripe_checkout_session_id` (uniek), wat zowel
  dubbele verwerking voorkomt (Stripe kan events opnieuw afleveren) als
  de lookup vanaf de "bedankt"-pagina mogelijk maakt.
- **`/donateren/bedankt`**: de `success_url` waar de donateur na
  betaling landt. Pollt kort `GET
  /api/stripe/checkout-session-status?session_id=...` totdat het
  webhook-event is verwerkt en het ophaalverzoek bestaat, en stuurt dan
  door naar de bestaande "magic link"-statuspagina
  (`/status/[ophaalverzoekId]`) — geen aparte bevestigingspagina nodig.
- **"Bekijk uitbetalingen in Stripe"** (`POST
  /api/stripe/create-dashboard-link`) genereert een kortlevende
  Express-dashboard-login-link on demand — die kan niet als vaste URL
  in de UI staan.
- **Nieuwe env-vars** (zie `.env.example`): `STRIPE_SECRET_KEY`,
  `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_SITE_URL` (voor Stripe's
  success-/cancel-/return-URL's).

### Kosten-geoptimaliseerde betalingen: price anchoring, fee-cover en de Virtuele Portemonnee

Vaste Stripe/iDEAL-transactiekosten wegen zwaar op kleine bedragen —
migratie `0016_statiegeld_inleveringen.sql` en een aantal gerichte
uitbreidingen op de Stripe-laag hierboven pakken dat langs twee
sporen aan.

**1. Glas-naar-Kas: hoger gemiddeld donatiebedrag.** `GlasNaarKasForm.tsx`
gebruikt price anchoring (`GLAS_NAAR_KAS_OPTIES` in `lib/utils.ts`:
€10/€15/€25, plus een "Ander bedrag"-veld met een minimum van
`GLAS_NAAR_KAS_MINIMUM_EURO` = €5) en een standaard-aangevinkte
"transactiekosten dekken"-checkbox. Bij `create-checkout-session`
(scenario `'donation'`) telt de server, ALLEEN als `coversFee: true`
is meegegeven, `TRANSACTIEKOSTEN_EURO` (€0,35) op bij het te betalen
`unit_amount` — de 5%-`application_fee_amount` blijft berekend over
het oorspronkelijke donatiebedrag, nooit over die surcharge. Alle
bedragen worden in centen (integers) opgeteld i.p.v. met floats, om
afrondingsverschillen tussen wat de donateur ziet en wat Stripe
uiteindelijk in rekening brengt te voorkomen.

**2. Virtuele Portemonnee: gebundelde afrekening voor clubleden**
(`/club/[slug]/portemonnee`). Een clublid dat zelf flessen inlevert
bij de supermarkt houdt het statiegeld zelf en betaalt het bedrag zelf
terug aan de club — maar pas in één keer zodra het gespaarde saldo de
`WALLET_PAYOUT_MINIMUM_EURO`-drempel (€20) haalt, i.p.v. per bonnetje
apart af te rekenen. Dit is een fundamenteel ander mechanisme dan
"Scan Eigen Statiegeld" (migratie 0008): daar gaat het geld nog
gewoon fysiek naar de club en is de bonnetjes-rij puur een
scoreregistratie; hier bestaat er geen fysieke overdracht en is een
échte Stripe-betaling nodig. Beide bestaan naast elkaar, voor
verschillende situaties.

- **`statiegeld_inleveringen`** (migratie 0016): `speler_id` i.p.v.
  het gevraagde `user_id` — deze app heeft geen Supabase Auth voor
  clubleden (zie `lib/playerIdentity.ts`), dus `spelers.id` is de
  enige bestaande "gebruiker"-identiteit. Zelfde vertrouwensmodel als
  `bonnetjes`: RLS aan, geen publieke policies, uitsluitend via
  `POST`/`GET /api/statiegeld-inleveringen` (service-role) en het
  Stripe-webhook.
- **`StatiegeldRegistreren.tsx`**: bedrag + optionele bonnetje-foto
  (hergebruikt de bestaande publieke `bonnetjes`-storage-bucket) →
  `POST /api/statiegeld-inleveringen`, status altijd `'pending'`.
- **`StatiegeldSaldo.tsx`**: telt alle `'pending'`-rijen van de speler
  op; de "Reken af via iDEAL"-knop is disabled zolang het saldo onder
  €20 zit ("Spaar door tot €20 om af te rekenen"), zowel client-side
  (UX) als server-side (afgedwongen in `create-checkout-session`).
- **`create-checkout-session`, scenario `'wallet_payout'`**: leidt
  `club_id` altijd af van de speler zelf (nooit blind vertrouwd
  vanuit de client), telt de `'pending'`-rijen in centen op, en
  **stempelt exact die rij-id's** met de nieuwe
  `stripe_checkout_session_id` vóórdat de checkout-URL wordt
  teruggegeven. Dat voorkomt een race condition: een bonnetje dat de
  gebruiker ná het starten van de afrekening toevoegt, mag nooit per
  ongeluk in diezelfde betaling worden meegenomen door de webhook.
- **Webhook**: `checkout.session.completed` dispatcht voortaan op
  `session.metadata.type`. Voor `'wallet_payout'`: `update
  statiegeld_inleveringen set status = 'paid' where
  stripe_checkout_session_id = session.id and status = 'pending'` —
  vanzelf idempotent, want een herhaalde aflevering van hetzelfde
  event vindt de tweede keer niets meer om bij te werken.
- De Portemonnee-pagina pollt kort na een geslaagde afrekening
  (`?betaling=gelukt`) omdat de webhook net als bij Glas-naar-Kas niet
  gegarandeerd vóór de browser-redirect is verwerkt.

### "Set and Forget" campagne-afrekening (migratie 0017)

Automatiseert de Virtuele Portemonnee hierboven verder: een actie
(`doelen` — dat is hier het "Acties"-concept uit de opdracht, zie de
migratie voor de onderbouwing waarom er geen aparte tabel is
bijgekomen) krijgt een optionele `end_date`. Zodra die datum passeert
sluit de actie zichzelf en genereert automatisch een `Betaalverzoek`
per speler met een opgespaard saldo — geen actie van de penningmeester
nodig, vandaar "set and forget".

- **`lib/actieAfronden.ts`** is de gedeelde aggregatie-logica, gebruikt
  door zowel de dagelijkse cron (`GET /api/cron/close-acties`,
  `CRON_SECRET`-beveiligd, zie `vercel.json`) als de handmatige
  override-knop (`POST /api/doelen/[id]/afronden`) in
  `DoelenBeheer.tsx` — beide paden lopen dus exact dezelfde code.
- **Aggregatie**: pakt alle `'pending'` `statiegeld_inleveringen` van
  de club die óf aan déze actie hangen, óf aan geen enkele actie hangen
  (`doel_id is null` — bijv. na een eerdere rollover), groepeert per
  speler. Boven `CAMPAGNE_AFREKENING_MINIMUM_EURO` (€1 — bewust veel
  lager dan de vrijwillige `WALLET_PAYOUT_MINIMUM_EURO` van €20, want
  dit is een eenmalig afsluitmoment, geen doorlopende spaarkeuze):
  maakt een `betaalverzoeken`-rij aan en zet de rijen op
  `'processed_for_payment'`. Eronder: `doel_id` wordt losgekoppeld
  (rollover) maar de rij blijft `'pending'`, en schuift zo automatisch
  door naar de eerstvolgende actie die sluit.
- **`statiegeld_inleveringen.betaalverzoek_id`** is een directe
  koppeling (niet enkel op status matchen) — een speler kan tegelijk
  een ouder, nog niet betaald betaalverzoek hebben terwijl een nieuwe
  actie sluit; zonder deze koppeling zou het webhook niet kunnen zien
  welke rijen bij wélk betaalverzoek horen.
- **`GET /api/checkout/[betaalverzoek_id]`**: on-the-fly Checkout
  Session, bedoeld om rechtstreeks aangeklikt te worden (banner of
  WhatsApp-link) — vandaar een `GET` die meteen naar Stripe
  doorstuurt i.p.v. JSON terug te geven. Zelfde destination-charge-opzet
  als de rest: geen `on_behalf_of`, dus Stripe's eigen vaste
  verwerkingskosten vallen automatisch ten laste van de club, niet van
  Statieclub — alleen de 5%-`application_fee_amount` (over het volledige
  betaalverzoek-bedrag) gaat naar het platform.
- **`BetaalverzoekBanner.tsx`** zit in `ClubShell.tsx` (dus zichtbaar op
  élk scherm binnen de club-shell, niet pas op een aparte pagina) en
  pollt periodiek `GET /api/betaalverzoeken?speler_id=...&status=open`
  — verdwijnt vanzelf zodra het webhook de status op `'betaald'` zet.
- **Admin** (`DoelenBeheer.tsx`): een `end_date`-veld bij het aanmaken
  van een doel, de "Actie nu afronden & Verzoeken genereren"-knop
  (alleen op actieve doelen), en per gesloten doel een lazy-geladen
  lijst van gegenereerde betaalverzoeken met een "Deel via
  WhatsApp"-knop (hergebruikt `bouwWhatsappUrl` — spelers hebben geen
  telefoonnummer in het schema, dus dit valt altijd terug op de
  algemene share-sheet zonder vaste ontvanger, net als de bestaande
  team-uitnodigingsflow).

## Marketing-landingspagina (`app/page.tsx`)

Losgekoppeld van de functionele donor-flow: `/` is een puur marketing-
gerichte, hoog-converterende landingspagina; de echte postcode-zoeker
met live Supabase-data staat op `/donateren` (de Hero-CTA linkt daar
met `?postcode=` naartoe, al ingevuld).

**Ontwerptokens:** Ink `slate-900` · Canvas `slate-50` · Mint
`emerald-500/600` (donateur-accent) · Ocean `blue-600/700`
(bestuurders-accent — een tweede kleur om de twee doelgroepen visueel
te scheiden) · Cloud `slate-200`. Type: **Plus Jakarta Sans** (display,
alleen grote headlines) + **Inter** (body/UI), geladen via
`next/font/google` in `app/layout.tsx`.

**Signature-element:** de postcode-zoekbalk in de Hero krijgt een
zachte "radar-ping"-animatie zodra je typt — een letterlijke
visualisatie van "we zoeken lokale clubs bij jou in de buurt", het ene
gedurfde bewegingsmoment op de pagina. De 3-stappen-sectie gebruikt
bewust wél genummerde stappen (in tegenstelling tot de generieke
01/02/03-cliché) omdat het hier om een echte chronologische flow gaat,
verbonden met een dunne gestippelde "route"-lijn.

Alle scroll-reveals (`whileInView` in Framer Motion) en de CSS-
animaties (`animate-mesh-drift`, `animate-radar-ping`) respecteren
`prefers-reduced-motion` via `lib/motion.ts#useFadeUpVariants` resp.
Tailwind's `motion-safe:`-variant.

**`HeroSelector` (bovenaan, vervangt het oude statische `Hero`):** drie
rol-tabs ("Voor Donateurs" / "Voor Clubleden" / "Voor Besturen") boven
de koptekst — koptekst, subtekst en primaire CTA wisselen per rol via
een `AnimatePresence`-fade, met een gedeelde `layoutId`-tab-indicator
die soepel meeschuift. Alleen de donateur-tab toont de postcode-
zoekbalk (met de radar-ping hierboven); de andere twee tabs linken
direct door naar hun eigen instapscherm. Sinds de "Global Role State"-
architectuur (zie "Rolscheiding op de landingspagina" hierboven) is dit
geen losstaande component meer met eigen state — de actieve rol komt
als prop binnen vanuit `LandingPageContainer` en stuurt bij een
tabklik diezelfde gedeelde state aan, zodat `Features`, `HowItWorks` en
`CallToAction` verderop op de pagina meteen meewisselen.

### Showcase- en proof-secties (conversie/geloofwaardigheid)

Naast Hero/Features/HowItWorks/CallToAction bevat de landingspagina een
paar rol-neutrale secties die puur bedoeld zijn om vertrouwen te wekken
vóórdat iemand een account aanmaakt of zijn adres deelt — alle inhoud
hieronder is **dummy-data**, niet uit Supabase opgehaald:

- **`ActivityTicker`** (`components/marketing/ActivityTicker.tsx`,
  direct onder de Hero): een horizontaal scrollend "live activiteit"-
  tikkertje. Naadloze loop via de klassieke dubbele-content-truc (de
  items staan twee keer achter elkaar, Framer Motion verschuift precies
  50% naar links in een oneindige lineaire loop) i.p.v. een vaste
  pixelwaarde — dat blijft correct ongeacht hoeveel tekst er in de
  items staat. Respecteert `prefers-reduced-motion` (animatie helemaal
  uit i.p.v. vertraagd, want een oneindige loop kán niet "verkort"
  worden).
- **`Faq`** (`components/marketing/Faq.tsx`, vlak boven de `Footer`):
  een accordion met veelgestelde vragen van zowel donateurs
  (thuisblijven, AVG) als besturen (kosten, betrouwbaarheid). Zelfgebouwd
  met `AnimatePresence` + een `height: "auto"`-animatie, hetzelfde
  patroon als het mobiele hamburgermenu in `Nav.tsx`.
- **`ImpactStats`** (`components/marketing/ImpactStats.tsx`, "De harde
  cijfers", direct onder `Features`): een `bg-slate-900`-sectie die
  bewust breekt met de rest van de lichte pagina — drie statistieken
  over hoeveel statiegeld er jaarlijks ongeclaimd blijft, die van 0
  optellen naar hun eindwaarde zodra de sectie in beeld scrolt. De
  telanimatie is een gedeelde `useCountUp`-hook (`lib/motion.ts`,
  dezelfde ease-out-curve als `AnimatedNumber.tsx`, maar getriggerd door
  Framer Motions `useInView` i.p.v. een waardewijziging) — bewust geen
  extra dependency (`react-countup`) toegevoegd, want Framer Motion zat
  er al in. Eén `useInView` op sectieniveau stuurt zowel de fade-in als
  alle drie de tellers tegelijk aan, zodat ze gelijktijdig lopen i.p.v.
  willekeurig verspringen per kaart. Bij `prefers-reduced-motion`
  springt elk getal direct naar de eindwaarde. De brontekst onderaan
  ("Statiegeld Nederland" + ILT) is een subtiele, niet-opdringerige
  footnote-stijl (`text-slate-400/70`).
- **`PricingPromise`** (`components/marketing/PricingPromise.tsx`, "Een
  eerlijk verdienmodel", direct onder `ImpactStats`): een lichte,
  glasachtige kaart (`bg-white/70 backdrop-blur-xl`, zelfde recept als de
  `Features`-kaarten) die welbewust weer terugkeert naar de lichte
  pagina na de donkere `ImpactStats`-sectie ervoor. Bewust **geen taart-/
  donutgrafiek** voor de 95/5-verdeling — twee segmenten lezen daar zwak
  in, en de 5% is inhoudelijk ook geen gelijkwaardige tweede categorie
  maar "de rest van de pot". In plaats daarvan een "meter": één
  percentage (`useCountUp(95, ...)`, gedeeld met `ImpactStats`) met de
  bestaande `ProgressBar`-component als vulling, en de 95%/5%-uitleg als
  twee tekstblokken eronder (het 95%-blok uitgelicht met een
  `bg-brand-50`-kaart, het 5%-blok bewust soberder) — zo blijft de
  waarde van beide altijd als tekst leesbaar, ook zonder op kleur te
  hoeven vertrouwen.
- **`WhyBetter`** (`components/marketing/WhyBetter.tsx`, "Meer
  opbrengst. Minder moeite. 100% Groen.", rol-neutraal geplaatst tussen
  `HowItWorks` en `CallToAction`): het directe vergelijkingsargument
  t.o.v. traditionele fondsenwerving (loten, koeken verkopen) — vier
  glasachtige kaarten in een 2×2-grid (`bg-white/70 backdrop-blur-xl`,
  gestapeld op mobiel), elk met een eigen icoon-kleur (amber/blauw/
  brand-groen/violet) zodat de vier kaarten ook zonder te lezen als
  losse argumenten ogen. Gestaggerde in-fade via `staggerDelay`
  (`lib/motion.ts`) — de eerste échte toepassing van die helper, die
  eerder alleen gedefinieerd stond. Sectie-achtergrond bewust
  `bg-slate-50` (niet `bg-white`, zoals `HowItWorks`/`Faq`) zodat er nog
  een lichte scheiding zichtbaar blijft tussen deze sectie en de
  `Faq` erna, ook al zijn beide "licht".
- **`Footer`** (`components/marketing/Footer.tsx`, `bg-slate-900`,
  zelfde donkere toon als `CallToAction`/`ImpactStats`): 4 kolommen
  (1 op mobiel, 2 op tablet, 4 op desktop) — pitch + copyright,
  product-links (`#hoe-het-werkt`, `/donateren` voor de Glas-naar-Kas-
  service, `#prijzen` — dat laatste een nieuw anker op `PricingPromise`),
  juridische links en bedrijfsgegevens (handelsnaam, KVK/BTW-nummer,
  contact-e-mail). De juridische links (Algemene Voorwaarden/
  Privacybeleid/Cookiebeleid) zijn bewust nog `#`-placeholders — er
  bestaat nog geen echte, juridisch gecontroleerde inhoud voor die
  pagina's. Een footer met deze links alléén maakt het platform dus
  nog niet AVG/GDPR-compliant; dat vraagt om daadwerkelijk beleid
  achter deze links, idealiter met juridische review.

**Bekende afweging:** de Hero-CTA navigeert client-side naar
`/donateren`, een Server Component die live clubs uit Supabase
opvraagt. Zonder een correct geconfigureerde `NEXT_PUBLIC_SUPABASE_URL`
(of bij een trage/onbereikbare database) kan die request enkele
seconden duren. Om de knop niet "dood" te laten aanvoelen, toont de
knop direct een spinner (`zoekend`-state in `Hero.tsx`) en toont
`app/donateren/loading.tsx` meteen een skeleton zodra de navigatie
start — zo is er altijd instant feedback, ongeacht hoe lang de
data-fetch duurt.

### Beveiliging (RLS)

- `clubs`, `teams`, `doelen`, `spelers`, `badges` en `speler_badges` zijn
  publiek leesbaar (landingspagina, live leaderboard, badge-showcase —
  allemaal zonder login). Schrijven op `spelers`/`speler_badges` gaat
  ook hier uitsluitend via route handlers met de service-role key.
- `donateurs`, `ophaalverzoeken`, `bonnetjes` en `berichten` hebben
  **geen** publieke policies: alleen route handlers met de
  **service-role key** mogen hier direct bij. De browser komt hier
  nooit rechtstreeks aan. Voor `berichten` is dat een bewuste keuze
  (geen "using (true)"-policy): zonder `auth.uid()` om een rij-conditie
  op te hangen zou een publieke policy de hele chat-tabel voor iedereen
  leesbaar maken, niet enkel het ene gesprek waarvan je de link kent.
- Het **Ophaal Prikbord** haalt zijn data op via `GET
  /api/ophaalverzoeken/nearby` (zie "Privacy-veilig prikbord" hieronder),
  dat bewust alleen niet-privacygevoelige velden teruggeeft (afstand,
  postcode-cijfers, geschat aantal, een vervaagde kaart-coördinaat).
  Het volledige adres — en de echte coördinaat — wordt pas server-side
  vrijgegeven zodra een team het verzoek claimt. De oudere publieke view
  `ophaalverzoeken_prikbord` (migratie 0002) bestaat nog in het schema
  maar wordt door de huidige UI niet meer bevraagd.
- Alleen de **penningmeester-verificatie** (bonnetje goed-/afkeuren,
  echt geld bevestigen) vereist een ingelogde gebruiker die via
  `club_admins` aan die club gekoppeld is (Supabase Auth, e-mail + wachtwoord).
- Het **claimen** van adressen en **uploaden** van bonnetjes door
  teamleden is bewust laagdrempelig gehouden (geen login) — dit past
  bij de doelgroep (jeugdleden op de fiets) en de vertrouwensgrens ligt
  hier op "lid van de club", niet op individuele authenticatie. Voor
  een productie-uitrol is het aan te raden hier alsnog `team_members` +
  Supabase Auth voor te gebruiken.

## Hybride OCR Bonnetjes Scanner (`ReceiptScanner`)

`components/team/ReceiptScanner.tsx` is de primaire manier waarop
teamleden een bonnetje inleveren, gebouwd als expliciete state-machine:

```
capture → verwerken → verifiëren → opslaan → gelukt
```

1. **Capture** — camera/galerij openen (`<input type="file" accept="image/*" capture="environment" />`), foto direct als preview.
2. **Verwerken** — de foto wordt **client-side** "gescand" (`lib/ocr.ts#scanBonnetje`, geen netwerkverkeer, dus €0 aan API-kosten per scan) terwijl een spinner "Bonnetje analyseren…" toont. Regex `(?:EUR|€)?\s*(\d+[,.]\d{2})` haalt bedragen uit de (gesimuleerde) herkende tekst; bij meerdere treffers wint een regel met "totaal"/"statiegeld", anders het hoogste bedrag.
3. **Verifiëren — de kernstap** — het gevonden bedrag wordt groot getoond naast de foto, en moet altijd expliciet worden bevestigd:
   - **"Ja, klopt!"** → direct opslaan.
   - **"Pas aan"** → bedrag wordt een actief invoerveld (foto blijft staan) totdat "Punten claimen" wordt bevestigd.
   - **"Opnieuw scannen"** → reset volledig terug naar capture.
   - Vindt de (gesimuleerde) OCR **niets** (~1 op de 8 scans, ter illustratie van een te wazige foto), dan opent het invoerveld automatisch — de foto blijft bewaard, alleen het bedrag moet handmatig in.
4. **Opslaan** — de foto gaat naar de Supabase Storage-bucket `bonnetjes`; pas ná bevestiging post de client het **door de gebruiker geverifieerde** bedrag naar `POST /api/bonnetjes`. Bij succes: confetti + direct oplopende score (of, als de anomaly detection alsnog toeslaat, een "wordt gecontroleerd"-melding).

**Waarom gesimuleerd i.p.v. een echte Tesseract.js-integratie?** Echte
on-device OCR vereist het downloaden van een taalmodel van meerdere
MB's per gebruiker plus een web worker — dat past niet bij "kosten op
nul en altijd snel beschikbaar" in een demo-omgeving, en zou hier ook
niet zinvol te testen zijn zonder echte gefotografeerde bonnetjes. De
"OCR-engine" in `lib/ocr.ts` is bewust achter een stabiele
`scanBonnetje(bestand)`-functie verstopt: om over te stappen op echte
herkenning hoeft alleen de tekst-generatie vervangen te worden door
bijvoorbeeld `(await createWorker('nld').recognize(bestand)).data.text`
— de regex-extractielogica (`kiesBesteBedrag`) blijft ongewijzigd
werken.

De server (`POST /api/bonnetjes`) vertrouwt het door de gebruiker
bevestigde bedrag, maar blijft wél zelf de autoriteit over de anomaly
detection (bedragdrempel + scanpatroon) — een cliënt kan dus nooit de
verificatieplicht van het bestuur omzeilen door zelf een status mee te
sturen.

## Privacy-veilig Ophaal Prikbord (`Prikbord.tsx`)

Het uitgangspunt: de exacte locatie (en het adres) van een donateur mag
de browser nooit bereiken vóórdat een speler op "Claim deze rit" heeft
gedrukt. Dat is nu letterlijk in de architectuur ingebakken, niet enkel
een UI-conventie:

- **`GET /api/ophaalverzoeken/nearby`** (`lib/geo.ts` + de route zelf)
  is de "getNearbyRequests"-functie: leest `ophaalverzoeken` +
  `donateurs.lat/lng` server-side met de service-role (donateurs heeft
  geen publieke leesrechten) en bouwt daaruit per verzoek een gesaneerd
  object met enkel `afstand_meters` (echte Haversine-afstand tot de
  speler), `postcode_cijfers` en een `fuzzy_locatie` — een met
  `vervaagCoordinaat` willekeurig (maar per verzoek-id consistent)
  150-300m verschoven punt. `donateurs.naam`, `.adres`,
  `.telefoonnummer` en de échte `.lat`/`.lng` worden hier nooit in
  meegegeven; dat gebeurt pas in `POST
  /api/ophaalverzoeken/[id]/claim` ná een geslaagde claim (bestond al
  vóór deze uitbreiding).
- **Lijst/kaart-toggle** (`Prikbord.tsx`): de lijst
  (`PrikbordLijst.tsx`) toont per kaart alleen afstand, postcode-cijfers
  en het geschatte aantal — nooit een straatnaam. De kaart
  (`PrikbordKaart.tsx`) is een zelfgebouwde **mock-kaart** (geen
  `react-leaflet`/externe tile-server-dependency nodig voor deze
  illustratie): transparante, gekleurde zone-cirkels op basis van de
  vervaagde coördinaat, geprojecteerd op een 2D-vlak t.o.v. de
  speler-positie (`lib/geo.ts#naarMeterOffset`) — bewust géén exacte
  pin-markers.
- **Speler-geolocatie**: `navigator.geolocation.getCurrentPosition`,
  non-blocking en optioneel. Zonder toestemming werkt het prikbord
  gewoon door — de lijst toont dan "Afstand onbekend" i.p.v. een
  afstand, en de kaart centreert op het zwaartepunt van de zones i.p.v.
  op de speler.
- **Claim-flow als Bottom Sheet** (`components/ui/BottomSheet.tsx` +
  `components/team/OphaalClaimSheet.tsx`): klikken op een lijst-item of
  kaart-cirkel opent een sheet met exact de geanonimiseerde gegevens +
  een "Claim deze rit"-knop. Pas de response van die claim (dezelfde
  `POST /api/ophaalverzoeken/[id]/claim` als voorheen) onthult het
  adres, de opmerking van de donateur ("Kijk uit voor de hond") en de
  WhatsApp-knop — in dezelfde sheet, zonder scherm-wissel.
- **Donateur-coördinaten** (`donateurs.lat`/`.lng`, migratie 0010):
  nullable, optioneel gevuld via `navigator.geolocation` in
  `OphaalForm.tsx` bij het indienen van het ophaalformulier (non-
  blocking, net als bij de speler). Zonder toestemming blijft een
  verzoek gewoon zichtbaar op het prikbord, alleen zonder
  afstand/kaart-cirkel — enkel de postcode-cijfers.

## "Glas-naar-Kas" service: premium upsell zonder bonnetje-scan

Naast de gratis statiegeld-ophaalflow kan een buurtbewoner een vaste
donatie (€5/€10/€15) vooraf betalen om oud papier of zware
glasbak-flessen door een team te laten weggooien — geen OCR-scan, geen
penningmeester-verificatie. De betaling loopt via een échte Stripe
Checkout-sessie (zie de Stripe Connect-sectie hierboven); de 5%-fee
wordt daarbij automatisch ingehouden door Stripe zelf, niet via de
handmatige conceptfactuur.

- **Schema** (migratie 0013): `ophaalverzoeken.type`
  (`'statiegeld' | 'glasbak'`), `.vooraf_betaald` en `.donatie_bedrag`.
  `teams.glas_service_actief` (standaard `false`) is bewust **per
  team**, niet per club schakelbaar — een club zet dit typisch alleen
  aan voor oudere teams (zwaar tilwerk, scherven), nooit stilzwijgend
  voor jeugdteams. `bonnetjes.bron` (`'scan' | 'glas_naar_kas'`)
  onderscheidt de herkomst; `bonnetjes.foto_url` is nu nullable, met
  een check-constraint die een foto nog altijd verplicht stelt voor
  `bron = 'scan'`.
- **Donateur** (`components/donor/OphaalFlow.tsx`): een type-
  keuzescherm vóór het bestaande `OphaalForm` — "Statiegeld Ophalen"
  vs. "Naar de Glas-naar-Kas Service", waarbij die tweede knop alleen
  verschijnt als minstens één team van de club `glas_service_actief`
  heeft staan ÉN de club Stripe-onboarding heeft afgerond (anders is er
  geen bestemming om de betaling naar door te storten). Bij die keuze
  doorloopt `GlasNaarKasForm.tsx`: donatiegegevens → bedrag kiezen
  (€5/€10/€15) → volledige redirect naar Stripe's hosted iDeal-
  betaalpagina. De `ophaalverzoeken`-rij zelf (met `type: 'glasbak'`)
  ontstaat pas server-side in `/api/stripe/webhook`, ná bevestigde
  betaling — nooit vooraf en nooit client-side.
- **Speler-prikbord**: `type: 'glasbak'`-ritten krijgen een opvallende
  paars/gouden "bounty"-styling in zowel `PrikbordLijst.tsx` (gradient-
  kaart, 🍾-label, "💰 €X Direct voor de clubkas") als `PrikbordKaart.tsx`
  (pulserende paarse pin met gouden gloed i.p.v. de normale groene
  cirkel). Na het claimen toont `OphaalClaimSheet.tsx` een "Glas
  weggegooid in de wijk-glasbak"-knop in plaats van "Bonnetje
  uploaden" — die roept `POST /api/ophaalverzoeken/[id]/voltooi-glas`
  aan, wat gewoon een normale `bonnetjes`-rij aanmaakt (`bron:
  'glas_naar_kas'`, meteen `status: 'goedgekeurd'`, geen anomaly-
  detection) zodat de bestaande credit-triggers — team, doel,
  speler-streak, badges — automatisch en identiek aan een scan lopen.
  Zowel `GET /api/ophaalverzoeken/nearby` als `POST
  /api/ophaalverzoeken/[id]/claim` filteren/weigeren `glasbak`-ritten
  voor een team zonder `glas_service_actief` — client-side (UX) én
  server-side (afgedwongen), net als bij de doel-teamscoping.
- **Facturatie**: `bron = 'glas_naar_kas'` telt niet meer mee in de
  handmatige conceptfactuur-berekening (`/api/clubs/[slug]/facturen`)
  — de 5%-fee op deze donaties is al automatisch door Stripe
  ingehouden op het moment van betalen, dus die zou anders dubbel
  worden gerekend. Alleen `bron = 'scan'` (fysiek statiegeld, dat nooit
  door het platform stroomt) loopt nog via die handmatige factuur.
- **Admin** (`components/admin/TeamsBeheer.tsx` +
  `components/ui/Toggle.tsx`): een herbruikbare toggle-switch, één per
  team, met `PATCH /api/teams/[id]`.

## Gamification: spelers, badges en streaks

Bovenop de team-brede punten/euro's krijgt elke speler nu ook een eigen,
persoonlijke laag — zonder de bewuste no-login-architectuur van het
team-gedeelte los te laten:

- **Speler-identiteit** (`lib/playerIdentity.ts`): een `crypto.randomUUID()`
  die eenmalig per apparaat in `localStorage` wordt bewaard
  (`statieclub_speler_id`). Geen account, geen wachtwoord — dezelfde
  frictieloze filosofie als de teamkeuze. `TeamContext` laadt deze id bij
  het opstarten en synct hem (samen met team + naam) naar `POST
  /api/spelers`, dat een upsert doet die bewust `avatar_emoji` **niet**
  meestuurt zodat een eenmaal gekozen avatar nooit wordt overschreven.
- **"Scan Eigen Statiegeld"** (`/club/[slug]/scan-eigen`,
  `ScanEigenStatiegeld.tsx`): dezelfde `ReceiptScanner`, maar zonder
  `ophaalverzoekId` — een speler kan zo direct zelf ingeleverde flessen
  claimen zonder eerst een donateursadres te claimen. Daarom is
  `bonnetjes.ophaalverzoek_id` sinds migratie 0008 nullable; `POST
  /api/bonnetjes` slaat de adres-claim-validatie dan simpelweg over.
  Toegang gaat via een globale FAB (floating action button,
  `ClubShell.tsx`) rechtsonder boven de bottom-nav, zichtbaar op elk
  scherm behalve de scan-pagina zelf — het scorebord toont bewust
  alleen statistieken, geen actieknoppen.
- **Streaks**: bijgehouden in `spelers.current_week_streak` /
  `longest_streak`, berekend door de Postgres-functie
  `credit_speler_voor_bonnetje` (aangeroepen vanuit dezelfde
  `apply_bonnetje_insert`/`apply_bonnetje_status_change`-triggers die ook
  teams/doelen crediteren): elke week met minstens 1 goedgekeurd
  bonnetje telt de streak op, een gemiste week breekt hem. Bewuste
  vereenvoudiging: het afkeuren van een oud bonnetje trekt wél het
  bedrag/aantal scans terug, maar breekt de streak niet met
  terugwerkende kracht.
- **Badge-engine** (`lib/badges.ts`): pure applicatiefuncties (geen
  DB-trigger), met een gedeelde kern (`ontgrendelBadges`) en twee
  aanroeppunten die elk hun eigen "moment" hebben:
  - `evaluateBadges(spelerId, nieuwScanBedrag)` — ná een goedgekeurd
    bonnetje, aangeroepen vanuit `POST /api/bonnetjes` en `PATCH
    /api/bonnetjes/[id]/verify`. Dekt `eerste_scan`, `enkele_scan_euro`,
    `exact_bedrag` (verborgen "easter egg"-badges als "Precies Goed"
    €1,00 en "Lucky Number" €7,77), `totaal_euro`, `aantal_scans`,
    `week_streak` én `aantal_claims` (want dit is ook het moment waarop
    een ophaalverzoek naar `voltooid` gaat).
  - `evaluateClaimBadges(spelerId, aangemaaktOp)` — direct ná het
    claimen van een adres (`POST /api/ophaalverzoeken/[id]/claim`),
    voor `snelle_claim` ("Snelle Service": binnen X minuten na
    aanmaken geclaimd — de badge zelf bepaalt X via `criteria_waarde`).
  - `aantal_claims` telt `ophaalverzoeken` met
    `geclaimd_door_speler_id = spelerId AND status = 'voltooid'` — een
    losse kolom naast het bestaande `geclaimd_door_team_id`, puur voor
    persoonlijke buurt-badges ("De Buurtverkenner", "Wijkagent",
    "Burgemeester van de Straat"), toegevoegd in migratie 0009.
  - Beide functies schrijven nieuw ontgrendelde badges naar
    `speler_badges` en geven ze terug zodat de UI een toast kan tonen.
  - **Verborgen badges** (`badges.verborgen`): naam/icoon/beschrijving
    blijven in de UI een "??? — Geheime badge"-mysterie totdat de
    speler ze daadwerkelijk ontgrendelt (`BadgesGrid.tsx#isMysterie`).
  - 20 badges zijn geseed (migratie 0008 + 0009), verdeeld over de
    categorieën Volume/Streak/Actie. Nieuwe badge-soorten toevoegen is
    een rij in `badges` — geen migratie voor de logica zelf nodig,
    tenzij het om een echt nieuw criterium-type gaat.
- **Profiel** (`/club/[slug]/profiel`, `Profiel.tsx`): avatar-picker,
  totaal opgehaald + aantal scans, een "Jouw impact"-vertaling
  (`lib/impact.ts#berekenImpact`, €15 per trainingsbal — puur ter
  illustratie) en de badge-showcase (`BadgesGrid.tsx`, ontgrendelde
  badges in kleur/goud, vergrendelde grijs met slotje, klikken toont de
  ontgrendel-criteria).
- **Leaderboard-uitbreiding**: naast het team-scorebord toont
  `Leaderboard.tsx` nu ook een live "Persoonlijke topscorers"-lijst
  (top 5 spelers op `totaal_opgehaald_euro`, via Realtime) en een
  "Klapper van de week"-widget (het hoogste enkele bonnetje van de
  afgelopen 7 dagen). Dat laatste vraagt een join op `bonnetjes`, dat
  geen publieke RLS-policy heeft — daarom wordt dat server-side met de
  service-role opgehaald in `leaderboard/page.tsx` en enkel het
  geaggregeerde resultaat (naam, avatar, bedrag) naar de client gestuurd.
- **Clubdoel-voortgang voor spelers**: bovenaan `Leaderboard.tsx` toont
  een kaart ("Waar we samen voor sparen") de voortgang per actief doel
  (`doelen`, publiek leesbaar sinds migratie 0007) — dezelfde
  `ProgressBar`/`formatVoortgang` als het admin-dashboard
  (`SaldoOverzicht.tsx`), inclusief live updates via Realtime op
  `doelen`. Zonder dit zag een speler nergens waar de club voor spaart
  of hoe dichtbij het doel al is; nu staat dat motiverend vooraan op
  het scorebord, vóór de "Klapper van de week". Zijn er geen actieve
  doelen, dan blijft de kaart gewoon weg.
- **Nieuwe-badge-toast** (`components/ui/BadgeToast.tsx`): `POST
  /api/bonnetjes` en de verify-route geven `nieuweBadges` terug in hun
  response; `ReceiptScanner` toont die als een reeks Framer Motion-
  toasts bovenop het successcherm.

## Clubbeheer: zelfregistratie

Er is bewust geen vaste rol als "penningmeester" — wie een account
aanmaakt op `/admin/login` kan direct zelf een of meerdere clubs
aanmaken (`/admin/nieuwe-club`) en wordt daarmee automatisch beheerder
van die club(s), via de database-functie `maak_club_met_beheerder`
(`supabase/migrations/0006_...sql`, met een aangepaste parameterlijst
in `0007_...sql` zodra doelen loskomen van clubs — zie hieronder). Die
`security definer`-functie maakt de club én de `club_admins`-koppeling
in één transactie aan, gescopet op `auth.uid()` — er is geen bredere
schrijftoegang tot die tabellen vanaf de client nodig. Heeft een
account meerdere clubs, dan toont `/admin` een lijstje om te wisselen.
Club aanmaken vraagt bewust niet meteen om een spaardoel — dat voeg je
daarna toe op `/admin/[slug]/doelen`.

### Campagnebeheer: teams + WhatsApp-uitnodiging

`/admin/[slug]/campagne-beheer` (`components/admin/TeamsBeheer.tsx`)
laat de beheerder teams toevoegen (`POST /api/clubs/[slug]/teams`,
gated op `club_admins`) en per team een kant-en-klare WhatsApp-
uitnodiging openen — een link naar `/club/[slug]/prikbord` met de
instructie welk team te kiezen. Er is bewust geen los invite-token-
systeem: teamleden hebben toch al geen account (zie hieronder), dus de
link is puur een snelkoppeling naar de bestaande teamkeuze-flow.

### Anoniem chatsysteem (speler ↔ donateur)

Contact na het claimen loopt niet meer via WhatsApp/telefoonnummers,
maar via een ingebouwd, anoniem chatsysteem — geen van beide partijen
ziet ooit het telefoonnummer van de ander. Eén tabel, geen aparte
chat-sessie-laag: `berichten` (migratie 0011) hangt met
`ophaalverzoek_id` direct aan het ophaalverzoek, want er is precies
één gesprek per verzoek.

- **`ChatWindow`** (`components/chat/ChatWindow.tsx`) is de gedeelde
  UI voor beide kanten — enkel de `afzenderType`-prop ("speler" of
  "donateur") verschilt, de rest van het gedrag (bubbels, systeem-
  berichten, input) is identiek. "Realtime" is bewust korte polling
  (elke 2,5s) via `GET /api/berichten`, niet een Supabase Realtime
  subscription: dat laatste vereist een publieke SELECT-policy, en
  zonder `auth.uid()` om een rij-conditie op te hangen zou dat de hele
  tabel voor iedereen leesbaar maken — zelfde afweging als bij het
  Ophaal Prikbord hierboven.
- **Speler-kant** (`/club/[slug]/rit/[ophaalverzoekId]/chat`): bereikbaar
  via de "Chat met bewoner"-knop die na een claim verschijnt in
  `OphaalClaimSheet.tsx` (verving daar de oude WhatsApp-knop).
- **Donateur-kant — de "magic link"** (`/status/[ophaalverzoekId]`):
  een publieke, geen-account-nodig statuspagina. Het ophaalverzoek-id
  zelf (een niet-raadbare UUID) is het gedeelde geheim — zelfde
  vertrouwensmodel als de bestaande `GET /api/ophaalverzoeken/[id]`
  die na een claim ook al zonder account het adres toont. De donateur
  krijgt deze link direct op het bevestigingsscherm van het
  ophaalformulier (`OphaalForm.tsx`) na het indienen.
- **Systeemberichten**: `POST /api/ophaalverzoeken/[id]/claim` voegt
  automatisch een `afzender_type: 'systeem'`-bericht toe zodra een
  team claimt ("Een team heeft deze rit geclaimd — de bewoner is op de
  hoogte gebracht") — bewust neutraal/derde-persoon geformuleerd omdat
  beide partijen dezelfde chat-thread zien. `POST /api/berichten`
  (het generieke endpoint voor speler-/donateur-berichten) weigert
  zelf `afzender_type: 'systeem'` — dat mag alleen server-side vanuit
  andere route handlers ontstaan, nooit op verzoek van de client.
- **Auto-sluiten** (`lib/utils.ts#chatIsGesloten`): zodra
  `ophaalverzoeken.status` op `'voltooid'` staat, blokkeert
  `ChatWindow` het invoerveld en toont "Deze ophaalactie is afgerond.
  De chat is gesloten." De check ondersteunt ook `'geannuleerd'`,
  hoewel die status vandaag nog niet bestaat in het schema (er is geen
  annuleer-functionaliteit) — zo hoeft een toekomstige annuleer-feature
  deze functie niet aan te passen.
- `donateurs.telefoonnummer` wordt sindsdien bewust niet meer
  meegegeven in de server-responses richting de speler (`GET
  /api/ophaalverzoeken/[id]` en de claim-route selecteren het simpelweg
  niet meer) — het veld blijft wel bestaan op het ophaalformulier voor
  eventueel toekomstig/administratief gebruik, maar bereikt de
  speler-UI niet langer.
- **Melding maken (`components/ui/ReportModal.tsx`)**: een "Melding
  maken"-knop in de `ChatWindow`-header opent een modal met vaste
  reden-opties (onbeleefd, niet opgedaagd, te jong voor glas, anders)
  plus een optionele toelichting — bewust vaste opties in plaats van
  alleen een vrij tekstveld, zodat een melding voor het bestuur meteen
  scanbaar is. Dit is puur de UI-flow: `ReportModal` accepteert een
  optionele `onSubmit`-prop om aan een echt endpoint te koppelen; zonder
  die prop simuleert de modal het versturen (net als
  `lib/email.ts`-maandrapport verderop) zodat de component ook los van
  een meldingen-backend bruikbaar is.

## Lokaal draaien

```bash
npm install
cp .env.example .env.local   # vul je Supabase-project-gegevens in
npx supabase db reset        # migraties + seed.sql (met de Supabase CLI)
npm run dev
```

Maak op `/admin/login` een account aan — je komt vanzelf bij "maak je
eerste club aan" terecht en bent daarna direct beheerder.

### Auth-mails vanaf je eigen domein i.p.v. Supabase

Standaard verstuurt Supabase de "Confirm signup"-mail via hun eigen
gedeelde (niet-productiewaardige) mailserver — dit staat los van een
custom domain dat je aan Vercel hebt gekoppeld, want dat is alleen voor
de website. Om de mail als Statieclub te laten verzenden, in het
Supabase-dashboard van je project:

1. **Authentication → SMTP Settings**: zet een custom SMTP-provider op
   (bijv. [Resend](https://resend.com/docs/send-with-supabase-smtp),
   Postmark, SendGrid of AWS SES) met een verzendadres op je eigen
   domein, bijv. `no-reply@statieclub.nl`. Zonder dit blijft elke mail
   — ook met een aangepaste template — vanaf Supabase's adres komen.
   Vergeet niet SPF/DKIM voor dat domein bij je provider in te
   stellen voor goede afleverbaarheid.
2. **Authentication → Email Templates → Confirm signup**: subject
   `Bevestig je Statieclub-account`, body = de kant-en-klare template
   uit
   [`supabase/email-templates/confirm-signup.html`](supabase/email-templates/confirm-signup.html).

## Bekende beperkingen (MVP-scope)

- `npm audit` meldt een aantal kwetsbaarheden die alleen met een major
  upgrade naar Next.js 16 volledig oplossen; hier bewust niet
  automatisch op geüpgraded om de scaffolding niet te breken — check dit
  voor productiegebruik.
- Teamlid-identificatie is een lokale keuze (localStorage) + voornaam +
  een client-gegenereerde speler-id, geen echte login — zie
  beveiligingssectie hierboven. De `team_members`-tabel (Supabase Auth
  per teamlid) staat al in het schema maar wordt bewust niet gebruikt:
  een volwaardige login-stap zou de "frictieloos claimen op de
  fiets"-ervaring vertragen. De gamification-laag (`spelers`, streaks,
  badges) geeft nu wel individuele stats/accountability, maar blijft
  bewust op dit lichte vertrouwensmodel gebaseerd: wist iemand zijn
  browserdata, dan verliest hij zijn speler-historie (nieuwe
  `speler_id` bij het eerstvolgende bezoek). Voor een productie-uitrol
  met écht onvervalsbare per-speler-geschiedenis is Supabase Auth via
  `team_members` de aangewezen uitbreiding.
- Het prikbord ververst via polling (elke 5s) van `GET
  /api/ophaalverzoeken/nearby`, niet via Supabase Realtime — dat
  endpoint doet server-side afstandsberekening op basis van de
  speler-locatie, wat zich niet leent voor een generieke
  `postgres_changes`-subscription. Het leaderboard gebruikt wél echte
  Realtime, want `teams`/`spelers` zijn public-readable zonder
  server-side berekening nodig.
- Donateur-coördinaten worden niet automatisch gegeocodet uit het
  ingevulde adres — `lat`/`lng` komen uitsluitend uit
  `navigator.geolocation` op het moment van indienen. Vult iemand het
  ophaalformulier in op een ander apparaat/moment dan waar de flessen
  staan (of weigert die locatietoestemming), dan blijft dat verzoek
  gewoon zichtbaar op het prikbord — alleen zonder afstand of
  kaart-cirkel, enkel de postcode-cijfers. Een echte geocoding-stap
  (adres → coördinaat) is de voor de hand liggende vervolgstap.
- "Campagne afronden" (WhatsApp/Tikkie-herinnering richting teams) is
  een eenmalige, niet-periodieke actie gebaseerd op het cumulatieve
  `teams.totaal_opgehaald_euro`; er is geen aparte status die bijhoudt
  of een team het bedrag al fysiek heeft afgedragen aan de clubkas —
  dat blijft sociale controle, zoals gevraagd.
- De 5%-platformfactuur is een intern gegenereerde conceptfactuur
  (status `concept`/`verzonden`/`betaald` in de `facturen`-tabel); er
  is geen koppeling met een echte facturatie-/betaalprovider.
- De Mollie-integratie (`/admin/[slug]/facturatie`, hierboven) is —
  anders dan de gesimuleerde Glas-naar-Kas-betaalstap — een échte
  koppeling: zonder een geldige `MOLLIE_API_KEY` (en publiek bereikbare
  `NEXT_PUBLIC_SITE_URL` voor de webhook) werkt geen van de Mollie-routes.
  Alleen het maandrapport zelf (`lib/email.ts`) is bewust gesimuleerd —
  zie de toelichting daarboven.
- De donateur-statuspagina (`/status/[ophaalverzoekId]`) ververst alleen
  de chatberichten via polling — niet de status van het ophaalverzoek
  zelf. Rondt een team een ophaalactie af terwijl een donateur die
  pagina open heeft staan, dan ziet die pas na een handmatige refresh
  dat de chat gesloten is. Geen dataverlies, wel een moment van
  verouderde info; een volgende stap zou dit veld meenemen in dezelfde
  polling-cyclus als de berichten.
- Er is nog geen overzicht van eerder afgeronde ophaalacties per speler
  ("mijn geschiedenis") — enkel de lopende, geclaimde adressen zijn
  zichtbaar (`GET /api/ophaalverzoeken/mijn-team`). De cumulatieve
  stats op het profiel (totaal opgehaald, streak) blijven wel bewaard,
  alleen de individuele ritten zelf niet als lijst.
