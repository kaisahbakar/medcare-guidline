-- MedCare — Storage bucket for manual editor images
-- Run in Supabase: Dashboard → SQL → New query

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'manual-media',
  'manual-media',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/gif', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public URLs (reader + editor preview)
drop policy if exists "Public read manual media" on storage.objects;
create policy "Public read manual media"
on storage.objects for select
to public
using (bucket_id = 'manual-media');

-- Uploads from the app (uses anon key unless you add Supabase Auth)
drop policy if exists "Allow insert manual media" on storage.objects;
create policy "Allow insert manual media"
on storage.objects for insert
to anon, authenticated
with check (bucket_id = 'manual-media');

drop policy if exists "Allow update manual media" on storage.objects;
create policy "Allow update manual media"
on storage.objects for update
to anon, authenticated
using (bucket_id = 'manual-media')
with check (bucket_id = 'manual-media');

drop policy if exists "Allow delete manual media" on storage.objects;
create policy "Allow delete manual media"
on storage.objects for delete
to anon, authenticated
using (bucket_id = 'manual-media');
