-- SCKRL-310 adversarial acceptance checks.
-- Run after local_bootstrap.sql, baseline migrations, sckrl_310_legacy_seed.sql,
-- the SCKRL-310 migration, and sckrl_310_legacy_assert.sql.
-- This file manages its own transaction and rolls back all successful mutations.
\set ON_ERROR_STOP on

BEGIN;

CREATE FUNCTION pg_temp.expect(condition boolean, message text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF condition IS NOT TRUE THEN
    RAISE EXCEPTION '%', message;
  END IF;
END;
$$;

CREATE FUNCTION pg_temp.force_receipt_item_timestamps(
  p_item_id uuid,
  p_corrected_at timestamptz,
  p_reviewed_at timestamptz
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.receipt_items
  SET corrected_at = p_corrected_at,
      reviewed_at = p_reviewed_at
  WHERE id = p_item_id;
END;
$$;

DO $$
BEGIN
  PERFORM pg_temp.expect(
    has_function_privilege('authenticated', 'public.get_receipt_review(uuid,uuid)', 'EXECUTE'),
    'authenticated cannot execute get_receipt_review'
  );
  PERFORM pg_temp.expect(
    has_function_privilege(
      'authenticated',
      'public.mark_receipt_parse_failed(uuid,uuid,uuid,integer)',
      'EXECUTE'
    ),
    'authenticated cannot execute mark_receipt_parse_failed'
  );
  PERFORM pg_temp.expect(
    has_function_privilege(
      'authenticated',
      'public.promote_receipt_parse(uuid,uuid,uuid,integer,text,text,text,date,text,integer,jsonb)',
      'EXECUTE'
    ),
    'authenticated cannot execute promote_receipt_parse'
  );
  PERFORM pg_temp.expect(
    has_function_privilege(
      'authenticated',
      'public.save_receipt_review(uuid,uuid,uuid,integer,jsonb)',
      'EXECUTE'
    ),
    'authenticated cannot execute save_receipt_review'
  );

  PERFORM pg_temp.expect(
    NOT has_function_privilege('anon', 'public.get_receipt_review(uuid,uuid)', 'EXECUTE'),
    'anon retained execute on get_receipt_review'
  );
  PERFORM pg_temp.expect(
    NOT has_function_privilege(
      'anon',
      'public.mark_receipt_parse_failed(uuid,uuid,uuid,integer)',
      'EXECUTE'
    ),
    'anon retained execute on mark_receipt_parse_failed'
  );
  PERFORM pg_temp.expect(
    NOT has_function_privilege(
      'anon',
      'public.promote_receipt_parse(uuid,uuid,uuid,integer,text,text,text,date,text,integer,jsonb)',
      'EXECUTE'
    ),
    'anon retained execute on promote_receipt_parse'
  );
  PERFORM pg_temp.expect(
    NOT has_function_privilege(
      'anon',
      'public.save_receipt_review(uuid,uuid,uuid,integer,jsonb)',
      'EXECUTE'
    ),
    'anon retained execute on save_receipt_review'
  );

  PERFORM pg_temp.expect(
    NOT has_table_privilege('authenticated', 'public.receipts', 'TRUNCATE'),
    'authenticated retained TRUNCATE on receipts'
  );
  PERFORM pg_temp.expect(
    NOT has_table_privilege('authenticated', 'public.receipt_parse_generations', 'TRUNCATE'),
    'authenticated retained TRUNCATE on receipt_parse_generations'
  );
  PERFORM pg_temp.expect(
    NOT has_table_privilege('authenticated', 'public.receipt_items', 'TRUNCATE'),
    'authenticated retained TRUNCATE on receipt_items'
  );
  PERFORM pg_temp.expect(
    NOT has_table_privilege('anon', 'public.receipts', 'TRUNCATE'),
    'anon retained TRUNCATE on receipts'
  );
  PERFORM pg_temp.expect(
    NOT has_table_privilege('anon', 'public.receipt_parse_generations', 'TRUNCATE'),
    'anon retained TRUNCATE on receipt_parse_generations'
  );
  PERFORM pg_temp.expect(
    NOT has_table_privilege('anon', 'public.receipt_items', 'TRUNCATE'),
    'anon retained TRUNCATE on receipt_items'
  );

  PERFORM pg_temp.expect(
    EXISTS (
      SELECT 1
      FROM public.receipts
      WHERE id = '31000000-0000-4000-8000-000000000100'
    ),
    'SCKRL-310 legacy receipt fixture is missing'
  );
  PERFORM pg_temp.expect(
    EXISTS (
      SELECT 1
      FROM public.households
      WHERE id = '31000000-0000-4000-8000-000000000020'
    ),
    'SCKRL-310 outside household fixture is missing'
  );
END $$;

INSERT INTO public.receipts (
  id,
  household_id,
  image_url,
  status,
  captured_at,
  store_name,
  total_cents
)
VALUES
  (
    '31000000-0000-4000-8000-000000000200',
    '31000000-0000-4000-8000-000000000020',
    'sackerl://receipt/outside-household',
    'uploaded',
    '2026-09-01T11:00:00Z',
    'Outside store',
    456
  ),
  (
    '31000000-0000-4000-8000-000000000300',
    '31000000-0000-4000-8000-000000000010',
    'sackerl://receipt/failure-race',
    'uploaded',
    '2026-09-01T12:00:00Z',
    'Race store',
    NULL
  )
ON CONFLICT (id) DO NOTHING;

SET LOCAL ROLE authenticated;

DO $$
DECLARE
  v_error_state text;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '', true);

  v_error_state := NULL;
  BEGIN
    PERFORM public.get_receipt_review(
      '31000000-0000-4000-8000-000000000010',
      '31000000-0000-4000-8000-000000000100'
    );
    RAISE SQLSTATE 'QA310' USING MESSAGE = 'Unauthenticated get_receipt_review was accepted';
  EXCEPTION
    WHEN SQLSTATE 'QA310' THEN
      RAISE;
    WHEN OTHERS THEN
      v_error_state := SQLSTATE;
  END;
  PERFORM pg_temp.expect(v_error_state = 'PT401', 'Unauthenticated get_receipt_review should fail with PT401');

  v_error_state := NULL;
  BEGIN
    PERFORM public.mark_receipt_parse_failed(
      '31000000-0000-4000-8000-000000000010',
      '31000000-0000-4000-8000-000000000100',
      NULL,
      0
    );
    RAISE SQLSTATE 'QA310' USING MESSAGE = 'Unauthenticated mark_receipt_parse_failed was accepted';
  EXCEPTION
    WHEN SQLSTATE 'QA310' THEN
      RAISE;
    WHEN OTHERS THEN
      v_error_state := SQLSTATE;
  END;
  PERFORM pg_temp.expect(v_error_state = 'PT401', 'Unauthenticated mark_receipt_parse_failed should fail with PT401');

  v_error_state := NULL;
  BEGIN
    PERFORM public.promote_receipt_parse(
      '31000000-0000-4000-8000-000000000010',
      '31000000-0000-4000-8000-000000000100',
      NULL,
      0,
      'qa-rules-v1',
      'qa-provider',
      'EUR',
      '2026-09-01',
      'Unauthed store',
      100,
      '[{"raw_text":"NO AUTH 1.00","inferred_name":"No Auth","qty_value":1,"qty_unit":"pcs","category_id":"pantry","confidence":0.99,"confidence_level":"high"}]'::jsonb
    );
    RAISE SQLSTATE 'QA310' USING MESSAGE = 'Unauthenticated promote_receipt_parse was accepted';
  EXCEPTION
    WHEN SQLSTATE 'QA310' THEN
      RAISE;
    WHEN OTHERS THEN
      v_error_state := SQLSTATE;
  END;
  PERFORM pg_temp.expect(v_error_state = 'PT401', 'Unauthenticated promote_receipt_parse should fail with PT401');

  v_error_state := NULL;
  BEGIN
    PERFORM public.save_receipt_review(
      '31000000-0000-4000-8000-000000000010',
      '31000000-0000-4000-8000-000000000100',
      NULL,
      0,
      '[]'::jsonb
    );
    RAISE SQLSTATE 'QA310' USING MESSAGE = 'Unauthenticated save_receipt_review was accepted';
  EXCEPTION
    WHEN SQLSTATE 'QA310' THEN
      RAISE;
    WHEN OTHERS THEN
      v_error_state := SQLSTATE;
  END;
  PERFORM pg_temp.expect(v_error_state = 'PT401', 'Unauthenticated save_receipt_review should fail with PT401');
END $$;

SELECT set_config('request.jwt.claim.sub', '31000000-0000-4000-8000-000000000001', true);

DO $$
DECLARE
  v_error_state text;
  v_fixed_corrected_at timestamptz := '2026-09-03T08:00:00Z';
  v_fixed_reviewed_at timestamptz := '2026-09-03T08:05:00Z';
  v_generation_count integer;
  v_line_a uuid;
  v_line_b uuid;
  v_manual_count integer;
  v_manual_id uuid;
  v_manual_line public.receipt_items%rowtype;
  v_new_generation uuid;
  v_noop_rows jsonb;
  v_parser_line_count integer;
  v_prior_generation uuid;
  v_race_snapshot jsonb;
  v_review public.receipts%rowtype;
  v_review_revision integer;
  v_review_status public.receipt_review_status;
  v_reviewed_at timestamptz;
  v_reviewed_by uuid;
  v_rows jsonb;
  v_snapshot jsonb;
BEGIN
  PERFORM pg_temp.expect(
    public.is_household_member('31000000-0000-4000-8000-000000000010'),
    'Authenticated fixture user should be a member of the primary household'
  );
  PERFORM pg_temp.expect(
    NOT public.is_household_member('31000000-0000-4000-8000-000000000020'),
    'Authenticated fixture user should not be a member of the outside household'
  );
  PERFORM pg_temp.expect(
    NOT EXISTS (
      SELECT 1
      FROM public.receipts
      WHERE household_id = '31000000-0000-4000-8000-000000000020'
    ),
    'RLS exposed an outside household receipt to the authenticated fixture user'
  );

  v_race_snapshot := public.mark_receipt_parse_failed(
    '31000000-0000-4000-8000-000000000010',
    '31000000-0000-4000-8000-000000000300',
    NULL,
    0
  );
  PERFORM pg_temp.expect(
    v_race_snapshot #>> '{receipt,status}' = 'failed',
    'Failure marker did not mark an unpromoted receipt failed'
  );
  PERFORM pg_temp.expect(
    jsonb_array_length(v_race_snapshot -> 'items') = 0,
    'Failure marker returned items for an unpromoted receipt'
  );

  SELECT active_parse_generation_id
  INTO STRICT v_prior_generation
  FROM public.receipts
  WHERE id = '31000000-0000-4000-8000-000000000100'
    AND household_id = '31000000-0000-4000-8000-000000000010';

  SELECT count(*)
  INTO v_generation_count
  FROM public.receipt_parse_generations
  WHERE receipt_id = '31000000-0000-4000-8000-000000000100';

  v_error_state := NULL;
  BEGIN
    PERFORM public.promote_receipt_parse(
      '31000000-0000-4000-8000-000000000020',
      '31000000-0000-4000-8000-000000000200',
      NULL,
      0,
      'qa-rules-v1',
      'qa-provider',
      'EUR',
      '2026-09-01',
      'Outside store',
      456,
      '[{"raw_text":"OUTSIDE 1.00","inferred_name":"Outside","qty_value":1,"qty_unit":"pcs","category_id":"pantry","confidence":0.99,"confidence_level":"high"}]'::jsonb
    );
    RAISE SQLSTATE 'QA310' USING MESSAGE = 'Cross-household parse promotion was accepted';
  EXCEPTION
    WHEN SQLSTATE 'QA310' THEN
      RAISE;
    WHEN OTHERS THEN
      v_error_state := SQLSTATE;
  END;
  PERFORM pg_temp.expect(v_error_state = 'PT403', 'Cross-household parse promotion should fail with PT403');

  v_error_state := NULL;
  BEGIN
    PERFORM public.promote_receipt_parse(
      '31000000-0000-4000-8000-000000000010',
      '31000000-0000-4000-8000-000000000100',
      v_prior_generation,
      NULL,
      'qa-rules-v1',
      'qa-provider',
      'EUR',
      '2026-09-01',
      'Null revision store',
      100,
      '[{"raw_text":"NULL REV 1.00","inferred_name":"Null Rev","qty_value":1,"qty_unit":"pcs","category_id":"pantry","confidence":0.99,"confidence_level":"high"}]'::jsonb
    );
    RAISE SQLSTATE 'QA310' USING MESSAGE = 'Null expected review revision was accepted';
  EXCEPTION
    WHEN SQLSTATE 'QA310' THEN
      RAISE;
    WHEN OTHERS THEN
      v_error_state := SQLSTATE;
  END;
  PERFORM pg_temp.expect(v_error_state = 'PT400', 'Null expected review revision should fail with PT400');

  v_error_state := NULL;
  BEGIN
    PERFORM public.promote_receipt_parse(
      '31000000-0000-4000-8000-000000000010',
      '31000000-0000-4000-8000-000000000100',
      v_prior_generation,
      0,
      'qa-rules-v1',
      'qa-provider',
      'EUR',
      '2026-09-01',
      'Rollback store',
      250,
      '[{"raw_text":"GOOD 1.00","inferred_name":"Good","qty_value":1,"qty_unit":"pcs","category_id":"pantry","confidence":0.99,"confidence_level":"high"},{"raw_text":"BAD 1.50","inferred_name":"Bad","qty_value":1,"qty_unit":"pcs","category_id":"not-a-category","confidence":0.70,"confidence_level":"mid"}]'::jsonb
    );
    RAISE SQLSTATE 'QA310' USING MESSAGE = 'Invalid parse payload was accepted';
  EXCEPTION
    WHEN SQLSTATE 'QA310' THEN
      RAISE;
    WHEN OTHERS THEN
      v_error_state := SQLSTATE;
  END;
  PERFORM pg_temp.expect(v_error_state IS NOT NULL, 'Invalid parse payload should fail');
  PERFORM pg_temp.expect(
    (SELECT active_parse_generation_id
     FROM public.receipts
     WHERE id = '31000000-0000-4000-8000-000000000100') = v_prior_generation,
    'Failed parse promotion changed the active generation'
  );
  PERFORM pg_temp.expect(
    (SELECT count(*)
     FROM public.receipt_parse_generations
     WHERE receipt_id = '31000000-0000-4000-8000-000000000100') = v_generation_count,
    'Failed parse promotion left behind a parse generation'
  );

  v_snapshot := public.promote_receipt_parse(
    '31000000-0000-4000-8000-000000000010',
    '31000000-0000-4000-8000-000000000100',
    v_prior_generation,
    0,
    'qa-rules-v1',
    'qa-provider',
    'EUR',
    '2026-09-02',
    'QA Market',
    NULL,
    '[{"raw_text":"BIO MILCH 1L 1.49","inferred_name":"Bio Milch","qty_value":1,"qty_unit":"l","category_id":"dairy","confidence":0.99,"confidence_level":"high","line_total_cents":149,"unit_price_cents":149,"discount_cents":null,"tax_cents":null},{"raw_text":"APPLE LOOSE 0.5KG","inferred_name":"Apple Loose","qty_value":0.5,"qty_unit":"kg","category_id":"produce","confidence":0.70,"confidence_level":"mid","line_total_cents":null,"unit_price_cents":null,"discount_cents":null,"tax_cents":null}]'::jsonb
  );

  PERFORM pg_temp.expect(jsonb_typeof(v_snapshot -> 'receipt') = 'object', 'Promotion snapshot missing receipt object');
  PERFORM pg_temp.expect(jsonb_typeof(v_snapshot -> 'items') = 'array', 'Promotion snapshot missing items array');

  SELECT active_parse_generation_id, review_status, review_revision, reviewed_at, reviewed_by
  INTO STRICT v_new_generation,
    v_review_status,
    v_review_revision,
    v_reviewed_at,
    v_reviewed_by
  FROM public.receipts
  WHERE id = '31000000-0000-4000-8000-000000000100';

  PERFORM pg_temp.expect(v_new_generation IS NOT NULL, 'Successful promotion did not activate a generation');
  PERFORM pg_temp.expect(v_new_generation IS DISTINCT FROM v_prior_generation, 'Successful promotion reused the old generation');
  PERFORM pg_temp.expect(v_review_status = 'needs_review', 'Promotion should leave receipt review_status as needs_review');
  PERFORM pg_temp.expect(v_review_revision = 0, 'Promotion should reset review_revision to 0');
  PERFORM pg_temp.expect(v_reviewed_at IS NULL AND v_reviewed_by IS NULL, 'Promotion should not mark receipt reviewed');
  PERFORM pg_temp.expect(
    (v_snapshot #>> '{receipt,active_parse_generation_id}')::uuid = v_new_generation,
    'Promotion snapshot receipt active generation did not match committed receipt'
  );
  PERFORM pg_temp.expect(
    (v_snapshot #>> '{receipt,review_revision}')::integer = v_review_revision,
    'Promotion snapshot receipt review revision did not match committed receipt'
  );
  PERFORM pg_temp.expect(
    (
      SELECT bool_and((item ->> 'generation_id')::uuid = v_new_generation)
      FROM jsonb_array_elements(v_snapshot -> 'items') AS item
    ),
    'Promotion snapshot included lines from a different generation'
  );
  PERFORM pg_temp.expect(
    jsonb_array_length(v_snapshot -> 'items') = (
      SELECT count(*)
      FROM public.receipt_items
      WHERE generation_id = v_new_generation
    ),
    'Promotion snapshot item count did not match active generation'
  );
  PERFORM pg_temp.expect(
    NOT EXISTS (
      SELECT 1
      FROM public.receipt_items
      WHERE generation_id = v_new_generation
        AND review_state <> 'unresolved'
    ),
    'Parser confidence was converted into review approval'
  );
  PERFORM pg_temp.expect(
    EXISTS (
      SELECT 1
      FROM public.receipt_items
      WHERE generation_id = v_prior_generation
        AND id = '31000000-0000-4000-8000-000000001000'
        AND raw_text = 'MILK 1L 1.23'
        AND inferred_name = 'Milk'
    ),
    'Prior parser evidence was not preserved after reparse'
  );

  v_error_state := NULL;
  BEGIN
    PERFORM public.mark_receipt_parse_failed(
      '31000000-0000-4000-8000-000000000010',
      '31000000-0000-4000-8000-000000000100',
      NULL,
      0
    );
    RAISE SQLSTATE 'QA310' USING MESSAGE = 'Stale parse failure marker was accepted after promotion';
  EXCEPTION
    WHEN SQLSTATE 'QA310' THEN
      RAISE;
    WHEN OTHERS THEN
      v_error_state := SQLSTATE;
  END;
  PERFORM pg_temp.expect(
    v_error_state = 'PT409',
    'Concurrent parse failure marker should fail with PT409 after a generation is active'
  );
  PERFORM pg_temp.expect(
    (SELECT status
     FROM public.receipts
     WHERE id = '31000000-0000-4000-8000-000000000100') = 'parsed',
    'Concurrent parse failure marker changed a parsed receipt status'
  );
  PERFORM pg_temp.expect(
    (SELECT active_parse_generation_id
     FROM public.receipts
     WHERE id = '31000000-0000-4000-8000-000000000100') = v_new_generation,
    'Concurrent parse failure marker changed the active generation'
  );

  v_error_state := NULL;
  BEGIN
    PERFORM public.promote_receipt_parse(
      '31000000-0000-4000-8000-000000000010',
      '31000000-0000-4000-8000-000000000100',
      v_prior_generation,
      0,
      'qa-rules-v1',
      'qa-provider',
      'EUR',
      '2026-09-02',
      'Stale store',
      149,
      '[{"raw_text":"STALE 1.00","inferred_name":"Stale","qty_value":1,"qty_unit":"pcs","category_id":"pantry","confidence":0.99,"confidence_level":"high"}]'::jsonb
    );
    RAISE SQLSTATE 'QA310' USING MESSAGE = 'Stale parse generation was accepted';
  EXCEPTION
    WHEN SQLSTATE 'QA310' THEN
      RAISE;
    WHEN OTHERS THEN
      v_error_state := SQLSTATE;
  END;
  PERFORM pg_temp.expect(v_error_state = 'PT409', 'Stale parse promotion should fail with PT409');

  SELECT id
  INTO v_line_a
  FROM public.receipt_items
  WHERE generation_id = v_new_generation
    AND line_index = 0
  ORDER BY id
  LIMIT 1;

  SELECT id
  INTO v_line_b
  FROM public.receipt_items
  WHERE generation_id = v_new_generation
    AND line_index = 1
  ORDER BY id
  LIMIT 1;
  PERFORM pg_temp.expect(v_line_a IS NOT NULL AND v_line_b IS NOT NULL, 'Promoted parser line ids are missing');

  v_error_state := NULL;
  BEGIN
    PERFORM public.save_receipt_review(
      '31000000-0000-4000-8000-000000000010',
      '31000000-0000-4000-8000-000000000100',
      v_new_generation,
      0,
      jsonb_build_array(
        jsonb_build_object(
          'id', v_line_a,
          'included', true,
          'review_state', 'reviewed',
          'name', 'Bio Milk',
          'qty_value', 1,
          'qty_unit', 'l',
          'category_id', 'dairy'
        )
      )
    );
    RAISE SQLSTATE 'QA310' USING MESSAGE = 'Omitted review line was accepted';
  EXCEPTION
    WHEN SQLSTATE 'QA310' THEN
      RAISE;
    WHEN OTHERS THEN
      v_error_state := SQLSTATE;
  END;
  PERFORM pg_temp.expect(v_error_state = 'PT409', 'Omitted active review line should fail with PT409');

  v_error_state := NULL;
  BEGIN
    PERFORM public.save_receipt_review(
      '31000000-0000-4000-8000-000000000010',
      '31000000-0000-4000-8000-000000000100',
      v_new_generation,
      0,
      jsonb_build_array(
        jsonb_build_object('id', v_line_a, 'included', true, 'review_state', 'reviewed', 'name', 'Bio Milk', 'qty_value', 1, 'qty_unit', 'l', 'category_id', 'dairy'),
        jsonb_build_object('id', v_line_a, 'included', true, 'review_state', 'reviewed', 'name', 'Bio Milk', 'qty_value', 1, 'qty_unit', 'l', 'category_id', 'dairy')
      )
    );
    RAISE SQLSTATE 'QA310' USING MESSAGE = 'Duplicate review line id was accepted';
  EXCEPTION
    WHEN SQLSTATE 'QA310' THEN
      RAISE;
    WHEN OTHERS THEN
      v_error_state := SQLSTATE;
  END;
  PERFORM pg_temp.expect(v_error_state = 'PT409', 'Duplicate active review line id should fail with PT409');

  v_error_state := NULL;
  BEGIN
    PERFORM public.save_receipt_review(
      '31000000-0000-4000-8000-000000000010',
      '31000000-0000-4000-8000-000000000100',
      v_new_generation,
      NULL,
      jsonb_build_array(
        jsonb_build_object('id', v_line_a, 'included', true, 'review_state', 'reviewed', 'name', 'Bio Milk', 'qty_value', 1, 'qty_unit', 'l', 'category_id', 'dairy'),
        jsonb_build_object('id', v_line_b, 'included', false, 'review_state', 'reviewed', 'name', 'Apple Loose', 'qty_value', 0.5, 'qty_unit', 'kg', 'category_id', 'produce')
      )
    );
    RAISE SQLSTATE 'QA310' USING MESSAGE = 'Null expected review revision was accepted for save';
  EXCEPTION
    WHEN SQLSTATE 'QA310' THEN
      RAISE;
    WHEN OTHERS THEN
      v_error_state := SQLSTATE;
  END;
  PERFORM pg_temp.expect(v_error_state = 'PT400', 'Null expected review revision should fail with PT400 for save');

  v_rows := jsonb_build_array(
    jsonb_build_object(
      'id', v_line_a,
      'included', true,
      'review_state', 'reviewed',
      'name', 'Bio Milk',
      'qty_value', 1,
      'qty_unit', 'l',
      'category_id', 'dairy'
    ),
    jsonb_build_object(
      'id', v_line_b,
      'included', false,
      'review_state', 'reviewed',
      'name', 'Apple Loose',
      'qty_value', 0.5,
      'qty_unit', 'kg',
      'category_id', 'produce'
    ),
    jsonb_build_object(
      'client_line_id', 'manual-qa-1',
      'included', true,
      'review_state', 'reviewed',
      'name', 'Manual Oats',
      'qty_value', 1,
      'qty_unit', 'pcs',
      'category_id', 'pantry'
    )
  );

  v_snapshot := public.save_receipt_review(
    '31000000-0000-4000-8000-000000000010',
    '31000000-0000-4000-8000-000000000100',
    v_new_generation,
    0,
    v_rows
  );

  SELECT *
  INTO STRICT v_review
  FROM public.receipts
  WHERE id = '31000000-0000-4000-8000-000000000100';

  PERFORM pg_temp.expect(v_review.review_revision = 1, 'Review save did not increment review_revision');
  PERFORM pg_temp.expect(v_review.review_status = 'reviewed', 'Fully reviewed save did not mark receipt reviewed');
  PERFORM pg_temp.expect(v_review.reviewed_at IS NOT NULL, 'Fully reviewed save did not set reviewed_at');
  PERFORM pg_temp.expect(
    v_review.reviewed_by = '31000000-0000-4000-8000-000000000001',
    'Fully reviewed save did not set reviewed_by to the authenticated user'
  );
  PERFORM pg_temp.expect(
    (v_snapshot #>> '{receipt,active_parse_generation_id}')::uuid = v_new_generation,
    'Review save snapshot receipt active generation did not match committed receipt'
  );
  PERFORM pg_temp.expect(
    (v_snapshot #>> '{receipt,review_revision}')::integer = 1,
    'Review save snapshot receipt revision did not match committed receipt'
  );
  PERFORM pg_temp.expect(
    (
      SELECT bool_and((item ->> 'generation_id')::uuid = v_new_generation)
      FROM jsonb_array_elements(v_snapshot -> 'items') AS item
    ),
    'Review save snapshot included lines from a different generation'
  );

  PERFORM pg_temp.expect(
    EXISTS (
      SELECT 1
      FROM public.receipt_items
      WHERE id = v_line_a
        AND raw_text = 'BIO MILCH 1L 1.49'
        AND inferred_name = 'Bio Milch'
        AND corrected_name = 'Bio Milk'
        AND corrected_at IS NOT NULL
        AND corrected_by = '31000000-0000-4000-8000-000000000001'
        AND review_state = 'reviewed'
        AND reviewed_at IS NOT NULL
        AND reviewed_by = '31000000-0000-4000-8000-000000000001'
    ),
    'Corrected parser line did not preserve original evidence and review metadata'
  );
  PERFORM pg_temp.expect(
    EXISTS (
      SELECT 1
      FROM public.receipt_items
      WHERE id = v_line_b
        AND raw_text = 'APPLE LOOSE 0.5KG'
        AND inferred_name = 'Apple Loose'
        AND included = false
        AND review_state = 'reviewed'
        AND reviewed_at IS NOT NULL
    ),
    'Excluded parser line was not preserved as a reviewed ignored line'
  );

  SELECT count(*)
  INTO v_parser_line_count
  FROM public.receipt_items
  WHERE generation_id = v_new_generation
    AND source = 'parser';
  SELECT count(*)
  INTO v_manual_count
  FROM public.receipt_items
  WHERE generation_id = v_new_generation
    AND source = 'manual'
    AND client_line_id = 'manual-qa-1';

  SELECT id
  INTO v_manual_id
  FROM public.receipt_items
  WHERE generation_id = v_new_generation
    AND source = 'manual'
    AND client_line_id = 'manual-qa-1'
  ORDER BY id
  LIMIT 1;
  SELECT *
  INTO STRICT v_manual_line
  FROM public.receipt_items
  WHERE id = v_manual_id;

  PERFORM pg_temp.expect(v_parser_line_count = 2, 'Review save duplicated or dropped parser lines');
  PERFORM pg_temp.expect(v_manual_count = 1, 'Review save did not create exactly one manual line');
  PERFORM pg_temp.expect(v_manual_line.corrected_name = 'Manual Oats', 'Manual line name was not stored as corrected_name');
  PERFORM pg_temp.expect(v_manual_line.raw_text IS NULL AND v_manual_line.inferred_name IS NULL, 'Manual line fabricated parser evidence');
  PERFORM pg_temp.expect(v_manual_line.inferred_line_total_cents IS NULL, 'Manual line total was fabricated');
  PERFORM pg_temp.expect(v_manual_line.inferred_unit_price_cents IS NULL, 'Manual unit price was fabricated');
  PERFORM pg_temp.expect(v_manual_line.inferred_discount_cents IS NULL, 'Manual discount was fabricated');
  PERFORM pg_temp.expect(v_manual_line.inferred_tax_cents IS NULL, 'Manual tax was fabricated');

  v_error_state := NULL;
  BEGIN
    PERFORM public.promote_receipt_parse(
      '31000000-0000-4000-8000-000000000010',
      '31000000-0000-4000-8000-000000000100',
      v_new_generation,
      1,
      'qa-rules-v1',
      'qa-provider',
      'EUR',
      '2026-09-03',
      'Reviewed overwrite store',
      100,
      '[{"raw_text":"OVERWRITE 1.00","inferred_name":"Overwrite","qty_value":1,"qty_unit":"pcs","category_id":"pantry","confidence":0.99,"confidence_level":"high"}]'::jsonb
    );
    RAISE SQLSTATE 'QA310' USING MESSAGE = 'Reviewed receipt reparse was accepted';
  EXCEPTION
    WHEN SQLSTATE 'QA310' THEN
      RAISE;
    WHEN OTHERS THEN
      v_error_state := SQLSTATE;
  END;
  PERFORM pg_temp.expect(v_error_state = 'PT409', 'Reviewed receipt reparse should fail with PT409');
  PERFORM pg_temp.expect(
    (SELECT active_parse_generation_id
     FROM public.receipts
     WHERE id = '31000000-0000-4000-8000-000000000100') = v_new_generation,
    'Rejected reviewed receipt reparse changed the active generation'
  );
  PERFORM pg_temp.expect(
    (SELECT review_status
     FROM public.receipts
     WHERE id = '31000000-0000-4000-8000-000000000100') = 'reviewed',
    'Rejected reviewed receipt reparse changed review_status'
  );
  PERFORM pg_temp.expect(
    (SELECT review_revision
     FROM public.receipts
     WHERE id = '31000000-0000-4000-8000-000000000100') = 1,
    'Rejected reviewed receipt reparse changed review_revision'
  );
  PERFORM pg_temp.expect(
    EXISTS (
      SELECT 1
      FROM public.receipt_items
      WHERE id = v_line_a
        AND generation_id = v_new_generation
        AND corrected_name = 'Bio Milk'
        AND review_state = 'reviewed'
    ),
    'Rejected reviewed receipt reparse hid accepted parser corrections'
  );
  PERFORM pg_temp.expect(
    EXISTS (
      SELECT 1
      FROM public.receipt_items
      WHERE id = v_manual_id
        AND generation_id = v_new_generation
        AND source = 'manual'
        AND client_line_id = 'manual-qa-1'
        AND review_state = 'reviewed'
    ),
    'Rejected reviewed receipt reparse hid accepted manual lines'
  );

  v_error_state := NULL;
  BEGIN
    PERFORM public.save_receipt_review(
      '31000000-0000-4000-8000-000000000010',
      '31000000-0000-4000-8000-000000000100',
      v_new_generation,
      1,
      jsonb_build_array(
        jsonb_build_object('id', v_line_a, 'included', true, 'review_state', 'reviewed', 'name', 'Rollback Milk', 'qty_value', 1, 'qty_unit', 'l', 'category_id', 'dairy'),
        jsonb_build_object('id', v_line_b, 'included', false, 'review_state', 'reviewed', 'name', 'Apple Loose', 'qty_value', 0.5, 'qty_unit', 'kg', 'category_id', 'not-a-category'),
        jsonb_build_object('id', v_manual_id, 'included', true, 'review_state', 'reviewed', 'name', 'Manual Oats', 'qty_value', 1, 'qty_unit', 'pcs', 'category_id', 'pantry')
      )
    );
    RAISE SQLSTATE 'QA310' USING MESSAGE = 'Invalid full review update was accepted';
  EXCEPTION
    WHEN SQLSTATE 'QA310' THEN
      RAISE;
    WHEN OTHERS THEN
      v_error_state := SQLSTATE;
  END;
  PERFORM pg_temp.expect(v_error_state IS NOT NULL, 'Invalid full review update should fail');
  PERFORM pg_temp.expect(
    (SELECT corrected_name FROM public.receipt_items WHERE id = v_line_a) = 'Bio Milk',
    'Failed full review update changed an earlier line'
  );
  PERFORM pg_temp.expect(
    (SELECT review_revision
     FROM public.receipts
     WHERE id = '31000000-0000-4000-8000-000000000100') = 1,
    'Failed full review update changed the receipt revision'
  );

  PERFORM pg_temp.force_receipt_item_timestamps(v_line_a, v_fixed_corrected_at, v_fixed_reviewed_at);
  PERFORM pg_temp.force_receipt_item_timestamps(v_manual_id, NULL, v_fixed_reviewed_at);

  v_noop_rows := jsonb_build_array(
    jsonb_build_object('id', v_line_a, 'included', true, 'review_state', 'reviewed', 'name', 'Bio Milk', 'qty_value', 1, 'qty_unit', 'l', 'category_id', 'dairy'),
    jsonb_build_object('id', v_line_b, 'included', false, 'review_state', 'reviewed', 'name', 'Apple Loose', 'qty_value', 0.5, 'qty_unit', 'kg', 'category_id', 'produce'),
    jsonb_build_object('id', v_manual_id, 'included', true, 'review_state', 'reviewed', 'name', 'Manual Oats', 'qty_value', 1, 'qty_unit', 'pcs', 'category_id', 'pantry')
  );

  v_snapshot := public.save_receipt_review(
    '31000000-0000-4000-8000-000000000010',
    '31000000-0000-4000-8000-000000000100',
    v_new_generation,
    1,
    v_noop_rows
  );
  PERFORM pg_temp.expect(
    (SELECT corrected_at FROM public.receipt_items WHERE id = v_line_a) = v_fixed_corrected_at,
    'No-op review save changed corrected_at on an unchanged corrected parser line'
  );
  PERFORM pg_temp.expect(
    (SELECT reviewed_at FROM public.receipt_items WHERE id = v_line_a) = v_fixed_reviewed_at,
    'No-op review save changed reviewed_at on an unchanged parser line'
  );
  PERFORM pg_temp.expect(
    (SELECT reviewed_at FROM public.receipt_items WHERE id = v_manual_id) = v_fixed_reviewed_at,
    'No-op review save changed reviewed_at on an unchanged manual line'
  );
  PERFORM pg_temp.expect(
    (v_snapshot #>> '{receipt,review_revision}')::integer = 2,
    'No-op save snapshot did not carry the incremented receipt revision'
  );

  v_snapshot := public.get_receipt_review(
    '31000000-0000-4000-8000-000000000010',
    '31000000-0000-4000-8000-000000000100'
  );
  PERFORM pg_temp.expect(
    (v_snapshot #>> '{receipt,active_parse_generation_id}')::uuid = v_new_generation,
    'Read snapshot returned the wrong active generation'
  );
  PERFORM pg_temp.expect(
    (v_snapshot #>> '{receipt,review_revision}')::integer = (
      SELECT review_revision
      FROM public.receipts
      WHERE id = '31000000-0000-4000-8000-000000000100'
    ),
    'Read snapshot returned a stale review revision'
  );
  PERFORM pg_temp.expect(
    jsonb_array_length(v_snapshot -> 'items') = (
      SELECT count(*)
      FROM public.receipt_items
      WHERE generation_id = v_new_generation
    ),
    'Read snapshot item count did not match the active generation'
  );

  v_error_state := NULL;
  BEGIN
    PERFORM public.save_receipt_review(
      '31000000-0000-4000-8000-000000000010',
      '31000000-0000-4000-8000-000000000100',
      v_new_generation,
      1,
      v_noop_rows
    );
    RAISE SQLSTATE 'QA310' USING MESSAGE = 'Stale review revision was accepted';
  EXCEPTION
    WHEN SQLSTATE 'QA310' THEN
      RAISE;
    WHEN OTHERS THEN
      v_error_state := SQLSTATE;
  END;
  PERFORM pg_temp.expect(v_error_state = 'PT409', 'Stale review save should fail with PT409');

  v_error_state := NULL;
  BEGIN
    INSERT INTO public.receipts (
      id,
      household_id,
      image_url,
      status,
      active_parse_generation_id,
      review_status,
      review_revision,
      reviewed_at,
      reviewed_by
    )
    VALUES (
      '31000000-0000-4000-8000-000000000400',
      '31000000-0000-4000-8000-000000000010',
      'sackerl://receipt/forged-workflow',
      'parsed',
      v_new_generation,
      'reviewed',
      99,
      now(),
      '31000000-0000-4000-8000-000000000001'
    );
    RAISE SQLSTATE 'QA310' USING MESSAGE = 'Direct forged receipt workflow insert was accepted';
  EXCEPTION
    WHEN SQLSTATE 'QA310' THEN
      RAISE;
    WHEN OTHERS THEN
      v_error_state := SQLSTATE;
  END;
  PERFORM pg_temp.expect(
    v_error_state IN ('PT403', '42501'),
    'Direct forged receipt workflow insert should be blocked'
  );

  v_error_state := NULL;
  BEGIN
    UPDATE public.receipts
    SET review_revision = review_revision + 1
    WHERE id = '31000000-0000-4000-8000-000000000100';
    RAISE SQLSTATE 'QA310' USING MESSAGE = 'Direct receipt workflow update was accepted';
  EXCEPTION
    WHEN SQLSTATE 'QA310' THEN
      RAISE;
    WHEN OTHERS THEN
      v_error_state := SQLSTATE;
  END;
  PERFORM pg_temp.expect(
    v_error_state IN ('PT403', '42501'),
    'Direct receipt workflow update should be blocked'
  );

  v_error_state := NULL;
  BEGIN
    INSERT INTO public.receipt_items (
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
    VALUES (
      '31000000-0000-4000-8000-000000000100',
      '31000000-0000-4000-8000-000000000010',
      v_new_generation,
      'manual',
      99,
      'direct-dml-1',
      'Direct DML',
      1,
      'pcs',
      'pantry',
      'reviewed',
      true,
      now(),
      '31000000-0000-4000-8000-000000000001'
    );
    RAISE SQLSTATE 'QA310' USING MESSAGE = 'Direct receipt item insert was accepted';
  EXCEPTION
    WHEN SQLSTATE 'QA310' THEN
      RAISE;
    WHEN OTHERS THEN
      v_error_state := SQLSTATE;
  END;
  PERFORM pg_temp.expect(
    v_error_state = '42501',
    'Direct receipt item insert should be blocked by grants/RLS'
  );
END $$;

ROLLBACK;

\echo 'SCKRL-310 adversarial SQL checks passed'
