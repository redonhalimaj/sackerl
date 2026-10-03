-- SCKRL-302: receipt upload and storage foundation.

do $$
begin
  create type public.receipt_status as enum ('uploaded', 'parsing', 'parsed', 'failed');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.receipts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  image_url text not null,
  store_name text,
  total_cents integer,
  currency char(3) not null default 'EUR',
  captured_at timestamptz not null default now(),
  parsed_at timestamptz,
  status public.receipt_status not null default 'uploaded',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint receipts_image_url_check check (char_length(trim(image_url)) between 1 and 2048),
  constraint receipts_store_name_check check (store_name is null or char_length(trim(store_name)) between 1 and 120),
  constraint receipts_total_cents_check check (total_cents is null or total_cents >= 0),
  constraint receipts_currency_check check (currency ~ '^[A-Z]{3}$'),
  constraint receipts_parsed_at_check check (parsed_at is null or parsed_at >= captured_at)
);

create or replace function public.touch_receipt_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_receipt_updated_at_on_write
  on public.receipts;

create trigger touch_receipt_updated_at_on_write
  before update on public.receipts
  for each row execute function public.touch_receipt_updated_at();

create index if not exists receipts_household_captured_idx
  on public.receipts (household_id, captured_at desc, id desc);

create index if not exists receipts_household_status_idx
  on public.receipts (household_id, status, captured_at desc);

alter table public.receipts enable row level security;

drop policy if exists "Household members can view receipts" on public.receipts;
create policy "Household members can view receipts"
  on public.receipts
  for select
  using (public.is_household_member(household_id));

drop policy if exists "Household members can insert receipts" on public.receipts;
create policy "Household members can insert receipts"
  on public.receipts
  for insert
  with check (public.is_household_member(household_id));

drop policy if exists "Household members can update receipts" on public.receipts;
create policy "Household members can update receipts"
  on public.receipts
  for update
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

drop policy if exists "Household members can delete receipts" on public.receipts;
create policy "Household members can delete receipts"
  on public.receipts
  for delete
  using (public.is_household_member(household_id));
