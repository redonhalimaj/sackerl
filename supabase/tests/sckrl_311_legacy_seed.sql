-- Synthetic SCKRL-311 pre-upgrade state. Run after 312/406 and BEFORE the 311 migration.
-- Disposable database only; this seeds an unlinked legacy receipt-source item deliberately.
\set ON_ERROR_STOP on

insert into auth.users (id, email) values
  ('31100000-0000-4000-8000-000000000001', 's311-owner@example.invalid'),
  ('31100000-0000-4000-8000-000000000002', 's311-member@example.invalid'),
  ('31100000-0000-4000-8000-000000000003', 's311-outsider@example.invalid');
insert into public.households (id, owner_id, name) values
  ('31100000-0000-4000-8000-000000000010', '31100000-0000-4000-8000-000000000001', 'S311 test household'),
  ('31100000-0000-4000-8000-000000000020', '31100000-0000-4000-8000-000000000003', 'S311 outside household');
insert into public.household_members (household_id, user_id) values
  ('31100000-0000-4000-8000-000000000010', '31100000-0000-4000-8000-000000000001'),
  ('31100000-0000-4000-8000-000000000010', '31100000-0000-4000-8000-000000000002'),
  ('31100000-0000-4000-8000-000000000020', '31100000-0000-4000-8000-000000000003');

do $$
declare
  v_review jsonb;
  v_generation uuid;
  v_fridge uuid;
  v_receipt_id uuid;
  v_line_id uuid;
