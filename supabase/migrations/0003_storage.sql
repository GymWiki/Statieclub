-- Statieclub — Storage bucket voor bonnetje-foto's
--
-- Publiek leesbaar (om de foto in het penningmeester-dashboard te
-- tonen zonder signed URLs), maar alleen uploadbaar — geen overschrijven
-- of verwijderen vanaf de client. Verificatie/afkeuren gebeurt op de
-- database-rij (bonnetjes.status), niet op het bestand zelf.

insert into storage.buckets (id, name, public)
values ('bonnetjes', 'bonnetjes', true)
on conflict (id) do nothing;

create policy "iedereen mag bonnetje-foto's uploaden"
  on storage.objects for insert
  with check (bucket_id = 'bonnetjes');

create policy "bonnetje-foto's zijn publiek leesbaar"
  on storage.objects for select
  using (bucket_id = 'bonnetjes');
