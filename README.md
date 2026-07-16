# Statieclub

Regionaal platform dat buurtbewoners (donateurs) die van hun statiegeld
af willen, koppelt aan lokale sportclubs. Teams binnen een club strijden
via een live, gegamificeerd leaderboard om de meeste flessen op te halen.

## Stack

- **Next.js 14 (App Router)** + **React 18** + **TypeScript**
- **Tailwind CSS** voor styling, **Lucide React** voor iconen
- **Supabase** (PostgreSQL + Auth + Realtime + Storage)

## Mappenstructuur

```
app/
  page.tsx                        Donor-landingspagina (postcode + clubgrid)
  clubs/[slug]/page.tsx           Club-detail + ophaalformulier (donor)
  club/[slug]/layout.tsx          Mobiele shell voor teamleden (teamkeuze + bottom nav)
  club/[slug]/leaderboard/        Live scorebord
  club/[slug]/prikbord/           Ophaal Prikbord (claimen van adressen)
  club/[slug]/upload/             Bonnetjes Upload Simulator (OCR)
  admin/login/                    Penningmeester magic-link login
  admin/[slug]/page.tsx           Penningmeester-dashboard
  auth/callback/                  Supabase Auth magic-link callback
  api/                            Route handlers (schrijfacties, service-role)

components/
  ui/                             Generieke UI-bouwstenen (Button, Card, ProgressBar, ...)
  donor/                          Donor-dashboard componenten
  team/                           Club/team mobiele-view componenten
  admin/                          Penningmeester-dashboard componenten

lib/
  supabase/                       Browser-, server- en service-role Supabase clients
  types.ts                        TypeScript-types die 1-op-1 het DB-schema volgen
  utils.ts                        Formatting, puntenberekening, OCR-simulatie
  donorProfile.ts / teamSelection.ts  Lichte lokale "wie ben ik"-opslag (localStorage)

supabase/
  migrations/0001_init_schema.sql Tabellen, enums, triggers
  migrations/0002_rls_policies.sql Row Level Security + publieke prikbord-view
  migrations/0003_storage.sql     Storage-bucket voor bonnetje-foto's
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
| `bonnetjes` | ophaalverzoek_id, team_id, foto_url, bedrag_euro, punten, status |
| `club_admins` | club_id, user_id (Supabase Auth), rol |
| `team_members` | team_id, user_id (Supabase Auth), naam |

**Triggers** houden de scores automatisch consistent:
- Bij het inleveren van een bonnetje worden punten/euro's **direct** bij
  het team opgeteld (instant gratification) en gaat het ophaalverzoek
  naar `ingeleverd`.
- `clubs.opgehaald_bedrag` is altijd de som van alle teamtotalen — het
  "virtuele" saldo dat de penningmeester ziet.
- Keurt de penningmeester een bonnetje af nadat het al meetelde, dan
  wordt het bedrag automatisch weer van het team afgetrokken.
- Keurt de penningmeester goed (fysiek geld ontvangen), dan gaat het
  ophaalverzoek naar `voltooid`.

Een donateur blijft **1 record**: het ophaalformulier doet een `upsert`
op e-mailadres, dus bij een volgende actie (ook bij een andere club)
hoeft iemand niets opnieuw in te vullen. Prefill gebeurt via een lokaal
bewaard profiel in de browser (geen open "zoek op e-mailadres"-endpoint,
om het risico van het lekken van namen/adressen via e-mail-enumeratie
uit te sluiten).

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
  `club_admins` aan die club gekoppeld is (Supabase Auth magic link).
- Het **claimen** van adressen en **uploaden** van bonnetjes door
  teamleden is bewust laagdrempelig gehouden (geen login) — dit past
  bij de doelgroep (jeugdleden op de fiets) en de vertrouwensgrens ligt
  hier op "lid van de club", niet op individuele authenticatie. Voor
  een productie-uitrol is het aan te raden hier alsnog `team_members` +
  Supabase Auth voor te gebruiken.

## OCR-simulatie

`lib/utils.ts#simuleerOcrBedrag` doet geen echte beeldherkenning — het
genereert een deterministisch, plausibel bedrag op basis van
bestandsnaam + grootte. Duidelijk gelabeld als simulatie; in productie
hier een echte OCR-provider (bv. Google Vision, AWS Textract) aan
koppelen.

## Lokaal draaien

```bash
npm install
cp .env.example .env.local   # vul je Supabase-project-gegevens in
npx supabase db reset        # migraties + seed.sql (met de Supabase CLI)
npm run dev
```

Maak jezelf penningmeester van een demo-club door na het inloggen
(magic link op `/admin/login`) handmatig een rij toe te voegen aan
`club_admins` met jouw `auth.users`-id en de `club_id` van bijv.
SV De Meteoor.

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
