-- SCKRL-310: receipt review data upgrade and atomic parse promotion.

do $$
begin
  create type public.receipt_review_status as enum ('not_started', 'needs_review', 'reviewed');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.receipt_item_source as enum ('parser', 'manual');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.receipt_item_review_state as enum ('unresolved', 'reviewed');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.receipt_parse_generations (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null,
  household_id uuid not null,
  parser_version text not null,
  provider text not null default 'deterministic',
  line_count integer not null,
  generated_by uuid,
  created_at timestamptz not null default now(),
  promoted_at timestamptz not null default now(),
  constraint receipt_parse_generations_receipt_fk
    foreign key (receipt_id, household_id)
    references public.receipts (id, household_id)
    on update cascade
    on delete cascade,
  constraint receipt_parse_generations_id_household_id_key unique (id, household_id),
  constraint receipt_parse_generations_id_receipt_household_key unique (id, receipt_id, household_id),
  constraint receipt_parse_generations_parser_version_check check (char_length(trim(parser_version)) between 1 and 80),
  constraint receipt_parse_generations_provider_check check (char_length(trim(provider)) between 1 and 80),
  constraint receipt_parse_generations_line_count_check check (line_count between 1 and 100)
);

alter table public.receipts
  add column if not exists active_parse_generation_id uuid,
  add column if not exists review_status public.receipt_review_status not null default 'not_started',
  add column if not exists review_revision integer not null default 0,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid;

alter table public.receipts
  drop constraint if exists receipts_active_parse_generation_fk;

alter table public.receipts
  add constraint receipts_active_parse_generation_fk
  foreign key (active_parse_generation_id, id, household_id)
  references public.receipt_parse_generations (id, receipt_id, household_id)
  deferrable initially immediate;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'receipts_review_revision_check'
      and conrelid = 'public.receipts'::regclass
  ) then
    alter table public.receipts
      add constraint receipts_review_revision_check
      check (review_revision >= 0);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'receipts_review_completion_check'
      and conrelid = 'public.receipts'::regclass
  ) then
    alter table public.receipts
      add constraint receipts_review_completion_check
      check (
        (review_status = 'reviewed' and reviewed_at is not null and reviewed_by is not null)
        or (review_status <> 'reviewed' and reviewed_at is null and reviewed_by is null)
      );
  end if;
end $$;

alter table public.receipt_items
  add column if not exists generation_id uuid,
  add column if not exists source public.receipt_item_source not null default 'parser',
  add column if not exists parser_version text,
  add column if not exists client_line_id text,
  add column if not exists inferred_line_total_cents integer,
  add column if not exists inferred_unit_price_cents integer,
  add column if not exists inferred_discount_cents integer,
  add column if not exists inferred_tax_cents integer,
  add column if not exists review_state public.receipt_item_review_state not null default 'unresolved',
  add column if not exists included boolean not null default true,
  add column if not exists corrected_name text,
  add column if not exists corrected_qty_value numeric(10, 3),
  add column if not exists corrected_qty_unit public.item_qty_unit,
  add column if not exists corrected_category_id text references public.categories (id),
  add column if not exists corrected_at timestamptz,
  add column if not exists corrected_by uuid,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid;

alter table public.receipt_items
  alter column raw_text drop not null,
  alter column inferred_name drop not null,
  alter column qty_value drop not null,
  alter column qty_value drop default,
  alter column qty_unit drop not null,
  alter column qty_unit drop default,
  alter column category_id drop not null,
  alter column confidence drop not null,
  alter column confidence_level drop not null;

