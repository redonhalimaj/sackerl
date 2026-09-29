-- SCKRL-310 command-path assertions. Apply after baseline migrations,
-- supabase/tests/sckrl_310_legacy_seed.sql, and the SCKRL-310 migration.
-- Disposable local database only; the fixture always rolls back its changes.
\set ON_ERROR_STOP on

begin;

delete from public.receipts where id = '31000000-0000-4000-8000-000000000310';

set check_function_bodies = on;

create or replace function pg_temp.expect(condition boolean, message text)
returns void
language plpgsql
as $$
begin
  if condition is not true then
    raise exception '%', message;
  end if;
end;
$$;

do $$
declare
  v_household_id uuid := '31000000-0000-4000-8000-000000000010';
  v_member_id uuid := '31000000-0000-4000-8000-000000000001';
  v_receipt_id uuid := '31000000-0000-4000-8000-000000000310';
  v_review jsonb;
  v_generation_id uuid;
  v_first_line_id uuid;
  v_second_line_id uuid;
  v_manual_line public.receipt_items%rowtype;
  v_first_line public.receipt_items%rowtype;
  v_receipt public.receipts%rowtype;
begin
  perform set_config('request.jwt.claim.sub', v_member_id::text, true);

  insert into public.receipts (
    id,
    household_id,
    image_url,
    status,
    captured_at,
    currency
  ) values (
    v_receipt_id,
    v_household_id,
    'sackerl://receipt/sckrl-310-command-fixture',
    'uploaded',
    '2026-09-10T10:00:00Z',
    'EUR'
  );

  select public.promote_receipt_parse(
    v_household_id,
    v_receipt_id,
    null,
    0,
    'fixture-parser-v1',
    'fixture-provider',
    'eur',
    '2026-09-10',
    'Command Fixture Market',
    398,
    jsonb_build_array(
      jsonb_build_object(
        'raw_text', 'MILK 1L 1.49',
        'inferred_name', 'Milk',
        'qty_value', 1,
        'qty_unit', 'l',
        'category_id', 'dairy',
        'confidence', 0.95,
        'confidence_level', 'high',
        'line_total_cents', null,
        'unit_price_cents', null,
        'discount_cents', null,
        'tax_cents', null
      ),
      jsonb_build_object(
        'raw_text', 'BREAD 1PCS 2.49',
        'inferred_name', 'Bread',
        'qty_value', 1,
        'qty_unit', 'pcs',
        'category_id', 'bakery',
        'confidence', 0.8,
        'confidence_level', 'mid',
        'line_total_cents', 249,
        'unit_price_cents', 249,
        'discount_cents', null,
        'tax_cents', null
      )
    )
  ) into v_review;

  v_generation_id := (v_review #>> '{receipt,active_parse_generation_id}')::uuid;
  v_first_line_id := (v_review #>> '{items,0,id}')::uuid;
  v_second_line_id := (v_review #>> '{items,1,id}')::uuid;

  perform pg_temp.expect(v_generation_id is not null, 'Promotion did not return an active generation');
  perform pg_temp.expect((v_review #>> '{receipt,review_revision}')::integer = 0, 'Promotion should reset review revision to 0');
  perform pg_temp.expect(v_review #>> '{items,0,review_state}' = 'unresolved', 'Parser lines must start unresolved');
  perform pg_temp.expect(v_review #>> '{items,0,inferred_line_total_cents}' is null, 'Unknown parser line total should remain null');

  begin
    perform public.promote_receipt_parse(
      v_household_id,
      v_receipt_id,
      null,
      0,
      'fixture-parser-v1',
      'fixture-provider',
      'EUR',
      '2026-09-10',
      'Stale Market',
      100,
      jsonb_build_array(
        jsonb_build_object(
          'raw_text', 'STALE 1PCS',
          'inferred_name', 'Stale',
          'qty_value', 1,
          'qty_unit', 'pcs',
          'category_id', 'pantry',
          'confidence', 0.7,
          'confidence_level', 'mid',
          'line_total_cents', null,
          'unit_price_cents', null,
          'discount_cents', null,
          'tax_cents', null
        )
      )
    );
    raise exception 'Stale promote did not fail';
  exception
    when sqlstate 'PT409' then null;
  end;

  select * into strict v_receipt from public.receipts where id = v_receipt_id;
  perform pg_temp.expect(v_receipt.active_parse_generation_id = v_generation_id, 'Stale promote changed the active generation');
  perform pg_temp.expect(v_receipt.store_name = 'Command Fixture Market', 'Stale promote changed receipt header data');

  begin
    perform public.save_receipt_review(
      v_household_id,
      v_receipt_id,
      v_generation_id,
      0,
      jsonb_build_array(
        jsonb_build_object(
          'id', v_first_line_id,
          'included', true,
          'review_state', 'reviewed',
          'name', 'Whole Milk',
          'qty_value', 1,
          'qty_unit', 'l',
          'category_id', 'dairy'
        )
      )
    );
    raise exception 'Missing active line save did not fail';
  exception
    when sqlstate 'PT409' then null;
  end;

  select public.save_receipt_review(
    v_household_id,
    v_receipt_id,
    v_generation_id,
    0,
    jsonb_build_array(
      jsonb_build_object(
        'id', v_first_line_id,
        'included', true,
        'review_state', 'reviewed',
        'name', 'Whole Milk',
        'qty_value', 1,
        'qty_unit', 'l',
        'category_id', 'dairy'
      ),
      jsonb_build_object(
        'id', v_second_line_id,
        'included', false,
        'review_state', 'reviewed',
        'name', 'Bread',
        'qty_value', 1,
        'qty_unit', 'pcs',
        'category_id', 'bakery'
      ),
      jsonb_build_object(
        'client_line_id', 'manual-apples-1',
        'included', true,
        'review_state', 'reviewed',
        'name', 'Apples',
        'qty_value', 1.5,
        'qty_unit', 'kg',
        'category_id', 'produce'
      )
    )
  ) into v_review;

  perform pg_temp.expect((v_review #>> '{receipt,review_revision}')::integer = 1, 'Save should increment review revision once');
  perform pg_temp.expect(v_review #>> '{receipt,review_status}' = 'reviewed', 'All reviewed lines should complete the receipt review');

  select * into strict v_first_line from public.receipt_items where id = v_first_line_id;
  perform pg_temp.expect(v_first_line.raw_text = 'MILK 1L 1.49', 'Save changed immutable raw parser text');
  perform pg_temp.expect(v_first_line.inferred_name = 'Milk', 'Save changed immutable inferred parser name');
  perform pg_temp.expect(v_first_line.corrected_name = 'Whole Milk', 'Corrected name was not stored');
  perform pg_temp.expect(v_first_line.corrected_at is not null, 'Correction timestamp was not stored');
  perform pg_temp.expect(v_first_line.corrected_by = v_member_id, 'Correction actor was not stored');

  select * into strict v_manual_line
  from public.receipt_items
  where generation_id = v_generation_id
    and client_line_id = 'manual-apples-1';
  perform pg_temp.expect(v_manual_line.source = 'manual', 'Manual line source was not stored');
  perform pg_temp.expect(v_manual_line.raw_text is null, 'Manual line should not fabricate raw text');
  perform pg_temp.expect(v_manual_line.inferred_name is null, 'Manual line should not fabricate parser evidence');
  perform pg_temp.expect(v_manual_line.qty_value is null, 'Manual line should not inherit parser quantity defaults');
  perform pg_temp.expect(v_manual_line.qty_unit is null, 'Manual line should not inherit parser unit defaults');
  perform pg_temp.expect(v_manual_line.category_id is null, 'Manual line should not fabricate parser category evidence');
  perform pg_temp.expect(v_manual_line.confidence is null, 'Manual line should not fabricate parser confidence evidence');
  perform pg_temp.expect(v_manual_line.confidence_level is null, 'Manual line should not fabricate parser confidence level');
  perform pg_temp.expect(v_manual_line.corrected_name = 'Apples', 'Manual line editable name was not stored');
  perform pg_temp.expect(v_manual_line.reviewed_by = v_member_id, 'Manual line review actor was not stored');
  perform pg_temp.expect(v_manual_line.inferred_line_total_cents is null, 'Manual line should not fabricate price evidence');

  begin
    perform public.save_receipt_review(
      v_household_id,
      v_receipt_id,
      v_generation_id,
      1,
      jsonb_build_array(
        jsonb_build_object(
          'id', v_first_line_id,
          'included', true,
          'review_state', 'reviewed',
          'name', 'Whole Milk',
          'qty_value', 1,
          'qty_unit', 'l',
          'category_id', 'dairy'
        ),
        jsonb_build_object(
          'id', v_second_line_id,
          'included', false,
          'review_state', 'reviewed',
          'name', 'Bread',
          'qty_value', 1,
          'qty_unit', 'pcs',
          'category_id', 'bakery'
        ),
        jsonb_build_object(
          'id', v_manual_line.id,
          'included', true,
          'review_state', 'reviewed',
          'name', 'Apples',
          'qty_value', 1.5,
          'qty_unit', 'kg',
          'category_id', 'produce'
        ),
        jsonb_build_object(
          'client_line_id', 'manual-apples-1',
          'included', true,
          'review_state', 'reviewed',
          'name', 'Duplicate Apples',
          'qty_value', 1,
          'qty_unit', 'kg',
          'category_id', 'produce'
        )
      )
    );
    raise exception 'Duplicate existing manual client line id did not fail';
  exception
    when sqlstate 'PT409' then null;
  end;

  begin
    perform public.save_receipt_review(
      v_household_id,
      v_receipt_id,
      v_generation_id,
      0,
      jsonb_build_array(
        jsonb_build_object(
          'id', v_first_line_id,
          'included', true,
          'review_state', 'reviewed',
          'name', 'Whole Milk',
          'qty_value', 1,
          'qty_unit', 'l',
          'category_id', 'dairy'
        ),
        jsonb_build_object(
          'id', v_second_line_id,
          'included', false,
          'review_state', 'reviewed',
          'name', 'Bread',
          'qty_value', 1,
          'qty_unit', 'pcs',
          'category_id', 'bakery'
        ),
        jsonb_build_object(
          'id', v_manual_line.id,
          'included', true,
          'review_state', 'reviewed',
          'name', 'Apples',
          'qty_value', 1.5,
          'qty_unit', 'kg',
          'category_id', 'produce'
        )
      )
    );
    raise exception 'Stale save did not fail';
  exception
    when sqlstate 'PT409' then null;
  end;

  begin
    perform public.mark_receipt_parse_failed(v_household_id, v_receipt_id, null, 0);
    raise exception 'Stale failed-state mark did not fail';
  exception
    when sqlstate 'PT409' then null;
  end;

  select * into strict v_receipt from public.receipts where id = v_receipt_id;
  perform pg_temp.expect(v_receipt.status = 'parsed', 'Stale failed-state mark wiped a successful parse');
  perform pg_temp.expect(v_receipt.active_parse_generation_id = v_generation_id, 'Stale failed-state mark changed active generation');
end $$;

set role authenticated;
select set_config('request.jwt.claim.sub', '31000000-0000-4000-8000-000000000001', false);

do $$
begin
  begin
    update public.receipts
    set review_revision = 99
    where id = '31000000-0000-4000-8000-000000000310';
    raise exception 'Authenticated role could update receipt workflow columns directly';
  exception
    when insufficient_privilege then null;
  end;

  begin
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
      included
    ) values (
      '31000000-0000-4000-8000-000000000310',
      '31000000-0000-4000-8000-000000000010',
      (
        select active_parse_generation_id
        from public.receipts
        where id = '31000000-0000-4000-8000-000000000310'
      ),
      'manual',
      99,
      'forged-direct-line',
      'Forged',
      1,
      'pcs',
      'pantry',
      'reviewed',
      true
    );
    raise exception 'Authenticated role could insert receipt review lines directly';
  exception
    when insufficient_privilege then null;
  end;
end $$;

reset role;

rollback;
