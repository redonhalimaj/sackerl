-- SCKRL-511: durable household shopping list.

do $$
begin
  create type public.shopping_list_source as enum ('manual', 'recipe', 'suggested');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.shopping_list_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null,
  qty_value numeric(10, 3) not null default 1,
  qty_unit public.item_qty_unit not null default 'pcs',
  category_id text references public.categories (id),
  source public.shopping_list_source not null default 'manual',
  recipe_id text references public.recipes (id) on delete set null,
  checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shopping_list_items_name_check check (char_length(trim(name)) between 1 and 120),
  constraint shopping_list_items_qty_value_check check (qty_value > 0)
);

create or replace function public.touch_shopping_list_item_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_shopping_list_item_updated_at_on_write
  on public.shopping_list_items;

create trigger touch_shopping_list_item_updated_at_on_write
  before update on public.shopping_list_items
  for each row execute function public.touch_shopping_list_item_updated_at();

create index if not exists shopping_list_items_household_active_idx
  on public.shopping_list_items (household_id, checked_at, created_at desc);

create index if not exists shopping_list_items_household_source_idx
  on public.shopping_list_items (household_id, source, created_at desc);

alter table public.shopping_list_items enable row level security;

drop policy if exists "Household members can view shopping list items"
  on public.shopping_list_items;
create policy "Household members can view shopping list items"
  on public.shopping_list_items
  for select
  using (public.is_household_member(household_id));

drop policy if exists "Household members can insert shopping list items"
  on public.shopping_list_items;
create policy "Household members can insert shopping list items"
  on public.shopping_list_items
  for insert
  with check (public.is_household_member(household_id));

drop policy if exists "Household members can update shopping list items"
  on public.shopping_list_items;
create policy "Household members can update shopping list items"
  on public.shopping_list_items
  for update
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

drop policy if exists "Household members can delete shopping list items"
  on public.shopping_list_items;
create policy "Household members can delete shopping list items"
  on public.shopping_list_items
  for delete
  using (public.is_household_member(household_id));
