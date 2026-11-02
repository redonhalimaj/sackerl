-- SCKRL-311: atomic, idempotent conversion of a reviewed receipt into household stock.
-- Source only. Applying/replaying this migration requires separate authorization.
-- Frozen contract: COUNCIL-20261015-02 placement v1.

alter table public.items
  add column source_receipt_item_id uuid;

alter table public.items
  add constraint items_source_receipt_item_key unique (source_receipt_item_id),
  add constraint items_source_receipt_item_fk
    foreign key (source_receipt_item_id)
    references public.receipt_items (id)
    on delete set null;

create table public.receipt_placements (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null,
  receipt_id uuid not null,
  generation_id uuid not null,
  review_revision integer not null check (review_revision >= 0),
  idempotency_key uuid not null,
  normalized_input jsonb not null,
  placed_by uuid not null,
  placed_at timestamptz not null,
  result jsonb not null,
  constraint receipt_placements_receipt_key unique (receipt_id),
  constraint receipt_placements_household_key unique (household_id, idempotency_key),
  constraint receipt_placements_receipt_fk foreign key (receipt_id, household_id)
    references public.receipts (id, household_id) on delete cascade,
  constraint receipt_placements_generation_fk foreign key (generation_id, receipt_id, household_id)
    references public.receipt_parse_generations (id, receipt_id, household_id) on delete cascade,
  constraint receipt_placements_id_household_key unique (id, household_id),
  constraint receipt_placements_input_object check (jsonb_typeof(normalized_input) = 'object'),
  constraint receipt_placements_result_object check (jsonb_typeof(result) = 'object')
);

create table public.inventory_acquisition_events (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  item_id uuid not null,
  placement_id uuid,
  receipt_id uuid,
  source_receipt_item_id uuid,
  quantity_delta numeric(10, 3) not null check (quantity_delta > 0),
  qty_unit public.item_qty_unit not null,
  zone_id uuid not null,
  actor_id uuid not null,
  occurred_at timestamptz not null,
  idempotency_key uuid not null,
  constraint inventory_acquisition_events_item_fk foreign key (item_id, household_id)
    references public.items (id, household_id) on delete cascade,
  constraint inventory_acquisition_events_placement_fk foreign key (placement_id)
    references public.receipt_placements (id) on delete set null deferrable initially deferred,
  constraint inventory_acquisition_events_receipt_fk foreign key (receipt_id)
    references public.receipts (id) on delete set null,
  constraint inventory_acquisition_events_line_fk foreign key (source_receipt_item_id)
    references public.receipt_items (id) on delete set null,
  constraint inventory_acquisition_events_item_key unique (item_id),
  constraint inventory_acquisition_events_line_key unique (source_receipt_item_id),
  constraint inventory_acquisition_events_kind check (quantity_delta > 0)
);

create index inventory_acquisition_events_household_time_idx
  on public.inventory_acquisition_events (household_id, occurred_at desc, id desc);

alter table public.receipt_placements enable row level security;
alter table public.inventory_acquisition_events enable row level security;

create policy "Household members can view receipt placements"
  on public.receipt_placements for select
  using (public.is_household_member(household_id));
create policy "Household members can view acquisition events"
  on public.inventory_acquisition_events for select
  using (public.is_household_member(household_id));

revoke all on table public.receipt_placements from public, anon, authenticated, service_role;
grant select on table public.receipt_placements to authenticated;
revoke all on table public.inventory_acquisition_events from public, anon, authenticated, service_role;
grant select on table public.inventory_acquisition_events to authenticated;
-- Keep every prior explicit item write column while making receipt lineage server-owned.
revoke insert, update on table public.items from public, anon, authenticated, service_role;
grant insert (
  id, household_id, name, qty_value, qty_unit, category_id, zone_id, expires_on, added_on,
  removed_on, source, removal_reason, expiry_fact_id, expiry_source, expiry_origin,
  expiry_printed_marking, expiry_confirmed_at, expiry_declaration
) on public.items to authenticated;
grant update (
  id, household_id, name, qty_value, qty_unit, category_id, zone_id, expires_on, added_on,
  removed_on, source, removal_reason, expiry_fact_id, expiry_source, expiry_origin,
  expiry_printed_marking, expiry_confirmed_at, expiry_declaration
) on public.items to authenticated;
grant insert (
  id, household_id, name, qty_value, qty_unit, category_id, zone_id, expires_on, added_on,
  removed_on, source, removal_reason, expiry_fact_id, expiry_source, expiry_origin,
  expiry_printed_marking, expiry_confirmed_at, expiry_declaration
) on public.items to service_role;
grant update (
  id, household_id, name, qty_value, qty_unit, category_id, zone_id, expires_on, added_on,
  removed_on, source, removal_reason, expiry_fact_id, expiry_source, expiry_origin,
  expiry_printed_marking, expiry_confirmed_at, expiry_declaration
) on public.items to service_role;
grant delete, select on table public.items to authenticated, service_role;

