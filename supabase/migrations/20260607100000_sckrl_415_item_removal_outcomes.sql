do $$
begin
  create type public.item_removal_reason as enum ('used', 'composted');
exception
  when duplicate_object then null;
end $$;

alter table public.items
  add column if not exists removal_reason public.item_removal_reason;

alter table public.items
  drop constraint if exists items_removal_reason_requires_removed_on;

alter table public.items
  add constraint items_removal_reason_requires_removed_on
  check (removed_on is not null or removal_reason is null);

create index if not exists items_household_removal_stats_idx
  on public.items (household_id, removed_on, removal_reason)
  where removed_on is not null and removal_reason is not null;
