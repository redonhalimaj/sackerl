-- SCKRL-102: household storage-zone selections.

alter table public.households
  add column if not exists zones text[] not null default array['fridge', 'pantry', 'basement', 'freezer']::text[];

alter table public.households
  drop constraint if exists households_zones_non_empty_check;

alter table public.households
  add constraint households_zones_non_empty_check
  check (coalesce(array_length(zones, 1), 0) >= 1);
