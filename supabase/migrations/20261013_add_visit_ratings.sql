-- Store one private-to-edit, Space-visible rating per member and visit.
create table if not exists public.visit_ratings (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid not null references public.visits(id) on delete cascade,
  space_id uuid not null references public.spaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating numeric(2, 1) not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint visit_ratings_rating_half_star_check
    check (rating >= 0.5 and rating <= 5 and rating = round(rating * 2) / 2),
  constraint visit_ratings_visit_member_unique unique (visit_id, user_id)
);

create index if not exists visit_ratings_space_visit_idx
  on public.visit_ratings (space_id, visit_id);

alter table public.visit_ratings enable row level security;

grant select, insert, update, delete on table public.visit_ratings
  to authenticated;

create policy "Space members can view visit ratings"
  on public.visit_ratings
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.space_members
      where space_members.space_id = visit_ratings.space_id
        and space_members.user_id = auth.uid()
    )
  );

create policy "Members can create their own visit ratings"
  on public.visit_ratings
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.space_members
      where space_members.space_id = visit_ratings.space_id
        and space_members.user_id = auth.uid()
    )
    and exists (
      select 1
      from public.visits
      where visits.id = visit_ratings.visit_id
        and visits.space_id = visit_ratings.space_id
    )
  );

create policy "Members can update their own visit ratings"
  on public.visit_ratings
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.space_members
      where space_members.space_id = visit_ratings.space_id
        and space_members.user_id = auth.uid()
    )
  );

create policy "Members can delete their own visit ratings"
  on public.visit_ratings
  for delete
  to authenticated
  using (user_id = auth.uid());

-- Preserve existing legacy ratings as ratings from the visit creator.
insert into public.visit_ratings (visit_id, space_id, user_id, rating)
select id, space_id, created_by, overall_rating
from public.visits
where overall_rating is not null
  and created_by is not null
on conflict (visit_id, user_id) do nothing;
