-- SCKRL-312: optional durable receipt-line expiry choices.
-- Source implementation only. Do not apply or replay without the applicable authorization.
-- Extends SCKRL-310's existing guarded save; no stock conversion or placement is implemented here.
-- See COUNCIL-20260930-01 v2 and ADR-0001's 2026-09-30 addendum.

do $$
begin
  create type public.receipt_item_expiry_state as enum ('unknown', 'dated', 'no_date');
exception
  when duplicate_object then null;
end $$;

alter table public.receipt_items
  add column if not exists expiry_state public.receipt_item_expiry_state not null default 'unknown',
  add column if not exists expiry_date date,
  add column if not exists expiry_changed_at timestamptz,
  add column if not exists expiry_changed_by uuid;

alter table public.receipt_items
  add constraint receipt_items_expiry_choice_check check (
    (expiry_state = 'dated' and expiry_date is not null
      and expiry_date between date '0001-01-01' and date '9999-12-31')
    or (expiry_state in ('unknown', 'no_date') and expiry_date is null)
  ),
  add constraint receipt_items_expiry_attribution_check check (
    (expiry_changed_at is null) = (expiry_changed_by is null)
    and (expiry_state = 'unknown' or expiry_changed_by is not null)
  );

comment on column public.receipt_items.expiry_state is
  'SCKRL-312 review choice: unknown has no entered date; dated carries a user date; no_date is an intentional app no-date record, not package evidence.';
comment on column public.receipt_items.expiry_date is
  'SCKRL-312 Gregorian calendar date, present only for dated. Purchase date and parser confidence are never expiry evidence.';
comment on column public.receipt_items.expiry_changed_by is
  'Database-owned actor of the last actual expiry choice/date change, including reset; distinct from reviewer and stock confirmation.';
comment on column public.receipt_items.expiry_changed_at is
  'Database-owned time of the last actual expiry choice/date change; preserved on omitted/unchanged expiry saves.';

