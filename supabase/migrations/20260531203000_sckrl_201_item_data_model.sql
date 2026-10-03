-- SCKRL-201: item data model for stock and storage.

do $$
begin
  create type public.item_qty_unit as enum ('g', 'kg', 'ml', 'l', 'pcs');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.item_source as enum ('manual', 'receipt', 'imported');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.categories (
  id text primary key,
  label text not null,
  short text not null,
  sort_order smallint not null unique,
  constraint categories_id_check check (id ~ '^[a-z][a-z0-9-]{1,31}$'),
  constraint categories_label_check check (char_length(trim(label)) between 1 and 80),
  constraint categories_short_check check (short ~ '^[A-Z]{2}$')
);

insert into public.categories (id, label, short, sort_order)
values
  ('dairy', 'Dairy', 'MK', 10),
  ('produce', 'Produce', 'PR', 20),
  ('meat', 'Meat & Fish', 'MT', 30),
  ('pantry', 'Pantry', 'PN', 40),
  ('canned', 'Canned', 'CN', 50),
  ('frozen', 'Frozen', 'FR', 60),
  ('bakery', 'Bakery', 'BK', 70),
  ('snacks', 'Snacks', 'SN', 80),
  ('drinks', 'Drinks', 'DR', 90),
  ('spices', 'Spices', 'SP', 100)
on conflict (id) do update
  set label = excluded.label,
      short = excluded.short,
      sort_order = excluded.sort_order;

create table if not exists public.zones (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  key text not null,
  label text not null,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  constraint zones_household_id_id_key unique (household_id, id),
  constraint zones_household_id_key_key unique (household_id, key),
  constraint zones_key_check check (key ~ '^[a-z][a-z0-9-]{1,31}$'),
  constraint zones_label_check check (char_length(trim(label)) between 1 and 80)
);

create or replace function public.zone_label_from_key(zone_key text)
returns text
language sql
immutable
as $$
  select case zone_key
    when 'fridge' then 'Fridge'
    when 'pantry' then 'Pantry'
    when 'basement' then 'Basement'
    when 'freezer' then 'Freezer'
    when 'cabinet' then 'Cabinet'
    else initcap(replace(zone_key, '-', ' '))
  end;
$$;

create or replace function public.sync_household_zones()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.zones (household_id, key, label, sort_order)
  select
    new.id,
    selected.zone_key,
    public.zone_label_from_key(selected.zone_key),
    selected.zone_order::smallint
  from (
    select distinct on (zone_key) zone_key, zone_order
    from unnest(new.zones) with ordinality as selected(zone_key, zone_order)
    where selected.zone_key ~ '^[a-z][a-z0-9-]{1,31}$'
    order by zone_key, zone_order
  ) as selected
  on conflict (household_id, key) do update
    set label = excluded.label,
        sort_order = excluded.sort_order;

  delete from public.zones
  where household_id = new.id
    and not (key = any(new.zones));

  return new;
end;
$$;

drop trigger if exists sync_household_zones_on_write on public.households;

create trigger sync_household_zones_on_write
  after insert or update of zones on public.households
  for each row execute function public.sync_household_zones();

insert into public.zones (household_id, key, label, sort_order)
select
  households.id,
  selected.zone_key,
  public.zone_label_from_key(selected.zone_key),
  selected.zone_order::smallint
from public.households
cross join lateral (
  select distinct on (zone_key) zone_key, zone_order
  from unnest(households.zones) with ordinality as selected(zone_key, zone_order)
  where selected.zone_key ~ '^[a-z][a-z0-9-]{1,31}$'
  order by zone_key, zone_order
) as selected
on conflict (household_id, key) do update
  set label = excluded.label,
      sort_order = excluded.sort_order;

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null,
  qty_value numeric(10, 3) not null,
  qty_unit public.item_qty_unit not null,
  category_id text not null references public.categories (id),
  zone_id uuid not null,
  expires_on date,
  added_on date not null default current_date,
  removed_on date,
  source public.item_source not null default 'manual',
  constraint items_household_zone_fk
    foreign key (household_id, zone_id)
    references public.zones (household_id, id)
    on update cascade
    on delete restrict,
  constraint items_name_check check (char_length(trim(name)) between 1 and 120),
  constraint items_qty_value_check check (qty_value > 0),
  constraint items_removed_on_check check (removed_on is null or removed_on >= added_on)
);

create index if not exists zones_household_sort_idx
  on public.zones (household_id, sort_order, key);

create index if not exists items_household_active_idx
  on public.items (household_id, removed_on, added_on desc);

create index if not exists items_household_zone_idx
  on public.items (household_id, zone_id)
  where removed_on is null;

create index if not exists items_household_category_idx
  on public.items (household_id, category_id)
  where removed_on is null;

create index if not exists items_household_expires_idx
  on public.items (household_id, expires_on)
  where removed_on is null and expires_on is not null;

create or replace function public.is_household_member(target_household_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.household_members
    where household_id = target_household_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.is_household_owner(target_household_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.households
    where id = target_household_id
      and owner_id = auth.uid()
  );
$$;

alter table public.categories enable row level security;
alter table public.zones enable row level security;
alter table public.items enable row level security;

drop policy if exists "Categories are readable" on public.categories;
create policy "Categories are readable"
  on public.categories
  for select
  using (true);

drop policy if exists "Household members can view zones" on public.zones;
create policy "Household members can view zones"
  on public.zones
  for select
  using (public.is_household_member(household_id));

drop policy if exists "Household owners can insert zones" on public.zones;
create policy "Household owners can insert zones"
  on public.zones
  for insert
  with check (public.is_household_owner(household_id));

drop policy if exists "Household owners can update zones" on public.zones;
create policy "Household owners can update zones"
  on public.zones
  for update
  using (public.is_household_owner(household_id))
  with check (public.is_household_owner(household_id));

drop policy if exists "Household owners can delete zones" on public.zones;
create policy "Household owners can delete zones"
  on public.zones
  for delete
  using (public.is_household_owner(household_id));

drop policy if exists "Household members can view items" on public.items;
create policy "Household members can view items"
  on public.items
  for select
  using (public.is_household_member(household_id));

drop policy if exists "Household members can insert items" on public.items;
create policy "Household members can insert items"
  on public.items
  for insert
  with check (public.is_household_member(household_id));

drop policy if exists "Household members can update items" on public.items;
create policy "Household members can update items"
  on public.items
  for update
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

drop policy if exists "Household members can delete items" on public.items;
create policy "Household members can delete items"
  on public.items
  for delete
  using (public.is_household_member(household_id));
