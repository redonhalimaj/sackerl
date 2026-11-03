-- SCKRL-914 (F3): inverse of 20261102225020_sckrl_912_placement_error_codes.sql.
-- REVIEWED, NOT APPLIED. Emergency rollback only, with explicit owner approval.
-- See docs/qa/sckrl-311-inverse-migration.md for preconditions and the full procedure.
--
-- SCKRL-912 only replaced two SCKRL-311 functions (same signatures, security definer and
-- search_path) and re-stated their existing grants. The inverse restores the exact SCKRL-311
-- bodies below, copied verbatim from 20261015100000_sckrl_311_atomic_receipt_placement.sql
-- (lines 104-152 and 336-601). Grants are unchanged by 912; they are re-stated here as no-ops.
-- Run this file before sckrl_311_inverse.sql. Run with psql -v ON_ERROR_STOP=1 (no -1 needed).

begin;

do $$
begin
  if to_regprocedure('public.finalize_receipt_placement(uuid, uuid, uuid, integer, uuid, jsonb)') is null
    or to_regprocedure('public.guard_item_receipt_lineage()') is null then
    raise exception 'SCKRL-912 inverse: SCKRL-311/912 placement functions are not installed; aborting.';
  end if;
end $$;

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


revoke all on function public.guard_item_receipt_lineage() from public, anon, authenticated, service_role;
revoke all on function public.finalize_receipt_placement(uuid, uuid, uuid, integer, uuid, jsonb) from public, anon, service_role;
grant execute on function public.finalize_receipt_placement(uuid, uuid, uuid, integer, uuid, jsonb) to authenticated;

commit;
