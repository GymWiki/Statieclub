# Statieclub

Regionaal platform dat buurtbewoners (donateurs) die van hun statiegeld
af willen, koppelt aan lokale sportclubs. Teams binnen een club strijden
via een live, gegamificeerd leaderboard om de meeste flessen op te halen.

## Stack

- **Next.js 14 (App Router)** + **React 18** + **TypeScript**
- **Tailwind CSS** voor styling, **Framer Motion** voor animatie, **Lucide React** voor iconen
- **Supabase** (PostgreSQL + Auth + Realtime + Storage)

## Mappenstructuur

```
app/
  page.tsx                        Marketing-landingspagina (Nav/Hero/HowItWorks/ClubPitch/Footer)
  donateren/page.tsx              Functionele donor-flow (postcode + live clubgrid, met ?postcode=)
  clubs/[slug]/page.tsx           Club-detail + ophaalformulier (donor)
  club/[slug]/layout.tsx          Mobiele shell voor teamleden (teamkeuze + bottom nav)
  club/[slug]/leaderboard/        Live scorebord
  club/[slug]/prikbord/           Ophaal Prikbord (claimen van adressen)
  club/[slug]/upload/             Hybride OCR Bonnetjes Scanner (ReceiptScanner)
  admin/login/                    Penningmeester login/registratie (e-mail + wachtwoord)
  admin/[slug]/page.tsx           Penningmeester-dashboard
  auth/callback/                  Supabase Auth e-mailbevestiging-callback (na registratie)
  api/                            Route handlers (schrijfacties, service-role)

components/
  marketing/                      Landingspagina-secties (Nav, Hero, HowItWorks, ClubPitch, Footer)
  ui/                             Generieke UI-bouwstenen (Button, Card, ProgressBar, ...)
  donor/                          Donor-dashboard componenten
  team/                           Club/team mobiele-view componenten
  admin/                          Penningmeester-dashboard componenten

lib/
  supabase/                       Browser-, server- en service-role Supabase clients
  types.ts                        TypeScript-types die 1-op-1 het DB-schema volgen
  utils.ts                        Formatting, puntenberekening, anomaly-detection-regels
  ocr.ts                          Client-side "OCR-engine" (gesimuleerd) + regex-extractie
  motion.ts                       Gedeelde Framer Motion fade-up variant (respecteert reduced-motion)
  donorProfile.ts / teamSelection.ts  Lichte lokale "wie ben ik"-opslag (localStorage)

supabase/
  migrations/0001_init_schema.sql Tabellen, enums, triggers
  migrations/0002_rls_policies.sql Row Level Security + publieke prikbord-view
  migrations/0003_storage.sql     Storage-bucket voor bonnetje-foto's
  migrations/0004_bonnetje_status_enum.sql  Nieuwe status 'in_afwachting_controle'
  migrations/0005_anomaly_detection_en_facturatie.sql  flag_reden, herziene triggers, facturen-tabel
  seed.sql                        Demodata voor lokale ontwikkeling
```

## Database-architectuur

Volledig relationeel, geen geneste/array/JSON-lijstkolommen — elke
1-op-veel relatie is een eigen tabel met een foreign key:

| Tabel | Belangrijkste kolommen |
|---|---|
| `clubs` | naam, slug, postcode, regio, actief_spaardoel, doelbedrag, opgehaald_bedrag |
| `teams` | club_id, team_naam, totaal_punten, totaal_opgehaald_euro |
| `donateurs` | naam, email (uniek), adres, postcode, telefoonnummer |
| `ophaalverzoeken` | donateur_id, club_id, geclaimd_door_team_id, status, aantal_geschat |
| `bonnetjes` | ophaalverzoek_id, team_id, foto_url, bedrag_euro, punten, status, flag_reden |
| `club_admins` | club_id, user_id (Supabase Auth), rol |
| `team_members` | team_id, user_id (Supabase Auth), naam |
| `facturen` | club_id, periode_start, periode_eind, totaal_goedgekeurd_bedrag, platform_fee_bedrag, status |

**Triggers** houden de scores automatisch consistent:
- Bij het inleveren van een bonnetje bepaalt de anomaly-detection-check
  (zie hieronder) of het meteen `goedgekeurd` wordt — dan gaan de
  punten/euro's **direct** naar het team (instant gratification) en het
  ophaalverzoek naar `voltooid` — of dat het op `in_afwachting_controle`
  blijft staan totdat de penningmeester het beoordeelt.
- `clubs.opgehaald_bedrag` is altijd de som van alle teamtotalen — het
  "virtuele" saldo dat de penningmeester ziet.
- Keurt de penningmeester een bonnetje later alsnog goed (of overschrijft
  het bedrag), dan worden de punten/euro's op dát moment bijgeschreven en
  gaat het ophaalverzoek naar `voltooid`.
- Keurt de penningmeester een bonnetje af nadat het al meetelde, dan
  wordt het bedrag automatisch weer van het team afgetrokken.

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

- `clubs` en `teams` zijn publiek leesbaar (landingspagina, live
  leaderboard zonder login).
- `donateurs`, `ophaalverzoeken` en `bonnetjes` hebben **geen**
  publieke policies: alleen route handlers met de **service-role key**
  mogen hier direct bij. De browser komt hier nooit rechtstreeks aan.
- Het **Ophaal Prikbord** leest via de view `ophaalverzoeken_prikbord`,
  die bewust alleen niet-privacygevoelige kolommen toont (status,
  geschat aantal, eerste 4 postcodecijfers). Het volledige adres wordt
  pas server-side vrijgegeven zodra een team het verzoek claimt.
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
verificatieplicht van de penningmeester omzeilen door zelf een status
mee te sturen.

## Lokaal draaien

```bash
npm install
cp .env.example .env.local   # vul je Supabase-project-gegevens in
npx supabase db reset        # migraties + seed.sql (met de Supabase CLI)
npm run dev
```

Maak jezelf penningmeester van een demo-club door op `/admin/login`
een account aan te maken (of in te loggen) en daarna handmatig een rij
toe te voegen aan `club_admins` met jouw `auth.users`-id en de
`club_id` van bijv. SV De Meteoor.

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
- Teamlid-identificatie is een lokale keuze (localStorage), geen echte
  login — zie beveiligingssectie hierboven.
- Het prikbord ververst via polling (elke 5s), niet via Supabase
  Realtime, omdat de onderliggende tabel bewust geen anon-leesrechten
  heeft (RLS). Het leaderboard gebruikt wél echte Realtime, want
  `teams` is public-readable.
- "Campagne afronden" (WhatsApp/Tikkie-herinnering richting teams) is
  een eenmalige, niet-periodieke actie gebaseerd op het cumulatieve
  `teams.totaal_opgehaald_euro`; er is geen aparte status die bijhoudt
  of een team het bedrag al fysiek heeft afgedragen aan de clubkas —
  dat blijft sociale controle, zoals gevraagd.
- De 5%-platformfactuur is een intern gegenereerde conceptfactuur
  (status `concept`/`verzonden`/`betaald` in de `facturen`-tabel); er
  is geen koppeling met een echte facturatie-/betaalprovider.