with legacy_receipts as (
  select
    receipt_items.receipt_id,
    receipt_items.household_id,
    count(*)::integer as line_count
  from public.receipt_items
  where receipt_items.generation_id is null
  group by receipt_items.receipt_id, receipt_items.household_id
),
inserted_generations as (
  insert into public.receipt_parse_generations (
    receipt_id,
    household_id,
    parser_version,
    provider,
    line_count,
    generated_by,
    promoted_at
  )
  select
    legacy_receipts.receipt_id,
    legacy_receipts.household_id,
    'legacy-sckrl-303',
    'legacy',
    legacy_receipts.line_count,
    null,
    coalesce(receipts.parsed_at, now())
  from legacy_receipts
  inner join public.receipts
    on receipts.id = legacy_receipts.receipt_id
   and receipts.household_id = legacy_receipts.household_id
  returning id, receipt_id, household_id
),
updated_items as (
  update public.receipt_items
  set generation_id = inserted_generations.id,
      source = 'parser',
      parser_version = 'legacy-sckrl-303',
      review_state = 'unresolved',
      included = true
  from inserted_generations
  where receipt_items.receipt_id = inserted_generations.receipt_id
    and receipt_items.household_id = inserted_generations.household_id
    and receipt_items.generation_id is null
  returning receipt_items.id
)
update public.receipts
set active_parse_generation_id = inserted_generations.id,
    review_status = 'needs_review',
    review_revision = 0,
    reviewed_at = null,
    reviewed_by = null
from inserted_generations
where receipts.id = inserted_generations.receipt_id
  and receipts.household_id = inserted_generations.household_id;

alter table public.receipt_items
  alter column generation_id set not null;

alter table public.receipt_items
  drop constraint if exists receipt_items_line_index_key;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'receipt_items_generation_fk'
      and conrelid = 'public.receipt_items'::regclass
  ) then
    alter table public.receipt_items
      add constraint receipt_items_generation_fk
      foreign key (generation_id, receipt_id, household_id)
      references public.receipt_parse_generations (id, receipt_id, household_id)
      on update cascade
      on delete cascade;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'receipt_items_generation_line_index_key'
      and conrelid = 'public.receipt_items'::regclass
  ) then
    alter table public.receipt_items
      add constraint receipt_items_generation_line_index_key unique (generation_id, line_index);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'receipt_items_generation_client_line_id_key'
      and conrelid = 'public.receipt_items'::regclass
  ) then
    alter table public.receipt_items
      add constraint receipt_items_generation_client_line_id_key unique (generation_id, client_line_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'receipt_items_source_payload_check'
      and conrelid = 'public.receipt_items'::regclass
  ) then
    alter table public.receipt_items
      add constraint receipt_items_source_payload_check
      check (
        (
          source = 'parser'
          and raw_text is not null
          and inferred_name is not null
          and qty_value is not null
          and qty_unit is not null
          and category_id is not null
          and confidence is not null
          and confidence_level is not null
          and parser_version is not null
          and client_line_id is null
        )
        or (
          source = 'manual'
          and raw_text is null
          and inferred_name is null
          and qty_value is null
          and qty_unit is null
          and category_id is null
          and confidence is null
          and confidence_level is null
          and parser_version is null
          and client_line_id is not null
          and corrected_name is not null
          and corrected_qty_value is not null
          and corrected_qty_unit is not null
          and corrected_category_id is not null
        )
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'receipt_items_review_state_check'
      and conrelid = 'public.receipt_items'::regclass
  ) then
    alter table public.receipt_items
      add constraint receipt_items_review_state_check
      check (
        (review_state = 'unresolved' and reviewed_at is null and reviewed_by is null)
        or (review_state = 'reviewed' and reviewed_at is not null and reviewed_by is not null)
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'receipt_items_excluded_reviewed_check'
      and conrelid = 'public.receipt_items'::regclass
  ) then
    alter table public.receipt_items
      add constraint receipt_items_excluded_reviewed_check
      check (included or review_state = 'reviewed');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'receipt_items_parser_version_check'
      and conrelid = 'public.receipt_items'::regclass
  ) then
    alter table public.receipt_items
      add constraint receipt_items_parser_version_check
      check (parser_version is null or char_length(trim(parser_version)) between 1 and 80);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'receipt_items_client_line_id_check'
      and conrelid = 'public.receipt_items'::regclass
  ) then
    alter table public.receipt_items
      add constraint receipt_items_client_line_id_check
      check (client_line_id is null or client_line_id ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,79}$');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'receipt_items_corrected_name_check'
      and conrelid = 'public.receipt_items'::regclass
  ) then
    alter table public.receipt_items
      add constraint receipt_items_corrected_name_check
      check (corrected_name is null or char_length(trim(corrected_name)) between 1 and 120);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'receipt_items_corrected_qty_value_check'
      and conrelid = 'public.receipt_items'::regclass
  ) then
    alter table public.receipt_items
      add constraint receipt_items_corrected_qty_value_check
      check (corrected_qty_value is null or corrected_qty_value > 0);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'receipt_items_money_fields_check'
      and conrelid = 'public.receipt_items'::regclass
  ) then
    alter table public.receipt_items
      add constraint receipt_items_money_fields_check
      check (
        (inferred_line_total_cents is null or inferred_line_total_cents >= 0)
        and (inferred_unit_price_cents is null or inferred_unit_price_cents >= 0)
        and (inferred_discount_cents is null or inferred_discount_cents >= 0)
        and (inferred_tax_cents is null or inferred_tax_cents >= 0)
      );
  end if;