-- get_receipt_review already serializes full receipt_items rows, so it exposes these columns.
-- promote_receipt_parse omits them, retaining unknown/null defaults and immutable parser evidence.
-- SCKRL-311 will separately add placement status, atomic conversion and placed-review guards.

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
  v_line jsonb;
  v_expiry jsonb;
  v_expiry_state text;
  v_raw_date text;
  v_expiry_date date;
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

  -- Expiry is optional at the line boundary, but an explicit value is a strict state/date object.
  -- Validate the whole payload before any updates. Caller-owned attribution is never accepted.
  for v_line in select value from jsonb_array_elements(p_lines)
  loop
    if v_line ?| array['expiry_changed_by', 'expiry_changed_at', 'expiryChangedBy', 'expiryChangedAt'] then
      raise sqlstate 'PT400' using message = 'Receipt expiry attribution is server-owned.';
    end if;

    if not (v_line ? 'expiry') then
      continue;
    end if;

    v_expiry := v_line -> 'expiry';

    if jsonb_typeof(v_expiry) is distinct from 'object' then
      raise sqlstate 'PT400' using message = 'Receipt expiry must be a state/date object.';
    end if;

    if not (v_expiry ? 'state') or not (v_expiry ? 'date')
      or exists (
        select 1 from jsonb_object_keys(v_expiry) as expiry_key
        where expiry_key not in ('state', 'date')
      )
    then
      raise sqlstate 'PT400' using message = 'Receipt expiry requires only a valid state and date.';
    end if;

    v_expiry_state := v_expiry ->> 'state';

    if jsonb_typeof(v_expiry -> 'state') is distinct from 'string'
      or v_expiry_state not in ('unknown', 'dated', 'no_date')
    then
      raise sqlstate 'PT400' using message = 'Receipt expiry state is invalid.';
    end if;

    if v_expiry_state = 'dated' then
      v_raw_date := v_expiry ->> 'date';

      if jsonb_typeof(v_expiry -> 'date') is distinct from 'string'
        or v_raw_date !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
      then
        raise sqlstate 'PT400' using message = 'Receipt expiry must be a real date in YYYY-MM-DD format.';
      end if;

      begin
        v_expiry_date := v_raw_date::date;
      exception
        when invalid_datetime_format or datetime_field_overflow then
          raise sqlstate 'PT400' using message = 'Receipt expiry must be a real date in YYYY-MM-DD format.';
      end;

      if v_expiry_date < date '0001-01-01' or v_expiry_date > date '9999-12-31'
        or to_char(v_expiry_date, 'YYYY-MM-DD') <> v_raw_date
      then
        raise sqlstate 'PT400' using message = 'Receipt expiry must be a real date in YYYY-MM-DD format.';
      end if;
    elsif jsonb_typeof(v_expiry -> 'date') is distinct from 'null' then
      raise sqlstate 'PT400' using message = 'Unknown or no-date receipt expiry requires a null date.';
    end if;
  end loop;

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
      expiry_state = normalized.expiry_state,
      expiry_date = normalized.expiry_date,
      expiry_changed_at = case
        when normalized.expiry_state is distinct from receipt_item.expiry_state
          or normalized.expiry_date is distinct from receipt_item.expiry_date
        then v_now
        else receipt_item.expiry_changed_at
      end,
      expiry_changed_by = case
        when normalized.expiry_state is distinct from receipt_item.expiry_state
          or normalized.expiry_date is distinct from receipt_item.expiry_date
        then auth.uid()
        else receipt_item.expiry_changed_by
      end,
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
          and normalized.expiry_state is not distinct from receipt_item.expiry_state
          and normalized.expiry_date is not distinct from receipt_item.expiry_date
        ) then receipt_item.corrected_at
        when (
          (normalized.name is not null and normalized.name is distinct from receipt_item.inferred_name)
          or (normalized.qty_value is not null and normalized.qty_value is distinct from receipt_item.qty_value)
          or (normalized.qty_unit is not null and normalized.qty_unit is distinct from receipt_item.qty_unit)
          or (normalized.category_id is not null and normalized.category_id is distinct from receipt_item.category_id)
          or normalized.expiry_state <> 'unknown'
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
          and normalized.expiry_state is not distinct from receipt_item.expiry_state
          and normalized.expiry_date is not distinct from receipt_item.expiry_date
        ) then receipt_item.corrected_by
        when (
          (normalized.name is not null and normalized.name is distinct from receipt_item.inferred_name)
          or (normalized.qty_value is not null and normalized.qty_value is distinct from receipt_item.qty_value)
          or (normalized.qty_unit is not null and normalized.qty_unit is distinct from receipt_item.qty_unit)
          or (normalized.category_id is not null and normalized.category_id is distinct from receipt_item.category_id)
          or normalized.expiry_state <> 'unknown'
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
          and normalized.expiry_state is not distinct from receipt_item.expiry_state
          and normalized.expiry_date is not distinct from receipt_item.expiry_date
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
          and normalized.expiry_state is not distinct from receipt_item.expiry_state
          and normalized.expiry_date is not distinct from receipt_item.expiry_date
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
      nullif(trim(line ->> 'category_id'), '') as category_id,
      case
        when line ? 'expiry' then (line #>> '{expiry,state}')::public.receipt_item_expiry_state
        else stored_item.expiry_state
      end as expiry_state,
      case
        when line ? 'expiry' then (line #>> '{expiry,date}')::date
        else stored_item.expiry_date
      end as expiry_date
    from jsonb_array_elements(p_lines) as input(line)
    inner join public.receipt_items as stored_item
      on stored_item.id = nullif(trim(line ->> 'id'), '')::uuid
     and stored_item.generation_id = p_generation_id
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
    expiry_state,
    expiry_date,
    expiry_changed_at,
    expiry_changed_by,
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
    manual_lines.expiry_state,
    manual_lines.expiry_date,
    case when manual_lines.expiry_state <> 'unknown' then v_now else null end,
    case when manual_lines.expiry_state <> 'unknown' then auth.uid() else null end,
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
      nullif(trim(input.line ->> 'category_id'), '') as category_id,
      coalesce((input.line #>> '{expiry,state}')::public.receipt_item_expiry_state, 'unknown') as expiry_state,
      (input.line #>> '{expiry,date}')::date as expiry_date
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

revoke all on table public.receipt_items from public, anon, authenticated;
grant select on table public.receipt_items to authenticated;
revoke all on function public.save_receipt_review(uuid, uuid, uuid, integer, jsonb)
  from public, anon, authenticated;
grant execute on function public.save_receipt_review(uuid, uuid, uuid, integer, jsonb)
  to authenticated;
