-- Allow every authenticated Space member to view visit photo metadata and
-- private files. Upload/delete permissions remain controlled by existing
-- policies. This repair is safe to run more than once.

alter table public.photos enable row level security;

grant select on public.photos to authenticated;

drop policy if exists "Space members can view visit photos"
  on public.photos;

create policy "Space members can view visit photos"
  on public.photos
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.space_members
      where space_members.space_id = photos.space_id
        and space_members.user_id = auth.uid()
    )
  );

grant select on table storage.objects to authenticated;

drop policy if exists "Space members can view visit photo files"
  on storage.objects;

create policy "Space members can view visit photo files"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'visit-photos'
    and exists (
      select 1
      from public.space_members
      where space_members.space_id = case
        when split_part(storage.objects.name, '/', 1) ~
          '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
          then split_part(storage.objects.name, '/', 1)::uuid
        else null
      end
        and space_members.user_id = auth.uid()
    )
  );
