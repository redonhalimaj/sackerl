-- SCKRL-303: OCR and line-item parsing foundation.

do $$
begin
  create type public.receipt_item_confidence_level as enum ('high', 'mid', 'needs_review');
exception
  when duplicate_object then null;
end $$;

alter table public.receipts
  add column if not exists purchased_on date;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'receipts_id_household_id_key'
      and conrelid = 'public.receipts'::regclass
  ) then
    alter table public.receipts
      add constraint receipts_id_household_id_key unique (id, household_id);
  end if;
end $$;

create table if not exists public.receipt_items (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null,
  household_id uuid not null,
  line_index smallint not null,
  raw_text text not null,
  inferred_name text not null,
  qty_value numeric(10, 3) not null default 1,
  qty_unit public.item_qty_unit not null default 'pcs',
  category_id text not null references public.categories (id),
  confidence numeric(4, 3) not null,
  confidence_level public.receipt_item_confidence_level not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint receipt_items_receipt_fk
    foreign key (receipt_id, household_id)
    references public.receipts (id, household_id)
    on update cascade
    on delete cascade,
  constraint receipt_items_line_index_key unique (receipt_id, line_index),
  constraint receipt_items_line_index_check check (line_index >= 0),
  constraint receipt_items_raw_text_check check (char_length(trim(raw_text)) between 1 and 300),
  constraint receipt_items_inferred_name_check check (char_length(trim(inferred_name)) between 1 and 120),
  constraint receipt_items_qty_value_check check (qty_value > 0),
  constraint receipt_items_confidence_check check (confidence >= 0 and confidence <= 1)
);

create or replace function public.touch_receipt_item_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_receipt_item_updated_at_on_write
  on public.receipt_items;

create trigger touch_receipt_item_updated_at_on_write
  before update on public.receipt_items
  for each row execute function public.touch_receipt_item_updated_at();

create index if not exists receipt_items_household_receipt_idx
  on public.receipt_items (household_id, receipt_id, line_index);

alter table public.receipt_items enable row level security;

drop policy if exists "Household members can view receipt items" on public.receipt_items;
create policy "Household members can view receipt items"
  on public.receipt_items
  for select
  using (public.is_household_member(household_id));

drop policy if exists "Household members can insert receipt items" on public.receipt_items;
create policy "Household members can insert receipt items"
  on public.receipt_items
  for insert
  with check (public.is_household_member(household_id));

drop policy if exists "Household members can update receipt items" on public.receipt_items;
create policy "Household members can update receipt items"
  on public.receipt_items
  for update
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

drop policy if exists "Household members can delete receipt items" on public.receipt_items;
create policy "Household members can delete receipt items"
  on public.receipt_items
  for delete
  using (public.is_household_member(household_id));
