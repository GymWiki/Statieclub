-- Statieclub — doelen scopen naar specifieke teams
--
-- Tot nu toe kon élk team van een club elk actief doel steunen. Een
-- club wil soms twee acties naast elkaar laten lopen voor
-- verschillende teams (bijv. JO11 spaart voor nieuwe shirts, JO15
-- voor een kamp) zonder dat de ene actie op het prikbord/scorebord
-- van het andere team verschijnt. `doel_teams` legt die koppeling
-- vast — een doel zonder rijen hier blijft, zoals voorheen, open voor
-- alle teams van de club (backwards compatible met bestaande doelen,
-- die immers geen rijen in deze nieuwe tabel hebben).

create table doel_teams (
  doel_id            uuid not null references doelen (id) on delete cascade,
  team_id            uuid not null references teams (id) on delete cascade,
  primary key (doel_id, team_id)
);

create index idx_doel_teams_team on doel_teams (team_id);

-- Publiek leesbaar, net als doelen/teams zelf — geen PII, enkel welke
-- teamnamen bij welk doel horen (nodig om het prikbord en scorebord
-- per team te filteren). Schrijven loopt uitsluitend via de
-- service-role in route handlers, na een club_admins-check — zelfde
-- patroon als doelen/teams.
alter table doel_teams enable row level security;

create policy "doel_teams zijn publiek leesbaar"
  on doel_teams for select
  using (true);
