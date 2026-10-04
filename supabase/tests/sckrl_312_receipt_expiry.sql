-- SCKRL-312 guarded receipt expiry assertions. Source fixture only; do not execute without authorization.
-- Run after baseline migrations, 312 legacy seed, 312 migration and legacy assertion.
-- Disposable local database only. Synthetic mutations always roll back; no placement is exercised.
\set ON_ERROR_STOP on

begin;

create or replace function pg_temp.expect(condition boolean, message text)
returns void language plpgsql as $$
begin
  if condition is not true then raise exception '%', message; end if;
end;
$$;

-- Deliberately omit expiry: this reconstructs the pre-312 client payload from current values.
create or replace function pg_temp.review_lines(review jsonb)
returns jsonb language sql as $$
  select jsonb_agg(jsonb_build_object(
    'id', item ->> 'id', 'included', (item ->> 'included')::boolean,
    'review_state', item ->> 'review_state',
    'name', coalesce(item ->> 'corrected_name', item ->> 'inferred_name'),
    'qty_value', coalesce(item ->> 'corrected_qty_value', item ->> 'qty_value')::numeric,
    'qty_unit', coalesce(item ->> 'corrected_qty_unit', item ->> 'qty_unit'),
    'category_id', coalesce(item ->> 'corrected_category_id', item ->> 'category_id')
  ) order by ordinality)
  from jsonb_array_elements(review -> 'items') with ordinality as lines(item, ordinality)
$$;

do $$
begin
  perform pg_temp.expect(
    exists (select 1 from public.receipts where id = '31200000-0000-4000-8000-000000000100'),
    'Missing SCKRL-312 seed. Use one populated disposable replay; see supabase/tests/README.md.'
  );
end;
$$;

set local role authenticated;

do $$
declare
  v_household uuid := '31200000-0000-4000-8000-000000000010';
  v_receipt uuid := '31200000-0000-4000-8000-000000000100';
  v_owner uuid := '31200000-0000-4000-8000-000000000001';
  v_member uuid := '31200000-0000-4000-8000-000000000002';
  v_generation uuid;
  v_review jsonb;
  v_before jsonb;
  v_lines jsonb;
  v_bad jsonb;
  v_row public.receipt_items%rowtype;
  v_at timestamptz;
  v_stock_count bigint;
  v_fact_count bigint;