create or replace function public.guard_item_receipt_lineage()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_receipt_household uuid;
begin
  if tg_op = 'UPDATE' and old.source_receipt_item_id is not null
    and new.household_id is distinct from old.household_id then
    raise sqlstate 'PT409' using message = 'Linked receipt stock cannot change households.';
  end if;

  if tg_op = 'UPDATE' and old.source_receipt_item_id is not null
    and new.source_receipt_item_id is null
    and not exists (select 1 from public.receipt_items ri where ri.id = old.source_receipt_item_id)
  then
    -- The single-column FK's ON DELETE SET NULL is the only allowed lineage clearing.
    if new.household_id <> old.household_id or new.source <> 'receipt' then
      raise sqlstate 'PT409' using message = 'Receipt stock lineage is immutable.';
    end if;
    return new;
  end if;

  if new.source_receipt_item_id is not null then
    select ri.household_id into v_receipt_household
    from public.receipt_items ri where ri.id = new.source_receipt_item_id;
    if not found or v_receipt_household <> new.household_id or new.source <> 'receipt' then
      raise sqlstate 'PT422' using message = 'Receipt stock lineage must belong to the same household.', detail = '{"code":"RECEIPT_LINEAGE_REQUIRED"}';
    end if;
  end if;

  if tg_op = 'INSERT' then
    if new.source = 'receipt' and new.source_receipt_item_id is null then
      raise sqlstate 'PT422' using message = 'New receipt stock requires protected receipt lineage.', detail = '{"code":"RECEIPT_LINEAGE_REQUIRED"}';
    end if;
  else
    if old.source_receipt_item_id is not null
      and new.source_receipt_item_id is distinct from old.source_receipt_item_id then
      raise sqlstate 'PT409' using message = 'Receipt stock lineage cannot be reassigned.';
    end if;
    if old.source <> 'receipt' and new.source = 'receipt' and new.source_receipt_item_id is null then
      raise sqlstate 'PT422' using message = 'Receipt stock requires protected receipt lineage.', detail = '{"code":"RECEIPT_LINEAGE_REQUIRED"}';
    end if;
  end if;
  return new;
end;
$$;

create trigger guard_item_receipt_lineage_on_write
  before insert or update on public.items
  for each row execute function public.guard_item_receipt_lineage();

-- Protect receipt source snapshots and serialize all mutation paths on their receipt row.
create or replace function public.guard_placed_receipt_header()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if exists (select 1 from public.receipt_placements p where p.receipt_id = old.id) then
    raise sqlstate 'PT409' using message = 'Receipt has already been placed.', detail = '{"code":"RECEIPT_ALREADY_PLACED"}';
  end if;
  return new;
end; $$;

create trigger guard_placed_receipt_header_on_update
  before update on public.receipts for each row execute function public.guard_placed_receipt_header();

create or replace function public.guard_placed_receipt_line()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare v_receipt_id uuid;
begin
  v_receipt_id := case when tg_op = 'DELETE' then old.receipt_id else new.receipt_id end;
  if tg_op = 'INSERT' then
    perform 1 from public.receipts r where r.id = new.receipt_id for update;
  elsif tg_op = 'DELETE' then
    perform 1 from public.receipts r where r.id = old.receipt_id for update;
  else
    perform 1 from public.receipts r where r.id in (old.receipt_id,new.receipt_id)
      order by r.id for update;
  end if;
  if (exists (select 1 from public.receipt_placements p where p.receipt_id = v_receipt_id)
      and (tg_op <> 'DELETE' or exists (select 1 from public.receipts r where r.id = old.receipt_id)))
    or (tg_op = 'UPDATE' and exists (
      select 1 from public.receipt_placements p where p.receipt_id = old.receipt_id
    )) then
    raise sqlstate 'PT409' using message = 'Receipt has already been placed.', detail = '{"code":"RECEIPT_ALREADY_PLACED"}';
  end if;
  if tg_op = 'DELETE' then return old; else return new; end if;
end; $$;

create trigger guard_placed_receipt_line_on_write
  before insert or update or delete on public.receipt_items
  for each row execute function public.guard_placed_receipt_line();

