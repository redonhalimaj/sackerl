-- Synthetic pre-SCKRL-312 data. Disposable database only.
-- Apply baseline migrations through SCKRL-406 first, then this seed BEFORE the 312 migration.
\set ON_ERROR_STOP on

insert into auth.users (id, email) values
  ('31200000-0000-4000-8000-000000000001', 's312-owner@example.invalid'),
  ('31200000-0000-4000-8000-000000000002', 's312-member@example.invalid'),
  ('31200000-0000-4000-8000-000000000003', 's312-outsider@example.invalid');
insert into public.households (id, owner_id, name) values
  ('31200000-0000-4000-8000-000000000010', '31200000-0000-4000-8000-000000000001', 'S312 test household'),
  ('31200000-0000-4000-8000-000000000020', '31200000-0000-4000-8000-000000000003', 'S312 outside household');
insert into public.household_members (household_id, user_id) values
  ('31200000-0000-4000-8000-000000000010', '31200000-0000-4000-8000-000000000001'),
  ('31200000-0000-4000-8000-000000000010', '31200000-0000-4000-8000-000000000002'),
  ('31200000-0000-4000-8000-000000000020', '31200000-0000-4000-8000-000000000003');

do $$
declare
  v_review jsonb;
begin
  perform set_config('request.jwt.claim.sub', '31200000-0000-4000-8000-000000000001', true);
  insert into public.receipts (id, household_id, image_url, status, captured_at, currency)
  values ('31200000-0000-4000-8000-000000000100', '31200000-0000-4000-8000-000000000010',
    'sackerl://receipt/sckrl-312-legacy', 'uploaded', '2026-09-29T10:00:00Z', 'EUR');
  v_review := public.promote_receipt_parse(
    '31200000-0000-4000-8000-000000000010', '31200000-0000-4000-8000-000000000100',
    null, 0, 'fixture-parser-v1', 'fixture-provider', 'EUR', '2026-09-29', 'S312 fixture', 398,
    jsonb_build_array(
      jsonb_build_object('raw_text', 'MILK 1L 1.49', 'inferred_name', 'Milk', 'qty_value', 1,
        'qty_unit', 'l', 'category_id', 'dairy', 'confidence', 0.95, 'confidence_level', 'high'),
      jsonb_build_object('raw_text', 'BREAD 1PCS 2.49', 'inferred_name', 'Bread', 'qty_value', 1,
        'qty_unit', 'pcs', 'category_id', 'bakery', 'confidence', 0.8, 'confidence_level', 'mid')
    )
  );
  perform public.save_receipt_review(
    '31200000-0000-4000-8000-000000000010', '31200000-0000-4000-8000-000000000100',
    (v_review #>> '{receipt,active_parse_generation_id}')::uuid, 0,
    jsonb_build_array(
      jsonb_build_object('id', v_review #>> '{items,0,id}', 'included', true,
        'review_state', 'reviewed', 'name', 'Whole Milk', 'qty_value', 1, 'qty_unit', 'l', 'category_id', 'dairy'),
      jsonb_build_object('id', v_review #>> '{items,1,id}', 'included', true,
        'review_state', 'reviewed', 'name', 'Bread', 'qty_value', 1, 'qty_unit', 'pcs', 'category_id', 'bakery'),
      jsonb_build_object('client_line_id', 'legacy-manual-1', 'included', true,
        'review_state', 'reviewed', 'name', 'Oats', 'qty_value', 1, 'qty_unit', 'pcs', 'category_id', 'pantry')
    )
  );
end;
$$;