begin
  perform set_config('request.jwt.claim.sub', v_owner::text, true);
  v_review := public.get_receipt_review(v_household, v_receipt);
  v_generation := (v_review #>> '{receipt,active_parse_generation_id}')::uuid;
  select count(*) into v_stock_count from public.items where household_id = v_household;
  select count(*) into v_fact_count from public.item_expiry_facts where household_id = v_household;

  -- A valid leap-day date is a reviewer choice, independent of the receipt's purchase date/confidence.
  v_lines := jsonb_set(pg_temp.review_lines(v_review), '{0,expiry}',
    '{"state":"dated","date":"2024-02-29"}'::jsonb);
  v_review := public.save_receipt_review(v_household, v_receipt, v_generation, 1, v_lines);
  select * into strict v_row from public.receipt_items where id = (v_review #>> '{items,0,id}')::uuid;
  perform pg_temp.expect(v_row.expiry_state = 'dated' and v_row.expiry_date = date '2024-02-29'
    and v_row.expiry_changed_by = v_owner and v_row.expiry_changed_at is not null,
    'Date save failed to record the authenticated expiry editor');
  perform pg_temp.expect(v_row.raw_text = 'MILK 1L 1.49' and v_row.inferred_name = 'Milk'
    and v_row.confidence = 0.95, 'Expiry save changed immutable parser evidence');
  v_at := v_row.expiry_changed_at;

  -- Another member changing quantity reattributes review/correction, not expiry.
  perform set_config('request.jwt.claim.sub', v_member::text, true);
  v_lines := jsonb_set(pg_temp.review_lines(v_review), '{0,qty_value}', '2'::jsonb);
  v_review := public.save_receipt_review(v_household, v_receipt, v_generation, 2, v_lines);
  select * into strict v_row from public.receipt_items where id = (v_review #>> '{items,0,id}')::uuid;
  perform pg_temp.expect(v_row.expiry_state = 'dated' and v_row.expiry_date = date '2024-02-29'
    and v_row.expiry_changed_by = v_owner and v_row.expiry_changed_at = v_at
    and v_row.reviewed_by = v_member and v_row.corrected_by = v_member,
    'Omitted expiry or unrelated quantity save replaced the expiry editor');

  -- Explicitly repeating the same date also preserves original attribution.
  v_lines := jsonb_set(pg_temp.review_lines(v_review), '{0,expiry}',
    '{"state":"dated","date":"2024-02-29"}'::jsonb);
  v_before := v_review -> 'items';
  v_review := public.save_receipt_review(v_household, v_receipt, v_generation, 3, v_lines);
  perform pg_temp.expect(v_review -> 'items' = v_before,
    'Unchanged explicit expiry save rewrote row correction/review/expiry metadata');

  -- Expiry participates in review equality; the UI's unresolved declaration clears review metadata.
  v_lines := jsonb_set(pg_temp.review_lines(v_review), '{0,expiry}',
    '{"state":"no_date","date":null}'::jsonb);
  v_lines := jsonb_set(v_lines, '{0,review_state}', '"unresolved"'::jsonb);
  v_review := public.save_receipt_review(v_household, v_receipt, v_generation, 4, v_lines);
  select * into strict v_row from public.receipt_items where id = (v_review #>> '{items,0,id}')::uuid;
  perform pg_temp.expect(v_row.expiry_state = 'no_date' and v_row.expiry_date is null
    and v_row.expiry_changed_by = v_member and v_row.reviewed_by is null and v_row.reviewed_at is null
    and v_review #>> '{receipt,review_status}' = 'needs_review',
    'No-date change did not preserve its separate meaning or unresolved review state');

  -- Reset is distinct from deliberate no-date and is attributed even though it restores unknown.
  perform set_config('request.jwt.claim.sub', v_owner::text, true);
  v_lines := jsonb_set(pg_temp.review_lines(v_review), '{0,expiry}',
    '{"state":"unknown","date":null}'::jsonb);
  v_lines := jsonb_set(v_lines, '{0,review_state}', '"reviewed"'::jsonb);
  v_lines := jsonb_set(v_lines, '{1,expiry}', '{"state":"no_date","date":null}'::jsonb);
  v_lines := jsonb_set(v_lines, '{1,included}', 'false'::jsonb);
  v_review := public.save_receipt_review(v_household, v_receipt, v_generation, 5, v_lines);
  perform pg_temp.expect(v_review #>> '{items,0,expiry_state}' = 'unknown'
    and v_review #>> '{items,0,expiry_date}' is null
    and v_review #>> '{items,0,expiry_changed_by}' = v_owner::text
    and v_review #>> '{items,1,expiry_state}' = 'no_date'
    and v_review #>> '{receipt,review_status}' = 'reviewed',
    'Explicit reset/no-date choices were conflated or treated as missing-date blockers');

  -- Manual lines use the same contract; omitted expiry has no fabricated editor/evidence.
  v_lines := pg_temp.review_lines(v_review) || jsonb_build_array(
    jsonb_build_object('client_line_id', 'new-unknown', 'included', true, 'review_state', 'reviewed',
      'name', 'Rice', 'qty_value', 1, 'qty_unit', 'pcs', 'category_id', 'pantry'),
    jsonb_build_object('client_line_id', 'new-dated', 'included', true, 'review_state', 'reviewed',
      'name', 'Yoghurt', 'qty_value', 1, 'qty_unit', 'pcs', 'category_id', 'dairy',
      'expiry', jsonb_build_object('state', 'dated', 'date', '0001-01-01')),
    jsonb_build_object('client_line_id', 'new-no-date', 'included', true, 'review_state', 'reviewed',
      'name', 'Salt', 'qty_value', 1, 'qty_unit', 'pcs', 'category_id', 'spices',
      'expiry', jsonb_build_object('state', 'no_date', 'date', null))
  );
  v_review := public.save_receipt_review(v_household, v_receipt, v_generation, 6, v_lines);
  perform pg_temp.expect(exists (
    select 1 from public.receipt_items where generation_id = v_generation and client_line_id = 'new-unknown'
      and expiry_state = 'unknown' and expiry_date is null and expiry_changed_by is null
      and expiry_changed_at is null and raw_text is null and confidence is null
  ), 'Omitted new-manual expiry did not use unknown/null/unattributed defaults');
  perform pg_temp.expect(exists (
    select 1 from public.receipt_items where generation_id = v_generation and client_line_id = 'new-dated'
      and expiry_state = 'dated' and expiry_date = date '0001-01-01' and expiry_changed_by = v_owner
      and corrected_at is null and corrected_by is null
  ), 'Manual date or manual correction provenance is wrong');
  perform pg_temp.expect(exists (
    select 1 from public.receipt_items where generation_id = v_generation and client_line_id = 'new-no-date'
      and expiry_state = 'no_date' and expiry_date is null and expiry_changed_by = v_owner
  ), 'Manual no-date choice is wrong');

  -- Every invalid object rejects ALL line changes and the receipt revision.
  v_before := v_review;
  for v_bad in select value from jsonb_array_elements(jsonb_build_array(
    'null'::jsonb, '[]'::jsonb, '{}'::jsonb,
    '{"state":"unknown"}'::jsonb, '{"date":null}'::jsonb,
    '{"state":"cleared","date":null}'::jsonb, '{"state":true,"date":null}'::jsonb,
    '{"state":"unknown","date":"2026-09-30"}'::jsonb,
    '{"state":"no_date","date":""}'::jsonb, '{"state":"dated","date":null}'::jsonb,
    '{"state":"dated","date":20260930}'::jsonb,
    '{"state":"dated","date":"0000-01-01"}'::jsonb,
    '{"state":"dated","date":"1900-02-29"}'::jsonb,
    '{"state":"dated","date":"2026-02-29"}'::jsonb,
    '{"state":"dated","date":"2026-04-31"}'::jsonb,
    '{"state":"dated","date":"2026-13-01"}'::jsonb,
    '{"state":"dated","date":"2026-09-00"}'::jsonb,
    '{"state":"dated","date":"2026-9-30"}'::jsonb,
    '{"state":"dated","date":"2026-09-30T00:00:00Z"}'::jsonb,
    '{"state":"dated","date":"2026-09-30","source":"printed"}'::jsonb,
    '{"state":"no_date","date":null,"changedBy":"forged"}'::jsonb,
    '{"state":"no_date","date":null,"changedAt":"2026-01-01T00:00:00Z"}'::jsonb
  ))
  loop
    v_lines := jsonb_set(pg_temp.review_lines(v_review), '{0,name}', '"Must roll back"'::jsonb);
    v_lines := jsonb_set(v_lines, '{1,expiry}', v_bad);
    begin
      perform public.save_receipt_review(v_household, v_receipt, v_generation, 7, v_lines);
      raise exception 'Invalid receipt expiry accepted: %', v_bad;
    exception when sqlstate 'PT400' then null;
    end;
    perform pg_temp.expect(public.get_receipt_review(v_household, v_receipt) = v_before,
      'Invalid expiry changed another line or the receipt revision');
  end loop;

  for v_bad in select value from jsonb_array_elements(jsonb_build_array(
    '{"expiry_changed_by":"forged"}'::jsonb, '{"expiryChangedBy":"forged"}'::jsonb,
    '{"expiry_changed_at":"2026-01-01T00:00:00Z"}'::jsonb, '{"expiryChangedAt":"2026-01-01T00:00:00Z"}'::jsonb
  ))
  loop
    v_lines := pg_temp.review_lines(v_review);
    v_lines := jsonb_set(v_lines, '{0}', (v_lines -> 0) || v_bad);
    begin
      perform public.save_receipt_review(v_household, v_receipt, v_generation, 7, v_lines);
      raise exception 'Caller-owned expiry attribution accepted';
    exception when sqlstate 'PT400' then null;
    end;
    perform pg_temp.expect(public.get_receipt_review(v_household, v_receipt) = v_before,
      'Rejected forged actor/time changed the review');
  end loop;

  -- Stale revisions, generations and manual identities remain 310 conflicts.
  begin
    perform public.save_receipt_review(v_household, v_receipt, v_generation, 6, pg_temp.review_lines(v_review));
    raise exception 'Stale revision accepted';
  exception when sqlstate 'PT409' then null;
  end;
  begin
    perform public.save_receipt_review(v_household, v_receipt, '31200000-0000-4000-8000-000000000999', 7,
      pg_temp.review_lines(v_review));
    raise exception 'Stale generation accepted';
  exception when sqlstate 'PT409' then null;
  end;
  begin
    perform public.save_receipt_review(v_household, v_receipt, v_generation, 7,
      pg_temp.review_lines(v_review) || jsonb_build_array(jsonb_build_object(
        'client_line_id', 'new-unknown', 'included', true, 'review_state', 'reviewed', 'name', 'Duplicate',
        'qty_value', 1, 'qty_unit', 'pcs', 'category_id', 'pantry')));
    raise exception 'Duplicate manual identity accepted';
  exception when sqlstate 'PT409' then null;
  end;
  perform pg_temp.expect(public.get_receipt_review(v_household, v_receipt) = v_before,
    'Stale/duplicate save mutated a valid snapshot');

  -- A database failure after normalization rolls back earlier row changes too.
  v_lines := jsonb_set(pg_temp.review_lines(v_review), '{0,expiry}', '{"state":"dated","date":"9999-12-31"}'::jsonb);
  v_lines := jsonb_set(v_lines, '{1,category_id}', '"not-a-category"'::jsonb);
  begin
    perform public.save_receipt_review(v_household, v_receipt, v_generation, 7, v_lines);
    raise exception 'Invalid category accepted';
  exception when foreign_key_violation then null;
  end;
  perform pg_temp.expect(public.get_receipt_review(v_household, v_receipt) = v_before,
    'Failed database write left partial expiry/revision changes');
  perform pg_temp.expect((select count(*) from public.items where household_id = v_household) = v_stock_count
    and (select count(*) from public.item_expiry_facts where household_id = v_household) = v_fact_count,
    'Review choices, including excluded lines, created stock or expiry facts before placement');

  -- Even an all-excluded review can save; zero-stock placement validation belongs to SCKRL-311.
  select jsonb_agg(line || '{"included":false,"review_state":"reviewed"}'::jsonb order by ordinality)
    into v_lines from jsonb_array_elements(pg_temp.review_lines(v_review)) with ordinality as input(line, ordinality);
  v_lines := jsonb_set(v_lines, '{0,expiry}', '{"state":"dated","date":"9999-12-31"}'::jsonb);
  v_review := public.save_receipt_review(v_household, v_receipt, v_generation, 7, v_lines);
  perform pg_temp.expect(v_review #>> '{receipt,review_status}' = 'reviewed'
    and not exists (select 1 from public.receipt_items where generation_id = v_generation and included)
    and v_review #>> '{items,0,expiry_date}' = '9999-12-31',
    'All-excluded review or maximum Gregorian date was incorrectly blocked');

  -- Existing application-role revocations still protect every new column.
  begin
    update public.receipt_items set expiry_state = 'no_date', expiry_date = null
      where id = (v_review #>> '{items,0,id}')::uuid;
    raise exception 'Direct receipt expiry update accepted';
  exception when insufficient_privilege then null;
  end;
end;
$$;

-- New parser lines continue using defaults after the schema extension.
do $$
declare
  v_review jsonb;
  v_receipt_id uuid;
begin
  perform set_config('request.jwt.claim.sub', '31200000-0000-4000-8000-000000000001', true);
  insert into public.receipts (household_id, image_url, status, captured_at, currency)
  values ('31200000-0000-4000-8000-000000000010',
    'sackerl://receipt/sckrl-312-new-parser', 'uploaded', '2026-09-30T10:00:00Z', 'EUR')
  returning id into v_receipt_id;
  v_review := public.promote_receipt_parse('31200000-0000-4000-8000-000000000010',
    v_receipt_id, null, 0, 'fixture-parser-v1', 'fixture-provider',
    'EUR', '2026-09-30', 'S312 fixture', 149, jsonb_build_array(jsonb_build_object(
      'raw_text', 'MILK 1L 1.49', 'inferred_name', 'Milk', 'qty_value', 1,
      'qty_unit', 'l', 'category_id', 'dairy', 'confidence', 0.95, 'confidence_level', 'high')));
  perform pg_temp.expect(v_review #>> '{items,0,expiry_state}' = 'unknown'
    and v_review #>> '{items,0,expiry_date}' is null
    and v_review #>> '{items,0,expiry_changed_by}' is null
    and v_review #>> '{items,0,expiry_changed_at}' is null,
    'New parser line fabricated an expiry or expiry editor');
end;
$$;

do $$
begin
  perform set_config('request.jwt.claim.sub', '31200000-0000-4000-8000-000000000003', true);
  perform pg_temp.expect((select count(*) from public.receipt_items
    where household_id = '31200000-0000-4000-8000-000000000010') = 0,
    'Outsider can read another household expiry choices');
  begin
    perform public.get_receipt_review('31200000-0000-4000-8000-000000000010',
      '31200000-0000-4000-8000-000000000100');
    raise exception 'Outsider review read accepted';
  exception when sqlstate 'PT403' then null;
  end;
  begin
    perform public.save_receipt_review('31200000-0000-4000-8000-000000000010',
      '31200000-0000-4000-8000-000000000100', null, 7, '[]'::jsonb);
    raise exception 'Outsider review save accepted';
  exception when sqlstate 'PT403' then null;
  end;
  perform set_config('request.jwt.claim.sub', '', true);
  begin
    perform public.get_receipt_review('31200000-0000-4000-8000-000000000010',
      '31200000-0000-4000-8000-000000000100');
    raise exception 'Unauthenticated review read accepted';
  exception when sqlstate 'PT401' then null;
  end;
end;
$$;

reset role;
rollback;
\echo 'SCKRL-312 receipt expiry SQL checks passed'