create or replace function public.guard_placed_receipt_generation()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare v_receipt_id uuid;
begin
  v_receipt_id := case when tg_op = 'DELETE' then old.receipt_id else new.receipt_id end;
  if tg_op = 'INSERT' then
    perform 1 from public.receipts r where r.id = new.receipt_id for update;
  elsif tg_op = 'DELETE' then
    perform 1 from public.receipts r where r.id = old.receipt_id for update;
  else
    perform 1 from public.receipts r where r.id in (old.receipt_id,new.receipt_id)
      order by r.id for update;
  end if;
  if (exists (select 1 from public.receipt_placements p where p.receipt_id = v_receipt_id)
      and (tg_op <> 'DELETE' or exists (select 1 from public.receipts r where r.id = old.receipt_id)))
    or (tg_op = 'UPDATE' and exists (
      select 1 from public.receipt_placements p where p.receipt_id = old.receipt_id
    )) then
    raise sqlstate 'PT409' using message = 'Receipt has already been placed.', detail = '{"code":"RECEIPT_ALREADY_PLACED"}';
  end if;
  if tg_op = 'DELETE' then return old; else return new; end if;
end; $$;

create trigger guard_placed_receipt_generation_on_write
  before insert or update or delete on public.receipt_parse_generations
  for each row execute function public.guard_placed_receipt_generation();

-- Publicly callable legacy RPCs become wrappers; implementation functions are internal only.
alter function public.save_receipt_review(uuid, uuid, uuid, integer, jsonb)
  rename to save_receipt_review_before_311;
alter function public.promote_receipt_parse(uuid, uuid, uuid, integer, text, text, text, date, text, integer, jsonb)
  rename to promote_receipt_parse_before_311;
alter function public.mark_receipt_parse_failed(uuid, uuid, uuid, integer)
  rename to mark_receipt_parse_failed_before_311;