end $$;

create index if not exists receipt_parse_generations_receipt_created_idx
  on public.receipt_parse_generations (household_id, receipt_id, created_at desc, id desc);

create index if not exists receipt_items_generation_order_idx
  on public.receipt_items (generation_id, line_index, id);

create index if not exists receipts_active_parse_generation_idx
  on public.receipts (household_id, active_parse_generation_id)
  where active_parse_generation_id is not null;

alter table public.receipt_parse_generations enable row level security;

drop policy if exists "Household members can view receipt parse generations" on public.receipt_parse_generations;
create policy "Household members can view receipt parse generations"
  on public.receipt_parse_generations
  for select
  using (public.is_household_member(household_id));

drop policy if exists "Household members can insert receipt items" on public.receipt_items;
drop policy if exists "Household members can update receipt items" on public.receipt_items;
drop policy if exists "Household members can delete receipt items" on public.receipt_items;

drop trigger if exists protect_receipt_review_columns_on_update on public.receipts;
drop function if exists public.protect_receipt_review_columns();

revoke all on table public.receipts from public, anon, authenticated;
grant select on table public.receipts to authenticated;
grant insert (
  household_id,
  image_url,
  store_name,
  total_cents,
  currency,
  captured_at,
  status
) on public.receipts to authenticated;
grant update (
  image_url,
  store_name,
  total_cents,
  currency,
  captured_at,
  parsed_at,
  purchased_on,
  status
) on public.receipts to authenticated;

revoke all on table public.receipt_parse_generations from public, anon, authenticated;
grant select on table public.receipt_parse_generations to authenticated;
revoke all on table public.receipt_items from public, anon, authenticated;
grant select on table public.receipt_items to authenticated;