begin
  perform set_config('request.jwt.claim.sub', '31100000-0000-4000-8000-000000000001', false);
  select id into strict v_fridge from public.zones
    where household_id='31100000-0000-4000-8000-000000000010' and key='fridge';
  insert into public.items (id, household_id, name, qty_value, qty_unit, category_id, zone_id, added_on, source)
  values ('31100000-0000-4000-8000-000000000300', '31100000-0000-4000-8000-000000000010',
    'Legacy receipt item', 1, 'pcs', 'pantry', v_fridge, date '2026-10-01', 'receipt');
  insert into public.receipts (id, household_id, image_url, status, captured_at, currency)
  values ('31100000-0000-4000-8000-000000000100', '31100000-0000-4000-8000-000000000010',
    'sackerl://receipt/sckrl-311-review', 'uploaded', '2026-10-01T10:00:00Z', 'EUR');
  v_review := public.promote_receipt_parse(
    '31100000-0000-4000-8000-000000000010','31100000-0000-4000-8000-000000000100',
    null,0,'fixture-parser-v1','fixture-provider','EUR','2026-10-01','S311 fixture',499,
    jsonb_build_array(
      jsonb_build_object('raw_text','MILK 1L 1.49','inferred_name','Milk','qty_value',1,'qty_unit','l','category_id','dairy','confidence',0.95,'confidence_level','high'),
      jsonb_build_object('raw_text','BREAD 1PCS 2.49','inferred_name','Bread','qty_value',1,'qty_unit','pcs','category_id','bakery','confidence',0.8,'confidence_level','mid'),
      jsonb_build_object('raw_text','APPLES 1KG 3.10','inferred_name','Apples','qty_value',1,'qty_unit','kg','category_id','produce','confidence',0.9,'confidence_level','high'),
      jsonb_build_object('raw_text','SALT 1PCS 1.01','inferred_name','Salt','qty_value',1,'qty_unit','pcs','category_id','spices','confidence',0.7,'confidence_level','mid')
    )
  );
  v_generation := (v_review #>> '{receipt,active_parse_generation_id}')::uuid;
  v_review := public.save_receipt_review(
    '31100000-0000-4000-8000-000000000010','31100000-0000-4000-8000-000000000100',
    v_generation,0,jsonb_build_array(
      jsonb_build_object('id',v_review #>> '{items,0,id}','included',true,'review_state','reviewed','name','Whole Milk','qty_value',1,'qty_unit','l','category_id','dairy','expiry',jsonb_build_object('state','dated','date','2026-10-20')),
      jsonb_build_object('id',v_review #>> '{items,1,id}','included',true,'review_state','reviewed','name','Bread','qty_value',1,'qty_unit','pcs','category_id','bakery','expiry',jsonb_build_object('state','no_date','date',null)),
      jsonb_build_object('id',v_review #>> '{items,2,id}','included',true,'review_state','reviewed','name','Apples','qty_value',1,'qty_unit','kg','category_id','produce','expiry',jsonb_build_object('state','unknown','date',null)),
      jsonb_build_object('id',v_review #>> '{items,3,id}','included',false,'review_state','reviewed','name','Salt','qty_value',1,'qty_unit','pcs','category_id','spices')
    )
  );

  -- Additional saved reviews provide isolated receipts for concurrent key, parse,
  -- membership-revocation and zone-deletion cases in the prepared two-session runner.
  foreach v_receipt_id in array array[
    '31100000-0000-4000-8000-000000000101'::uuid,
    '31100000-0000-4000-8000-000000000102'::uuid,
    '31100000-0000-4000-8000-000000000103'::uuid,
    '31100000-0000-4000-8000-000000000104'::uuid,
    '31100000-0000-4000-8000-000000000105'::uuid,
    '31100000-0000-4000-8000-000000000106'::uuid
  ] loop
    insert into public.receipts (id, household_id, image_url, status, captured_at, currency)
    values (v_receipt_id, '31100000-0000-4000-8000-000000000010',
      'sackerl://receipt/' || right(v_receipt_id::text, 3), 'uploaded', '2026-10-02T10:00:00Z', 'EUR');
    v_review := public.promote_receipt_parse(
      '31100000-0000-4000-8000-000000000010', v_receipt_id, null, 0,
      'fixture-parser-v1', 'fixture-provider', 'EUR',
      case when v_receipt_id='31100000-0000-4000-8000-000000000102'::uuid then date '2030-01-01' else date '2026-10-03' end,
      'S311 race fixture', 199,
      jsonb_build_array(jsonb_build_object(
        'raw_text','FIXTURE 1PCS 1.99','inferred_name','Fixture Item','qty_value',1,
        'qty_unit','pcs','category_id','pantry','confidence',0.9,'confidence_level','high'
      ))
    );
    v_generation := (v_review #>> '{receipt,active_parse_generation_id}')::uuid;
    v_line_id := (v_review #>> '{items,0,id}')::uuid;
    perform public.save_receipt_review(
      '31100000-0000-4000-8000-000000000010', v_receipt_id, v_generation, 0,
      jsonb_build_array(jsonb_build_object(
        'id',v_line_id,'included',true,'review_state','reviewed','name','Fixture Item',
        'qty_value',1,'qty_unit','pcs','category_id','pantry',
        'expiry',jsonb_build_object('state','unknown','date',null)
      ))
    );
  end loop;

  -- These isolated parser snapshots are saved by the bounded concurrency helper immediately
  -- before the review-save and parse-promotion versus placement races. Keeping them unsaved here
  -- preserves the initial pending-review pagination fixture.
  foreach v_receipt_id in array array[
    '31100000-0000-4000-8000-000000000107'::uuid,
    '31100000-0000-4000-8000-000000000108'::uuid
  ] loop
    insert into public.receipts (id, household_id, image_url, status, captured_at, currency)
    values (v_receipt_id, '31100000-0000-4000-8000-000000000010',
      'sackerl://receipt/' || right(v_receipt_id::text, 3), 'uploaded', '2026-10-02T10:00:00Z', 'EUR');
    perform public.promote_receipt_parse(
      '31100000-0000-4000-8000-000000000010', v_receipt_id, null, 0,
      'fixture-parser-v1', 'fixture-provider', 'EUR', date '2026-10-03',
      'S311 mutation-race fixture', 199,
      jsonb_build_array(jsonb_build_object(
        'raw_text','FIXTURE 1PCS 1.99','inferred_name','Fixture Item','qty_value',1,
        'qty_unit','pcs','category_id','pantry','confidence',0.9,'confidence_level','high'
      ))
    );
  end loop;

  -- A reviewed foreign-household receipt is used to assert non-disclosing 404 behavior.
  perform set_config('request.jwt.claim.sub', '31100000-0000-4000-8000-000000000003', false);
  select id into strict v_fridge from public.zones
    where household_id='31100000-0000-4000-8000-000000000020' and key='fridge';
  insert into public.receipts (id, household_id, image_url, status, captured_at, currency)
  values ('31100000-0000-4000-8000-000000000200', '31100000-0000-4000-8000-000000000020',
    'sackerl://receipt/sckrl-311-outsider', 'uploaded', '2026-10-02T10:00:00Z', 'EUR');
  v_review := public.promote_receipt_parse(
    '31100000-0000-4000-8000-000000000020','31100000-0000-4000-8000-000000000200',
    null,0,'fixture-parser-v1','fixture-provider','EUR','2026-10-03','Outside household',199,
    jsonb_build_array(jsonb_build_object(
      'raw_text','PRIVATE ITEM','inferred_name','Private Item','qty_value',1,
      'qty_unit','pcs','category_id','pantry','confidence',0.9,'confidence_level','high'
    ))
  );
  v_generation := (v_review #>> '{receipt,active_parse_generation_id}')::uuid;
  perform public.save_receipt_review(
    '31100000-0000-4000-8000-000000000020','31100000-0000-4000-8000-000000000200',
    v_generation,0,jsonb_build_array(jsonb_build_object(
      'id',v_review #>> '{items,0,id}','included',true,'review_state','reviewed',
      'name','Private Item','qty_value',1,'qty_unit','pcs','category_id','pantry',
      'expiry',jsonb_build_object('state','unknown','date',null)
    ))
  );
end;
$$;