create or replace function public.assert_receipt_unplaced(p_household_id uuid, p_receipt_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if auth.uid() is null then raise sqlstate 'PT401' using message = 'Authentication is required.'; end if;
  perform 1 from public.household_members hm where hm.household_id = p_household_id and hm.user_id = auth.uid() for key share;
  if not found then raise sqlstate 'PT403' using message = 'Household access is required.'; end if;
  perform 1 from public.receipts r where r.id = p_receipt_id and r.household_id = p_household_id for update;
  if not found then raise sqlstate 'PT404' using message = 'Receipt not found.'; end if;
  if exists (select 1 from public.receipt_placements p where p.receipt_id = p_receipt_id) then
    raise sqlstate 'PT409' using message = 'Receipt has already been placed.', detail = '{"code":"RECEIPT_ALREADY_PLACED"}';
  end if;
end; $$;

create or replace function public.save_receipt_review(p_household_id uuid, p_receipt_id uuid, p_generation_id uuid, p_expected_review_revision integer, p_lines jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform public.assert_receipt_unplaced(p_household_id, p_receipt_id);
  return public.save_receipt_review_before_311(p_household_id, p_receipt_id, p_generation_id, p_expected_review_revision, p_lines);
end; $$;

create or replace function public.promote_receipt_parse(p_household_id uuid, p_receipt_id uuid, p_expected_active_generation_id uuid, p_expected_review_revision integer, p_parser_version text, p_provider text, p_currency text, p_purchased_on date, p_store_name text, p_total_cents integer, p_items jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform public.assert_receipt_unplaced(p_household_id, p_receipt_id);
  return public.promote_receipt_parse_before_311(p_household_id, p_receipt_id, p_expected_active_generation_id, p_expected_review_revision, p_parser_version, p_provider, p_currency, p_purchased_on, p_store_name, p_total_cents, p_items);
end; $$;

create or replace function public.mark_receipt_parse_failed(p_household_id uuid, p_receipt_id uuid, p_expected_active_generation_id uuid, p_expected_review_revision integer)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform public.assert_receipt_unplaced(p_household_id, p_receipt_id);
  return public.mark_receipt_parse_failed_before_311(p_household_id, p_receipt_id, p_expected_active_generation_id, p_expected_review_revision);
end; $$;

revoke all on function public.save_receipt_review_before_311(uuid, uuid, uuid, integer, jsonb) from public, anon, authenticated, service_role;
revoke all on function public.promote_receipt_parse_before_311(uuid, uuid, uuid, integer, text, text, text, date, text, integer, jsonb) from public, anon, authenticated, service_role;
revoke all on function public.mark_receipt_parse_failed_before_311(uuid, uuid, uuid, integer) from public, anon, authenticated, service_role;
revoke all on function public.assert_receipt_unplaced(uuid, uuid) from public, anon, authenticated, service_role;

revoke all on function public.save_receipt_review(uuid, uuid, uuid, integer, jsonb) from public, anon, service_role;
revoke all on function public.promote_receipt_parse(uuid, uuid, uuid, integer, text, text, text, date, text, integer, jsonb) from public, anon, service_role;
revoke all on function public.mark_receipt_parse_failed(uuid, uuid, uuid, integer) from public, anon, service_role;
grant execute on function public.save_receipt_review(uuid, uuid, uuid, integer, jsonb) to authenticated;
grant execute on function public.promote_receipt_parse(uuid, uuid, uuid, integer, text, text, text, date, text, integer, jsonb) to authenticated;
grant execute on function public.mark_receipt_parse_failed(uuid, uuid, uuid, integer) to authenticated;

create or replace function public.guard_receipt_placement_immutable()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if tg_op = 'DELETE'
    and (not exists (select 1 from public.receipts r where r.id = old.receipt_id)
      or not exists (select 1 from public.households h where h.id = old.household_id)) then
    return old;
  end if;
  raise sqlstate 'PT409' using message = 'Committed receipt placement is immutable.';
end; $$;

create trigger guard_receipt_placement_update
  before update or delete on public.receipt_placements
  for each row execute function public.guard_receipt_placement_immutable();

create or replace function public.guard_acquisition_event_immutable()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if tg_op = 'DELETE' then
    -- Item/household deletion is the documented retention boundary.
    if not exists (select 1 from public.items i where i.id = old.item_id)
      or not exists (select 1 from public.households h where h.id = old.household_id) then return old; end if;
    raise sqlstate 'PT409' using message = 'Acquisition events are immutable.';
  end if;

  -- Parent deletion may clear nullable references, but no event facts may be edited.
  if new.id is distinct from old.id
    or new.household_id is distinct from old.household_id
    or new.item_id is distinct from old.item_id
    or new.quantity_delta is distinct from old.quantity_delta
    or new.qty_unit is distinct from old.qty_unit
    or new.zone_id is distinct from old.zone_id
    or new.actor_id is distinct from old.actor_id
    or new.occurred_at is distinct from old.occurred_at
    or new.idempotency_key is distinct from old.idempotency_key
    or (new.placement_id is distinct from old.placement_id and not (
      old.placement_id is not null and new.placement_id is null
      and not exists (select 1 from public.receipt_placements p where p.id = old.placement_id)
    ))
    or (new.receipt_id is distinct from old.receipt_id and not (
      old.receipt_id is not null and new.receipt_id is null
      and not exists (select 1 from public.receipts r where r.id = old.receipt_id)
    ))
    or (new.source_receipt_item_id is distinct from old.source_receipt_item_id and not (
      old.source_receipt_item_id is not null and new.source_receipt_item_id is null
      and not exists (select 1 from public.receipt_items ri where ri.id = old.source_receipt_item_id)
    ))
  then
    raise sqlstate 'PT409' using message = 'Acquisition events are immutable.';
  end if;
  return new;
end; $$;

create trigger guard_acquisition_event_immutable_on_write
  before update or delete on public.inventory_acquisition_events
  for each row execute function public.guard_acquisition_event_immutable();

-- Canonical commit command. All provisional writes are in this function's transaction.
create or replace function public.finalize_receipt_placement(
  p_household_id uuid,
  p_receipt_id uuid,
  p_generation_id uuid,
  p_expected_review_revision integer,
  p_idempotency_key uuid,
  p_assignments jsonb
)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_user_id uuid := auth.uid();
  v_receipt public.receipts%rowtype;
  v_existing public.receipt_placements%rowtype;
  v_key_owner public.receipt_placements%rowtype;
  v_assignment_count integer;
  v_assignment_id_count integer;
  v_included_count integer;
  v_now timestamptz;
  v_zone text;
  v_added_on date;
  v_normalized jsonb;
  v_result jsonb;
  v_items jsonb;
  v_item record;
  v_item_row public.items%rowtype;
  v_zone_lock_id uuid;
  v_event_id uuid;
  v_invalid_line_id uuid;
  v_invalid_field text;
  v_constraint_name text;
  v_placement_id uuid := gen_random_uuid();
begin
  if v_user_id is null then
    raise sqlstate 'PT401' using message = 'Authentication is required.', detail = '{"code":"AUTH_REQUIRED"}';
  end if;
  if p_household_id is null or p_receipt_id is null or p_generation_id is null
    or p_idempotency_key is null or p_expected_review_revision is null or p_expected_review_revision < 0
    or p_assignments is null or jsonb_typeof(p_assignments) <> 'array' then
    raise sqlstate 'PT400' using message = 'Placement input is invalid.', detail = '{"code":"INVALID_PLACEMENT_INPUT"}';
  end if;
  if jsonb_array_length(p_assignments) > 150 then
    raise sqlstate 'PT400' using message = 'Placement contains too many assignments.', detail = '{"code":"INVALID_PLACEMENT_INPUT"}';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_assignments) a(value)
    where case when jsonb_typeof(a.value) <> 'object' then true else
      (select count(*) from jsonb_object_keys(a.value)) <> 2
      or not (a.value ? 'receiptItemId') or not (a.value ? 'zoneId')
      or jsonb_typeof(a.value->'receiptItemId') <> 'string'
      or jsonb_typeof(a.value->'zoneId') <> 'string'
      or coalesce(a.value->>'receiptItemId','') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      or coalesce(a.value->>'zoneId','') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    end
  ) then
    raise sqlstate 'PT400' using message = 'Placement assignments must contain only UUID receiptItemId and zoneId fields.', detail = '{"code":"INVALID_PLACEMENT_INPUT"}';
  end if;
  select count(*), count(distinct lower(value->>'receiptItemId'))
    into v_assignment_count, v_assignment_id_count
  from jsonb_array_elements(p_assignments) a(value);
  if v_assignment_count <> v_assignment_id_count then
    raise sqlstate 'PT400' using message = 'Placement contains duplicate receipt lines.', detail = '{"code":"INVALID_PLACEMENT_INPUT"}';
  end if;

  perform 1 from public.household_members hm
   where hm.household_id = p_household_id and hm.user_id = v_user_id
   for key share;
  if not found then
    raise sqlstate 'PT403' using message = 'Household access is required.', detail = '{"code":"HOUSEHOLD_ACCESS_REQUIRED"}';
  end if;

  select * into v_receipt from public.receipts r
   where r.id = p_receipt_id and r.household_id = p_household_id for update;
  if not found then
    raise sqlstate 'PT404' using message = 'Receipt not found.', detail = '{"code":"RECEIPT_NOT_FOUND"}';
  end if;

  select * into v_key_owner from public.receipt_placements p
   where p.household_id = p_household_id and p.idempotency_key = p_idempotency_key;
  if found and v_key_owner.receipt_id <> p_receipt_id then
    raise sqlstate 'PT409' using message = 'Placement key is already used for another receipt.', detail = '{"code":"PLACEMENT_KEY_REUSED"}';
  end if;

  select * into v_existing from public.receipt_placements p where p.receipt_id = p_receipt_id;
  if found then
    if v_existing.idempotency_key = p_idempotency_key then
      select jsonb_build_object(
        'householdId', p_household_id, 'receiptId', p_receipt_id,
        'generationId', p_generation_id, 'expectedReviewRevision', p_expected_review_revision,
        'assignments', coalesce(jsonb_agg(jsonb_build_object(
          'receiptItemId', lower(a.value->>'receiptItemId')::uuid,
          'zoneId', lower(a.value->>'zoneId')::uuid
        ) order by lower(a.value->>'receiptItemId')), '[]'::jsonb)
      ) into v_normalized
      from jsonb_array_elements(p_assignments) a(value);
      if v_existing.normalized_input = v_normalized then
        return jsonb_build_object('outcome','replayed','placement',v_existing.result);
      end if;
      raise sqlstate 'PT409' using message = 'Placement key was used with different input.', detail = '{"code":"PLACEMENT_KEY_REUSED"}';
    end if;
    return jsonb_build_object('outcome','already_placed','placement',v_existing.result);
  end if;

  select jsonb_build_object(
    'householdId', p_household_id, 'receiptId', p_receipt_id,
    'generationId', p_generation_id, 'expectedReviewRevision', p_expected_review_revision,
    'assignments', coalesce(jsonb_agg(jsonb_build_object(
      'receiptItemId', lower(a.value->>'receiptItemId')::uuid,
      'zoneId', lower(a.value->>'zoneId')::uuid
    ) order by lower(a.value->>'receiptItemId')), '[]'::jsonb)
  ) into v_normalized
  from jsonb_array_elements(p_assignments) a(value);

  select count(*) into v_included_count from public.receipt_items ri
   where ri.receipt_id = p_receipt_id and ri.household_id = p_household_id
     and ri.generation_id = v_receipt.active_parse_generation_id and ri.included;
  if v_receipt.active_parse_generation_id <> p_generation_id
    or v_receipt.review_revision <> p_expected_review_revision then
    raise sqlstate 'PT409' using message = 'Receipt review changed.', detail = '{"code":"STALE_RECEIPT_REVIEW"}';
  end if;
  if v_receipt.review_revision = 0 or v_receipt.active_parse_generation_id is null then
    raise sqlstate 'PT422' using message = 'Receipt has no saved active review.', detail = '{"code":"RECEIPT_NOT_REVIEWED"}';
  end if;
  if v_included_count = 0 then
    raise sqlstate 'PT422' using message = 'An empty receipt cannot be placed.', detail = '{"code":"EMPTY_RECEIPT_PLACEMENT"}';
  end if;
  if exists (
    select 1 from public.receipt_items ri
     where ri.receipt_id = p_receipt_id and ri.household_id = p_household_id
       and ri.generation_id = p_generation_id and ri.included
       and ri.review_state <> 'reviewed'
  ) then
    raise sqlstate 'PT422' using message = 'Included receipt lines must be reviewed.', detail = '{"code":"RECEIPT_NOT_REVIEWED"}';
  end if;
  if v_assignment_count <> v_included_count or exists (
    select 1 from (
      select ri.id from public.receipt_items ri
      where ri.receipt_id = p_receipt_id and ri.household_id = p_household_id
        and ri.generation_id = p_generation_id and ri.included
    ) ri
    full join (select lower(value->>'receiptItemId')::uuid id from jsonb_array_elements(p_assignments) a(value)) a
      on a.id = ri.id
    where (ri.id is not null) is distinct from (a.id is not null)
  ) then
    raise sqlstate 'PT422' using message = 'Assignments must match the active included lines exactly.', detail = '{"code":"PLACEMENT_LINE_SET_MISMATCH"}';
  end if;
  select ri.id,
    case
      when nullif(trim(coalesce(ri.corrected_name,ri.inferred_name)), '') is null then 'name'
      when coalesce(ri.corrected_qty_value,ri.qty_value) is null
        or coalesce(ri.corrected_qty_value,ri.qty_value) <= 0
        or coalesce(ri.corrected_qty_value,ri.qty_value)::text in ('NaN','Infinity','-Infinity') then 'qtyValue'
      when coalesce(ri.corrected_qty_unit,ri.qty_unit) is null then 'qtyUnit'
      else 'categoryId'
    end
  into v_invalid_line_id,v_invalid_field
  from public.receipt_items ri
  join (select lower(value->>'receiptItemId')::uuid id from jsonb_array_elements(p_assignments) a(value)) a on a.id = ri.id
  where nullif(trim(coalesce(ri.corrected_name,ri.inferred_name)), '') is null
     or coalesce(ri.corrected_qty_value,ri.qty_value) is null
     or coalesce(ri.corrected_qty_value,ri.qty_value) <= 0
     or coalesce(ri.corrected_qty_value,ri.qty_value)::text in ('NaN','Infinity','-Infinity')
     or coalesce(ri.corrected_qty_unit,ri.qty_unit) is null
     or coalesce(ri.corrected_category_id,ri.category_id) is null
     or not exists (select 1 from public.categories c where c.id = coalesce(ri.corrected_category_id,ri.category_id))
  order by ri.id limit 1;
  if found then
    raise sqlstate 'PT422' using message = 'An included receipt line has invalid resolved fields.',
      detail = jsonb_build_object('code','INVALID_PLACEMENT_LINE','field',v_invalid_field,'receiptItemId',v_invalid_line_id)::text;
  end if;

  -- Lock every existing candidate zone in UUID order before the authoritative check.
  -- A delete that wins before this lock is reported as INVALID_PLACEMENT_ZONE below;
  -- a delete that loses waits until this transaction commits.
  for v_zone_lock_id in
    select z.id
    from public.zones z
    join (
      select distinct lower(value->>'zoneId')::uuid id
      from jsonb_array_elements(p_assignments) a(value)
    ) assigned_zone on assigned_zone.id = z.id
    where z.household_id = p_household_id
    order by z.id
    for key share of z
  loop
    null;
  end loop;

  if exists (
    select 1
    from jsonb_array_elements(p_assignments) a(value)
    left join public.zones z on z.id=lower(a.value->>'zoneId')::uuid and z.household_id=p_household_id
    where z.id is null
  ) then
    select lower(a.value->>'receiptItemId')::uuid into v_invalid_line_id
    from jsonb_array_elements(p_assignments) a(value)
    left join public.zones z on z.id=lower(a.value->>'zoneId')::uuid and z.household_id=p_household_id
    where z.id is null order by lower(a.value->>'receiptItemId') limit 1;
    raise sqlstate 'PT422' using message = 'A placement zone is missing or belongs to another household.',
      detail = jsonb_build_object('code','INVALID_PLACEMENT_ZONE','field','zoneId','receiptItemId',v_invalid_line_id)::text;
  end if;

  select h.calendar_time_zone into v_zone from public.households h where h.id = p_household_id;
  v_now := clock_timestamp();
  v_added_on := (v_now at time zone v_zone)::date;
  v_items := '[]'::jsonb;

  -- The operation row is inserted last, but under the receipt lock no competing placement can pass.
  -- Item/event facts and canonical result are still one transaction; uniqueness handles household key races.
  for v_item in
    select ri.*, a.zone_id from public.receipt_items ri
    join (select lower(value->>'receiptItemId')::uuid receipt_item_id, lower(value->>'zoneId')::uuid zone_id from jsonb_array_elements(p_assignments) a(value)) a
      on a.receipt_item_id=ri.id
    where ri.receipt_id=p_receipt_id and ri.household_id=p_household_id and ri.generation_id=p_generation_id and ri.included
    order by ri.id
  loop
    insert into public.items (household_id,name,qty_value,qty_unit,category_id,zone_id,expires_on,added_on,source,source_receipt_item_id,expiry_declaration)
    values (
      p_household_id, coalesce(v_item.corrected_name,v_item.inferred_name),
      coalesce(v_item.corrected_qty_value,v_item.qty_value), coalesce(v_item.corrected_qty_unit,v_item.qty_unit),
      coalesce(v_item.corrected_category_id,v_item.category_id), v_item.zone_id,
      case when v_item.expiry_state='dated' then v_item.expiry_date else null end,
      v_added_on, 'receipt', v_item.id,
      case when v_item.expiry_state='unknown' then null else jsonb_build_object('source','user','confirm',false) end
    ) returning * into v_item_row;
    v_event_id := gen_random_uuid();
    insert into public.inventory_acquisition_events (
      id, household_id, item_id, placement_id, receipt_id, source_receipt_item_id,
      quantity_delta, qty_unit, zone_id, actor_id, occurred_at, idempotency_key
    ) values (
      v_event_id,p_household_id,v_item_row.id,v_placement_id,p_receipt_id,v_item.id,
      v_item_row.qty_value,v_item_row.qty_unit,v_item_row.zone_id,v_user_id,v_now,p_idempotency_key
    );
    v_items := coalesce(v_items,'[]'::jsonb) || jsonb_build_array(jsonb_build_object(
      'receiptItemId',v_item.id,'itemId',v_item_row.id,'acquisitionEventId',v_event_id,
      'name',v_item_row.name,'qtyValue',v_item_row.qty_value,'qtyUnit',v_item_row.qty_unit,
      'categoryId',v_item_row.category_id,'zoneId',v_item_row.zone_id,
      'expiresOn',v_item_row.expires_on,'expiryFactId',v_item_row.expiry_fact_id
    ));
  end loop;

  select jsonb_build_object(
    'placementId',v_placement_id,'householdId',p_household_id,'receiptId',p_receipt_id,
    'idempotencyKey',p_idempotency_key,'generationId',p_generation_id,
    'reviewRevision',p_expected_review_revision,'placedBy',v_user_id,
    'placedAt',to_char(v_now at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US') || '+00:00',
    'addedOn',v_added_on,'purchasedOn',v_receipt.purchased_on,'items',v_items
  ) into v_result;

  begin
    insert into public.receipt_placements (
      id,household_id,receipt_id,generation_id,review_revision,idempotency_key,
      normalized_input,placed_by,placed_at,result
    ) values (
      v_placement_id,p_household_id,p_receipt_id,p_generation_id,p_expected_review_revision,
      p_idempotency_key,v_normalized,v_user_id,v_now,v_result
    );
  exception when unique_violation then
    get stacked diagnostics v_constraint_name = constraint_name;
    if v_constraint_name = 'receipt_placements_household_key' then
      raise sqlstate 'PT409' using message = 'Placement key is already used.', detail = '{"code":"PLACEMENT_KEY_REUSED"}';
    end if;
    raise;
  end;
  return jsonb_build_object('outcome','placed','placement',v_result);
end; $$;

create or replace function public.get_receipt_placement(
  p_household_id uuid,
  p_receipt_id uuid,
  p_idempotency_key uuid default null
)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_placement public.receipt_placements%rowtype;
begin
  if auth.uid() is null then
    raise sqlstate 'PT401' using message = 'Authentication is required.', detail = '{"code":"AUTH_REQUIRED"}';
  end if;
  perform 1 from public.household_members hm
   where hm.household_id = p_household_id and hm.user_id = auth.uid() for key share;
  if not found then
    raise sqlstate 'PT403' using message = 'Household access is required.', detail = '{"code":"HOUSEHOLD_ACCESS_REQUIRED"}';
  end if;
  perform 1 from public.receipts r where r.id = p_receipt_id and r.household_id = p_household_id for share;
  if not found then
    raise sqlstate 'PT404' using message = 'Receipt not found.', detail = '{"code":"RECEIPT_NOT_FOUND"}';
  end if;
  select * into v_placement from public.receipt_placements p
   where p.household_id = p_household_id and p.receipt_id = p_receipt_id;
  if not found then
    return jsonb_build_object('state','unplaced','receiptId',p_receipt_id,'placement',null,'keyMatches',null);
  end if;
  return jsonb_build_object(
    'state','placed','receiptId',p_receipt_id,'placement',v_placement.result,
    'keyMatches',case when p_idempotency_key is null then null else p_idempotency_key = v_placement.idempotency_key end
  );
end; $$;

create or replace function public.list_unplaced_receipt_reviews(
  p_household_id uuid,
  p_page integer default 1,
  p_page_size integer default 25
)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_total bigint;
  v_receipts jsonb;
begin
  if auth.uid() is null then
    raise sqlstate 'PT401' using message = 'Authentication is required.', detail = '{"code":"AUTH_REQUIRED"}';
  end if;
  if p_page is null or p_page < 1 or p_page_size is null or p_page_size < 1 or p_page_size > 100 then
    raise sqlstate 'PT400' using message = 'Pagination values are invalid.', detail = '{"code":"INVALID_PLACEMENT_INPUT"}';
  end if;
  perform 1 from public.household_members hm
   where hm.household_id = p_household_id and hm.user_id = auth.uid() for key share;
  if not found then
    raise sqlstate 'PT403' using message = 'Household access is required.', detail = '{"code":"HOUSEHOLD_ACCESS_REQUIRED"}';
  end if;
  with eligible as materialized (
    select r.* from public.receipts r
    where r.household_id = p_household_id
      and r.active_parse_generation_id is not null
      and r.review_revision > 0
      and not exists (select 1 from public.receipt_placements p where p.receipt_id = r.id)
  ), counts as (
    select count(*)::bigint total from eligible
  ), page_rows as (
    select to_jsonb(e) row_data, e.updated_at, e.id from eligible e
    order by e.updated_at desc, e.id desc
    offset (p_page::bigint - 1) * p_page_size limit p_page_size
  )
  select counts.total,
    coalesce((select jsonb_agg(page_rows.row_data order by page_rows.updated_at desc, page_rows.id desc) from page_rows),'[]'::jsonb)
  into v_total,v_receipts from counts;
  return jsonb_build_object(
    'receipts',v_receipts,
    'pagination',jsonb_build_object('page',p_page,'pageSize',p_page_size,'total',v_total)
  );
end; $$;

revoke all on function public.finalize_receipt_placement(uuid, uuid, uuid, integer, uuid, jsonb) from public, anon, service_role;
revoke all on function public.get_receipt_placement(uuid, uuid, uuid) from public, anon, service_role;
revoke all on function public.list_unplaced_receipt_reviews(uuid, integer, integer) from public, anon, service_role;
grant execute on function public.finalize_receipt_placement(uuid, uuid, uuid, integer, uuid, jsonb) to authenticated;
grant execute on function public.get_receipt_placement(uuid, uuid, uuid) to authenticated;
grant execute on function public.list_unplaced_receipt_reviews(uuid, integer, integer) to authenticated;

revoke all on function public.guard_item_receipt_lineage() from public, anon, authenticated, service_role;
revoke all on function public.guard_placed_receipt_header() from public, anon, authenticated, service_role;
revoke all on function public.guard_placed_receipt_line() from public, anon, authenticated, service_role;
revoke all on function public.guard_placed_receipt_generation() from public, anon, authenticated, service_role;
revoke all on function public.guard_receipt_placement_immutable() from public, anon, authenticated, service_role;
revoke all on function public.guard_acquisition_event_immutable() from public, anon, authenticated, service_role;

comment on table public.receipt_placements is
  'SCKRL-311 immutable one-row-per-receipt placement command, normalized input and original result.';
comment on table public.inventory_acquisition_events is
  'SCKRL-311 immutable acquisition facts created atomically with initial receipt placement.';
comment on column public.items.source_receipt_item_id is
  'Protected unique receipt-line lineage for atomic receipt placement; never client writable.';