create or replace function public.get_receipt_review(
  p_household_id uuid,
  p_receipt_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_review jsonb;
begin
  if auth.uid() is null then
    raise sqlstate 'PT401' using message = 'Authentication is required.';
  end if;

  if not public.is_household_member(p_household_id) then
    raise sqlstate 'PT403' using message = 'Household access is required.';
  end if;

  select jsonb_build_object(
    'receipt', to_jsonb(receipts),
    'items', coalesce(
      (
        select jsonb_agg(to_jsonb(receipt_items) order by receipt_items.line_index asc, receipt_items.id asc)
        from public.receipt_items
        where receipt_items.generation_id = receipts.active_parse_generation_id
          and receipt_items.household_id = receipts.household_id
          and receipt_items.receipt_id = receipts.id
      ),
      '[]'::jsonb
    )
  )
  into v_review
  from public.receipts
  where receipts.id = p_receipt_id
    and receipts.household_id = p_household_id;

  if v_review is null then
    raise sqlstate 'PT404' using message = 'Receipt not found.';
  end if;

  return v_review;
end;
$$;

create or replace function public.mark_receipt_parse_failed(
  p_household_id uuid,
  p_receipt_id uuid,
  p_expected_active_generation_id uuid,
  p_expected_review_revision integer
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_receipt public.receipts%rowtype;
begin
  if auth.uid() is null then
    raise sqlstate 'PT401' using message = 'Authentication is required.';
  end if;

  if not public.is_household_member(p_household_id) then
    raise sqlstate 'PT403' using message = 'Household access is required.';
  end if;

  if p_expected_review_revision is null or p_expected_review_revision < 0 then
    raise sqlstate 'PT400' using message = 'Expected review revision is invalid.';
  end if;

  select *
  into v_receipt
  from public.receipts
  where id = p_receipt_id
    and household_id = p_household_id
  for update;

  if not found then
    raise sqlstate 'PT404' using message = 'Receipt not found.';
  end if;

  if v_receipt.active_parse_generation_id is distinct from p_expected_active_generation_id
    or v_receipt.review_revision <> p_expected_review_revision
  then
    raise sqlstate 'PT409' using message = 'Receipt parse state changed. Reload before marking failed.';
  end if;

  if v_receipt.active_parse_generation_id is null then
    update public.receipts
    set parsed_at = null,
        status = 'failed'
    where id = p_receipt_id
      and household_id = p_household_id;
  end if;

  return public.get_receipt_review(p_household_id, p_receipt_id);
end;
$$;

create or replace function public.promote_receipt_parse(
  p_household_id uuid,
  p_receipt_id uuid,
  p_expected_active_generation_id uuid,
  p_expected_review_revision integer,
  p_parser_version text,
  p_provider text,
  p_currency text,
  p_purchased_on date,
  p_store_name text,
  p_total_cents integer,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_receipt public.receipts%rowtype;
  v_generation_id uuid;
  v_line_count integer;
  v_parser_version text := trim(p_parser_version);
  v_provider text := trim(p_provider);
begin
  if auth.uid() is null then
    raise sqlstate 'PT401' using message = 'Authentication is required.';
  end if;

  if not public.is_household_member(p_household_id) then
    raise sqlstate 'PT403' using message = 'Household access is required.';
  end if;

  if p_expected_review_revision is null or p_expected_review_revision < 0 then
    raise sqlstate 'PT400' using message = 'Expected review revision is invalid.';
  end if;

  if p_currency is null or upper(trim(p_currency)) !~ '^[A-Z]{3}$' then
    raise sqlstate 'PT400' using message = 'Receipt currency must be a 3-letter code.';
  end if;

  if v_parser_version is null
    or char_length(v_parser_version) < 1
    or char_length(v_parser_version) > 80
  then
    raise sqlstate 'PT400' using message = 'Parser version is invalid.';
  end if;

  if v_provider is null
    or char_length(v_provider) < 1
    or char_length(v_provider) > 80
  then
    raise sqlstate 'PT400' using message = 'Receipt provider is invalid.';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise sqlstate 'PT400' using message = 'Parsed receipt items must be an array.';
  end if;

  v_line_count := jsonb_array_length(p_items);

  if v_line_count < 1 or v_line_count > 100 then
    raise sqlstate 'PT400' using message = 'A receipt parse must contain between 1 and 100 items.';
  end if;

  select *
  into v_receipt
  from public.receipts
  where id = p_receipt_id
    and household_id = p_household_id
  for update;

  if not found then
    raise sqlstate 'PT404' using message = 'Receipt not found.';
  end if;

  if v_receipt.active_parse_generation_id is distinct from p_expected_active_generation_id then
    raise sqlstate 'PT409' using message = 'Receipt parse generation changed. Reload before reparsing.';
  end if;

  if v_receipt.review_revision <> p_expected_review_revision then
    raise sqlstate 'PT409' using message = 'Receipt review has changed. Reload before reparsing.';
  end if;

  if v_receipt.review_revision > 0 then
    raise sqlstate 'PT409' using message = 'Receipt review already has saved edits. Deliberate reparse reset is not supported yet.';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_items) as parsed(item)
    where (
      case
        when (parsed.item ->> 'confidence')::numeric >= 0.85 then 'high'
        when (parsed.item ->> 'confidence')::numeric >= 0.65 then 'mid'
        else 'needs_review'
      end
    ) <> parsed.item ->> 'confidence_level'
  ) then
    raise sqlstate 'PT400' using message = 'Receipt item confidence level does not match confidence.';
  end if;

  insert into public.receipt_parse_generations (
    receipt_id,
    household_id,
    parser_version,
    provider,
    line_count,
    generated_by,
    promoted_at
  )
  values (
    p_receipt_id,
    p_household_id,
    v_parser_version,
    v_provider,
    v_line_count,
    auth.uid(),
    now()
  )
  returning id into v_generation_id;

  insert into public.receipt_items (
    receipt_id,
    household_id,
    generation_id,
    source,
    line_index,
    raw_text,
    inferred_name,
    qty_value,
    qty_unit,
    category_id,
    confidence,
    confidence_level,
    parser_version,
    inferred_line_total_cents,
    inferred_unit_price_cents,
    inferred_discount_cents,
    inferred_tax_cents,
    review_state,
    included
  )
  select
    p_receipt_id,
    p_household_id,
    v_generation_id,
    'parser',
    (parsed.ordinality - 1)::smallint,
    nullif(trim(parsed.item ->> 'raw_text'), ''),
    nullif(trim(parsed.item ->> 'inferred_name'), ''),
    (parsed.item ->> 'qty_value')::numeric(10, 3),
    (parsed.item ->> 'qty_unit')::public.item_qty_unit,
    nullif(trim(parsed.item ->> 'category_id'), ''),
    (parsed.item ->> 'confidence')::numeric(4, 3),
    (parsed.item ->> 'confidence_level')::public.receipt_item_confidence_level,
    v_parser_version,
    (parsed.item ->> 'line_total_cents')::integer,
    (parsed.item ->> 'unit_price_cents')::integer,
    (parsed.item ->> 'discount_cents')::integer,
    (parsed.item ->> 'tax_cents')::integer,
    'unresolved',
    true
  from jsonb_array_elements(p_items) with ordinality as parsed(item, ordinality);

  update public.receipts
  set currency = upper(trim(p_currency)),
      purchased_on = p_purchased_on,
      store_name = nullif(trim(coalesce(p_store_name, '')), ''),
      total_cents = p_total_cents,
      parsed_at = now(),
      status = 'parsed',
      active_parse_generation_id = v_generation_id,
      review_status = 'needs_review',
      review_revision = 0,
      reviewed_at = null,
      reviewed_by = null
  where id = p_receipt_id
    and household_id = p_household_id;

  return public.get_receipt_review(p_household_id, p_receipt_id);
end;
$$;

create or replace function public.save_receipt_review(
  p_household_id uuid,
  p_receipt_id uuid,
  p_generation_id uuid,
  p_expected_review_revision integer,
  p_lines jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_receipt public.receipts%rowtype;
  v_line_count integer;
  v_existing_count integer;
  v_existing_input_count integer;
  v_existing_input_distinct_count integer;
  v_existing_matched_count integer;
  v_new_manual_count integer;
  v_new_manual_key_count integer;
  v_new_manual_key_distinct_count integer;
  v_next_line_index integer;
  v_now timestamptz := now();
begin
  if auth.uid() is null then
    raise sqlstate 'PT401' using message = 'Authentication is required.';
  end if;

  if not public.is_household_member(p_household_id) then
    raise sqlstate 'PT403' using message = 'Household access is required.';
  end if;

  if p_expected_review_revision is null or p_expected_review_revision < 0 then
    raise sqlstate 'PT400' using message = 'Expected review revision is invalid.';
  end if;

  if p_lines is null or jsonb_typeof(p_lines) <> 'array' then
    raise sqlstate 'PT400' using message = 'Receipt review lines must be an array.';
  end if;

  v_line_count := jsonb_array_length(p_lines);

  if v_line_count < 1 or v_line_count > 150 then
    raise sqlstate 'PT400' using message = 'Receipt review must contain between 1 and 150 lines.';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_lines) as input(line)
    where not (input.line ? 'included')
      or jsonb_typeof(input.line -> 'included') <> 'boolean'
      or nullif(trim(input.line ->> 'review_state'), '') is null
      or nullif(trim(input.line ->> 'name'), '') is null
      or nullif(trim(input.line ->> 'qty_value'), '') is null
      or nullif(trim(input.line ->> 'qty_unit'), '') is null
      or nullif(trim(input.line ->> 'category_id'), '') is null
  ) then
    raise sqlstate 'PT400' using message = 'Receipt review lines require included, review state, name, quantity, unit, and category.';
  end if;

  select *
  into v_receipt
  from public.receipts
  where id = p_receipt_id
    and household_id = p_household_id
  for update;

  if not found then
    raise sqlstate 'PT404' using message = 'Receipt not found.';
  end if;

  if v_receipt.active_parse_generation_id is distinct from p_generation_id then
    raise sqlstate 'PT409' using message = 'Receipt parse generation changed. Reload before saving.';
  end if;

  if v_receipt.review_revision <> p_expected_review_revision then
    raise sqlstate 'PT409' using message = 'Receipt review has changed. Reload before saving.';
  end if;

  select count(*)
  into v_existing_count
  from public.receipt_items
  where generation_id = p_generation_id;

  with input_lines as (
    select line
    from jsonb_array_elements(p_lines) as input(line)
  ),
  existing_ids as (
    select nullif(trim(line ->> 'id'), '')::uuid as id
    from input_lines
    where line ? 'id'
      and nullif(trim(line ->> 'id'), '') is not null
  )
  select count(*), count(distinct id)
  into v_existing_input_count, v_existing_input_distinct_count
  from existing_ids;

  if v_existing_input_count <> v_existing_input_distinct_count then
    raise sqlstate 'PT409' using message = 'Receipt review contains duplicate line ids.';
  end if;

  with input_lines as (
    select line
    from jsonb_array_elements(p_lines) as input(line)
  ),
  existing_ids as (
    select nullif(trim(line ->> 'id'), '')::uuid as id
    from input_lines
    where line ? 'id'
      and nullif(trim(line ->> 'id'), '') is not null
  )
  select count(*)
  into v_existing_matched_count
  from existing_ids
  inner join public.receipt_items
    on receipt_items.id = existing_ids.id
   and receipt_items.generation_id = p_generation_id;

  if v_existing_input_count <> v_existing_count or v_existing_matched_count <> v_existing_count then
    raise sqlstate 'PT409' using message = 'Receipt review must include every active line exactly once.';
  end if;

  with input_lines as (
    select line
    from jsonb_array_elements(p_lines) as input(line)
  ),
  manual_lines as (
    select nullif(trim(line ->> 'client_line_id'), '') as client_line_id
    from input_lines
    where not (line ? 'id')
       or nullif(trim(line ->> 'id'), '') is null
  )
  select count(*), count(client_line_id), count(distinct client_line_id)
  into v_new_manual_count, v_new_manual_key_count, v_new_manual_key_distinct_count
  from manual_lines;

  if v_new_manual_count <> v_new_manual_key_count then
    raise sqlstate 'PT400' using message = 'Manual receipt lines require clientLineId.';
  end if;

  if v_new_manual_key_count <> v_new_manual_key_distinct_count then
    raise sqlstate 'PT409' using message = 'Receipt review contains duplicate manual line ids.';
  end if;

  if exists (
    with input_lines as (
      select line
      from jsonb_array_elements(p_lines) as input(line)
    ),
    manual_lines as (
      select nullif(trim(line ->> 'client_line_id'), '') as client_line_id
      from input_lines
      where not (line ? 'id')
         or nullif(trim(line ->> 'id'), '') is null
    )
    select 1
    from manual_lines
    inner join public.receipt_items
      on receipt_items.generation_id = p_generation_id
     and receipt_items.client_line_id = manual_lines.client_line_id
  ) then
    raise sqlstate 'PT409' using message = 'Receipt review contains duplicate manual line ids.';
  end if;

  update public.receipt_items as receipt_item
  set included = normalized.included,
      review_state = normalized.review_state,
      corrected_name = case
        when receipt_item.source = 'manual' then normalized.name
        when normalized.name is null then receipt_item.corrected_name
        when normalized.name = receipt_item.inferred_name then null
        else normalized.name
      end,
      corrected_qty_value = case
        when receipt_item.source = 'manual' then normalized.qty_value
        when normalized.qty_value is null then receipt_item.corrected_qty_value
        when normalized.qty_value = receipt_item.qty_value then null
        else normalized.qty_value
      end,
      corrected_qty_unit = case
        when receipt_item.source = 'manual' then normalized.qty_unit
        when normalized.qty_unit is null then receipt_item.corrected_qty_unit
        when normalized.qty_unit = receipt_item.qty_unit then null
        else normalized.qty_unit
      end,
      corrected_category_id = case
        when receipt_item.source = 'manual' then normalized.category_id
        when normalized.category_id is null then receipt_item.corrected_category_id
        when normalized.category_id = receipt_item.category_id then null
        else normalized.category_id
      end,
      corrected_at = case
        when receipt_item.source = 'manual' then null
        when (
          normalized.name is not distinct from coalesce(receipt_item.corrected_name, receipt_item.inferred_name)
          and normalized.qty_value is not distinct from coalesce(receipt_item.corrected_qty_value, receipt_item.qty_value)
          and normalized.qty_unit is not distinct from coalesce(receipt_item.corrected_qty_unit, receipt_item.qty_unit)
          and normalized.category_id is not distinct from coalesce(receipt_item.corrected_category_id, receipt_item.category_id)
        ) then receipt_item.corrected_at
        when (
          (normalized.name is not null and normalized.name is distinct from receipt_item.inferred_name)
          or (normalized.qty_value is not null and normalized.qty_value is distinct from receipt_item.qty_value)
          or (normalized.qty_unit is not null and normalized.qty_unit is distinct from receipt_item.qty_unit)
          or (normalized.category_id is not null and normalized.category_id is distinct from receipt_item.category_id)
        ) then v_now
        else null
      end,
      corrected_by = case
        when receipt_item.source = 'manual' then null
        when (
          normalized.name is not distinct from coalesce(receipt_item.corrected_name, receipt_item.inferred_name)
          and normalized.qty_value is not distinct from coalesce(receipt_item.corrected_qty_value, receipt_item.qty_value)
          and normalized.qty_unit is not distinct from coalesce(receipt_item.corrected_qty_unit, receipt_item.qty_unit)
          and normalized.category_id is not distinct from coalesce(receipt_item.corrected_category_id, receipt_item.category_id)
        ) then receipt_item.corrected_by
        when (
          (normalized.name is not null and normalized.name is distinct from receipt_item.inferred_name)
          or (normalized.qty_value is not null and normalized.qty_value is distinct from receipt_item.qty_value)
          or (normalized.qty_unit is not null and normalized.qty_unit is distinct from receipt_item.qty_unit)
          or (normalized.category_id is not null and normalized.category_id is distinct from receipt_item.category_id)
        ) then auth.uid()
        else null
      end,
      reviewed_at = case
        when normalized.review_state = 'unresolved' then null
        when normalized.review_state is not distinct from receipt_item.review_state
          and normalized.included is not distinct from receipt_item.included
          and normalized.name is not distinct from coalesce(receipt_item.corrected_name, receipt_item.inferred_name)
          and normalized.qty_value is not distinct from coalesce(receipt_item.corrected_qty_value, receipt_item.qty_value)
          and normalized.qty_unit is not distinct from coalesce(receipt_item.corrected_qty_unit, receipt_item.qty_unit)
          and normalized.category_id is not distinct from coalesce(receipt_item.corrected_category_id, receipt_item.category_id)
        then receipt_item.reviewed_at
        else v_now
      end,
      reviewed_by = case
        when normalized.review_state = 'unresolved' then null
        when normalized.review_state is not distinct from receipt_item.review_state
          and normalized.included is not distinct from receipt_item.included
          and normalized.name is not distinct from coalesce(receipt_item.corrected_name, receipt_item.inferred_name)
          and normalized.qty_value is not distinct from coalesce(receipt_item.corrected_qty_value, receipt_item.qty_value)
          and normalized.qty_unit is not distinct from coalesce(receipt_item.corrected_qty_unit, receipt_item.qty_unit)
          and normalized.category_id is not distinct from coalesce(receipt_item.corrected_category_id, receipt_item.category_id)
        then receipt_item.reviewed_by
        else auth.uid()
      end
  from (
    select
      nullif(trim(line ->> 'id'), '')::uuid as id,
      coalesce((line ->> 'included')::boolean, true) as included,
      coalesce((line ->> 'review_state')::public.receipt_item_review_state, 'unresolved') as review_state,
      nullif(trim(line ->> 'name'), '') as name,
      (line ->> 'qty_value')::numeric(10, 3) as qty_value,
      nullif(trim(line ->> 'qty_unit'), '')::public.item_qty_unit as qty_unit,
      nullif(trim(line ->> 'category_id'), '') as category_id
    from jsonb_array_elements(p_lines) as input(line)
    where line ? 'id'
      and nullif(trim(line ->> 'id'), '') is not null
  ) as normalized
  where receipt_item.id = normalized.id
    and receipt_item.generation_id = p_generation_id;

  select coalesce(max(line_index), -1) + 1
  into v_next_line_index
  from public.receipt_items
  where generation_id = p_generation_id;

  insert into public.receipt_items (
    receipt_id,
    household_id,
    generation_id,
    source,
    line_index,
    client_line_id,
    corrected_name,
    corrected_qty_value,
    corrected_qty_unit,
    corrected_category_id,
    review_state,
    included,
    reviewed_at,
    reviewed_by
  )
  select
    p_receipt_id,
    p_household_id,
    p_generation_id,
    'manual',
    (v_next_line_index + row_number() over (order by manual_lines.ordinality) - 1)::smallint,
    manual_lines.client_line_id,
    manual_lines.name,
    manual_lines.qty_value,
    manual_lines.qty_unit,
    manual_lines.category_id,
    manual_lines.review_state,
    manual_lines.included,
    case when manual_lines.review_state = 'reviewed' then v_now else null end,
    case when manual_lines.review_state = 'reviewed' then auth.uid() else null end
  from (
    select
      input.ordinality,
      nullif(trim(input.line ->> 'client_line_id'), '') as client_line_id,
      coalesce((input.line ->> 'included')::boolean, true) as included,
      coalesce((input.line ->> 'review_state')::public.receipt_item_review_state, 'reviewed') as review_state,
      nullif(trim(input.line ->> 'name'), '') as name,
      (input.line ->> 'qty_value')::numeric(10, 3) as qty_value,
      nullif(trim(input.line ->> 'qty_unit'), '')::public.item_qty_unit as qty_unit,
      nullif(trim(input.line ->> 'category_id'), '') as category_id
    from jsonb_array_elements(p_lines) with ordinality as input(line, ordinality)
    where not (input.line ? 'id')
       or nullif(trim(input.line ->> 'id'), '') is null
  ) as manual_lines;

  update public.receipts
  set review_revision = review_revision + 1,
      review_status = case
        when exists (
          select 1
          from public.receipt_items
          where generation_id = p_generation_id
            and review_state = 'unresolved'
        ) then 'needs_review'::public.receipt_review_status
        else 'reviewed'::public.receipt_review_status
      end,
      reviewed_at = case
        when exists (
          select 1
          from public.receipt_items
          where generation_id = p_generation_id
            and review_state = 'unresolved'
        ) then null
        else v_now
      end,
      reviewed_by = case
        when exists (
          select 1
          from public.receipt_items
          where generation_id = p_generation_id
            and review_state = 'unresolved'
        ) then null
        else auth.uid()
      end
  where id = p_receipt_id
    and household_id = p_household_id;

  return public.get_receipt_review(p_household_id, p_receipt_id);
end;
$$;

revoke all on function public.get_receipt_review(uuid, uuid) from public, anon, authenticated;
grant execute on function public.get_receipt_review(uuid, uuid) to authenticated;

revoke all on function public.mark_receipt_parse_failed(uuid, uuid, uuid, integer) from public, anon, authenticated;
grant execute on function public.mark_receipt_parse_failed(uuid, uuid, uuid, integer) to authenticated;

revoke all on function public.promote_receipt_parse(uuid, uuid, uuid, integer, text, text, text, date, text, integer, jsonb) from public, anon, authenticated;
grant execute on function public.promote_receipt_parse(uuid, uuid, uuid, integer, text, text, text, date, text, integer, jsonb) to authenticated;

revoke all on function public.save_receipt_review(uuid, uuid, uuid, integer, jsonb) from public, anon, authenticated;
grant execute on function public.save_receipt_review(uuid, uuid, uuid, integer, jsonb) to authenticated;
