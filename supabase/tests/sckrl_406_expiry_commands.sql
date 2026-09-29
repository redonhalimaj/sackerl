-- SCKRL-406 expiry provenance behaviour. Run after the SCKRL-406 migration on a disposable
-- database seeded with sckrl_406_legacy_seed.sql. This file manages its own transaction and
-- rolls back every mutation; do not wrap it in --single-transaction.
begin;

do $$
begin
  if to_regclass('public.item_expiry_facts') is null then
    raise exception using
      message = 'SCKRL-406 test schema is missing.',
      hint = 'Use the disposable-database replay sequence in supabase/tests/README.md.';
  end if;

  if (select count(*) from public.households where id in (
        '40600000-0000-4000-8000-000000000010',
        '40600000-0000-4000-8000-000000000020')) <> 2
    or (select count(*) from public.items where id in (
        '40600000-0000-4000-8000-000000000100',
        '40600000-0000-4000-8000-000000000101',
        '40600000-0000-4000-8000-000000000200')) <> 3
  then
    raise exception using
      message = 'SCKRL-406 legacy test fixtures are missing or not visible to this database role.',
      hint = 'Run as the disposable database owner. Seed with sckrl_406_legacy_seed.sql BEFORE the 406 migration, then run the suites in that same database. See supabase/tests/README.md; do not seed a hosted/application database.';
  end if;
end $$;

set local "request.jwt.claim.sub" = '40600000-0000-4000-8000-000000000001';

do $$
declare
  v_household constant uuid := '40600000-0000-4000-8000-000000000010';
  v_actor constant uuid := '40600000-0000-4000-8000-000000000001';
  v_fridge uuid;
  v_item uuid;
  v_item_b uuid;
  v_item_c uuid;
  v_fact public.item_expiry_facts%rowtype;
  v_previous public.item_expiry_facts%rowtype;
  v_row public.items%rowtype;
  v_first_fact uuid;
  v_count integer;
  v_raised text;
begin
  select id into strict v_fridge from public.zones
    where household_id = v_household and key = 'fridge';

  ---------------------------------------------------------------------------
  -- 1. An undeclared insert records the weakest honest provenance.
  ---------------------------------------------------------------------------
  insert into public.items (household_id, name, qty_value, qty_unit, category_id, zone_id, expires_on)
  values (v_household, 'Undeclared butter', 250, 'g', 'dairy', v_fridge, '2026-10-01')
  returning id into v_item;

  select * into strict v_row from public.items where id = v_item;
  select * into strict v_fact from public.item_expiry_facts where item_id = v_item and is_active;

  if v_fact.origin is distinct from 'inferred'
    or v_fact.source is distinct from 'estimated'
    or v_fact.confidence is not null
    or v_fact.estimator_version is not null
    or v_fact.confirmed_at is not null
    or v_fact.printed_marking is distinct from 'unknown'
  then
    raise exception '1: an undeclared write claimed provenance it does not have';
  end if;

  if v_fact.recorded_by is distinct from v_actor
    or v_fact.expires_on is distinct from '2026-10-01'::date
    or v_row.expiry_fact_id is distinct from v_fact.id
    or v_row.expiry_origin is distinct from 'inferred'
    or v_row.expiry_confirmed_at is not null
  then
    raise exception '1: undeclared insert did not project the active fact correctly';
  end if;

  ---------------------------------------------------------------------------
  -- 2. A user-entered, confirmed date.
  ---------------------------------------------------------------------------
  insert into public.items (household_id, name, qty_value, qty_unit, category_id, zone_id, expires_on, expiry_declaration)
  values (v_household, 'Typed yoghurt', 1, 'pcs', 'dairy', v_fridge, '2026-10-05',
          '{"source":"user","confirm":true}'::jsonb)
  returning id into v_item_b;

  select * into strict v_fact from public.item_expiry_facts where item_id = v_item_b and is_active;

  if v_fact.source is distinct from 'user'
    or v_fact.origin is distinct from 'declared'
    or v_fact.confirmed_at is null
    or v_fact.confirmed_by is distinct from v_actor
  then
    raise exception '2: a typed and confirmed date was not recorded as such';
  end if;

  select * into strict v_row from public.items where id = v_item_b;

  if v_row.expiry_declaration is not null then
    raise exception '2: the declaration was stored instead of being consumed';
  end if;

  ---------------------------------------------------------------------------
  -- 3. A printed date keeps its package marking separate from source.
  ---------------------------------------------------------------------------
  insert into public.items (household_id, name, qty_value, qty_unit, category_id, zone_id, expires_on, expiry_declaration)
  values (v_household, 'Printed cream', 200, 'ml', 'dairy', v_fridge, '2026-10-09',
          '{"source":"printed","printed_marking":"use_by","confirm":true}'::jsonb)
  returning id into v_item;

  select * into strict v_fact from public.item_expiry_facts where item_id = v_item and is_active;

  if v_fact.source is distinct from 'printed'
    or v_fact.printed_marking is distinct from 'use_by'
    or v_fact.confirmed_at is null
  then
    raise exception '3: printed marking or confirmation was lost';
  end if;

  ---------------------------------------------------------------------------
  -- 4. A category-zone estimate is identifiable forever after.
  ---------------------------------------------------------------------------
  insert into public.items (household_id, name, qty_value, qty_unit, category_id, zone_id, expires_on, expiry_declaration)
  values (v_household, 'Estimated cheese', 300, 'g', 'dairy', v_fridge, '2026-10-12',
          '{"source":"estimated","estimator_version":"category-zone-v1","confidence":0.5}'::jsonb)
  returning id into v_item;

  select * into strict v_fact from public.item_expiry_facts where item_id = v_item and is_active;
  v_first_fact := v_fact.id;

  if v_fact.source is distinct from 'estimated'
    or v_fact.origin is distinct from 'declared'
    or v_fact.estimator_version is distinct from 'category-zone-v1'
    or v_fact.confidence is distinct from 0.5
    or v_fact.confirmed_at is not null
  then
    raise exception '4: a declared estimate was not recorded with its estimator identity';
  end if;

  ---------------------------------------------------------------------------
  -- 4b. Confidence is normalised before idempotency comparison.
  ---------------------------------------------------------------------------
  insert into public.items (household_id, name, qty_value, qty_unit, category_id, zone_id, expires_on, expiry_declaration)
  values (v_household, 'Precise estimate', 1, 'pcs', 'dairy', v_fridge, '2026-10-13',
          '{"source":"estimated","estimator_version":"category-zone-v1","confidence":0.1234}'::jsonb)
  returning id into v_item_c;

  select * into strict v_fact from public.item_expiry_facts where item_id = v_item_c and is_active;

  if v_fact.confidence is distinct from 0.123 then
    raise exception '4b: confidence was not normalised to the stored precision';
  end if;

  update public.items
  set expiry_declaration = '{"source":"estimated","estimator_version":"category-zone-v1","confidence":0.1234}'::jsonb
  where id = v_item_c;

  select count(*) into v_count from public.item_expiry_facts where item_id = v_item_c;

  if v_count <> 1 then
    raise exception '4b: an identical high-precision retry created history noise';
  end if;

  ---------------------------------------------------------------------------
  -- 5. Confirming an estimate keeps the date and the estimate source.
  ---------------------------------------------------------------------------
  update public.items
  set expiry_declaration = jsonb_build_object(
    'source', 'estimated',
    'estimator_version', 'category-zone-v1',
    'confidence', 0.5,
    'confirm', true,
    'expected_fact_id', v_first_fact
  )
  where id = v_item;

  select * into strict v_row from public.items where id = v_item;
  select * into strict v_fact from public.item_expiry_facts where item_id = v_item and is_active;

  if v_row.expires_on is distinct from '2026-10-12'::date then
    raise exception '5: confirming an estimate moved the displayed date';
  end if;

  if v_fact.confirmed_at is null
    or v_fact.confirmed_by is distinct from v_actor
    or v_fact.source is distinct from 'estimated'
    or v_fact.supersedes_fact_id is distinct from v_first_fact
    or v_fact.id = v_first_fact
  then
    raise exception '5: confirmation did not append a superseding fact';
  end if;

  select * into strict v_previous from public.item_expiry_facts where id = v_first_fact;

  if v_previous.is_active
    or v_previous.superseded_at is null
    or v_previous.confirmed_at is not null
  then
    raise exception '5: the superseded estimate was not retained unchanged';
  end if;

  if v_fact.fact_sequence <= v_previous.fact_sequence then
    raise exception '5: fact sequence did not preserve append order';
  end if;

  ---------------------------------------------------------------------------
  -- 6. Changing a confirmed date never carries the old confirmation forward.
  ---------------------------------------------------------------------------
  update public.items set expires_on = '2026-10-20' where id = v_item;

  select * into strict v_fact from public.item_expiry_facts where item_id = v_item and is_active;

  if v_fact.confirmed_at is not null
    or v_fact.origin is distinct from 'inferred'
    or v_fact.expires_on is distinct from '2026-10-20'::date
  then
    raise exception '6: a new date inherited the previous confirmation';
  end if;

  select count(*) into v_count from public.item_expiry_facts where item_id = v_item;

  if v_count <> 3 then
    raise exception '6: expected three history rows, found %', v_count;
  end if;

  select count(*) into v_count from public.item_expiry_facts
    where item_id = v_item and confirmed_at is not null;

  if v_count <> 1 then
    raise exception '6: history lost the record of the earlier confirmation';
  end if;

  ---------------------------------------------------------------------------
  -- 7. An unrelated edit preserves provenance and confirmation.
  ---------------------------------------------------------------------------
  select * into strict v_fact from public.item_expiry_facts where item_id = v_item_b and is_active;
  v_first_fact := v_fact.id;

  update public.items set name = 'Typed yoghurt, renamed', qty_value = 2 where id = v_item_b;

  select * into strict v_row from public.items where id = v_item_b;
  select count(*) into v_count from public.item_expiry_facts where item_id = v_item_b;

  if v_row.expiry_fact_id is distinct from v_first_fact or v_count <> 1 then
    raise exception '7: an unrelated edit rewrote the expiry provenance';
  end if;

  if v_row.expiry_confirmed_at is null then
    raise exception '7: an unrelated edit dropped the confirmation';
  end if;

  ---------------------------------------------------------------------------
  -- 8. Resending the same date with no declaration changes nothing.
  ---------------------------------------------------------------------------
  update public.items set expires_on = '2026-10-05' where id = v_item_b;

  select count(*) into v_count from public.item_expiry_facts where item_id = v_item_b;
  select * into strict v_row from public.items where id = v_item_b;

  if v_count <> 1 or v_row.expiry_fact_id is distinct from v_first_fact then
    raise exception '8: an unchanged date appended a spurious fact';
  end if;

  if v_row.expiry_source is distinct from 'user' or v_row.expiry_confirmed_at is null then
    raise exception '8: an unchanged date downgraded the recorded provenance';
  end if;

  ---------------------------------------------------------------------------
  -- 9. Repeating an identical declaration is idempotent.
  ---------------------------------------------------------------------------
  update public.items
  set expiry_declaration = '{"source":"user","confirm":true}'::jsonb
  where id = v_item_b;

  select count(*) into v_count from public.item_expiry_facts where item_id = v_item_b;

  if v_count <> 1 then
    raise exception '9: a retried identical declaration created history noise';
  end if;

  ---------------------------------------------------------------------------
  -- 10. Clearing a date is a recorded user fact, not an absence.
  ---------------------------------------------------------------------------
  update public.items
  set expires_on = null,
      expiry_declaration = '{"source":"user","confirm":true}'::jsonb
  where id = v_item_b;

  select * into strict v_row from public.items where id = v_item_b;
  select * into strict v_fact from public.item_expiry_facts where item_id = v_item_b and is_active;

  if v_row.expires_on is not null then
    raise exception '10: clearing did not clear the displayed date';
  end if;

  if v_fact.expires_on is not null
    or v_fact.source is distinct from 'user'
    or v_fact.confirmed_at is null
    or v_fact.supersedes_fact_id is distinct from v_first_fact
  then
    raise exception '10: clearing did not record a user fact';
  end if;

  ---------------------------------------------------------------------------
  -- 11. A stale expected fact id rejects the write and mutates nothing.
  ---------------------------------------------------------------------------
  select * into strict v_fact from public.item_expiry_facts where item_id = v_item and is_active;
  v_first_fact := v_fact.id;
  v_raised := null;

  begin
    update public.items
    set expires_on = '2026-11-01',
        expiry_declaration = jsonb_build_object(
          'source', 'user',
          'confirm', true,
          'expected_fact_id', '40600000-0000-4000-8000-0000000009ff'
        )
    where id = v_item;
  exception
    when sqlstate 'PT409' then v_raised := 'PT409';
  end;

  if v_raised is distinct from 'PT409' then
    raise exception '11: a stale expected fact id was accepted';
  end if;

  select * into strict v_row from public.items where id = v_item;
  select count(*) into v_count from public.item_expiry_facts where item_id = v_item;

  if v_row.expires_on is distinct from '2026-10-20'::date
    or v_row.expiry_fact_id is distinct from v_first_fact
    or v_count <> 3
  then
    raise exception '11: a rejected write still mutated the item or its history';
  end if;

  ---------------------------------------------------------------------------
  -- 11b. A null expected fact id means the caller expects no active fact.
  ---------------------------------------------------------------------------
  v_raised := null;

  begin
    update public.items
    set expiry_declaration = jsonb_build_object(
          'source', 'user',
          'confirm', true,
          'expected_fact_id', null
        )
    where id = v_item;
  exception
    when sqlstate 'PT409' then v_raised := 'PT409';
  end;

  if v_raised is distinct from 'PT409' then
    raise exception '11b: a null expected fact id was accepted while an active fact existed';
  end if;

  select * into strict v_row from public.items where id = v_item;
  select count(*) into v_count from public.item_expiry_facts where item_id = v_item;

  if v_row.expires_on is distinct from '2026-10-20'::date
    or v_row.expiry_fact_id is distinct from v_first_fact
    or v_count <> 3
  then
    raise exception '11b: a rejected null-expected write still mutated the item or its history';
  end if;

  ---------------------------------------------------------------------------
  -- 12. A matching expected fact id proceeds.
  ---------------------------------------------------------------------------
  update public.items
  set expires_on = '2026-11-01',
      expiry_declaration = jsonb_build_object(
        'source', 'printed',
        'printed_marking', 'best_before',
        'confirm', true,
        'expected_fact_id', v_first_fact
      )
  where id = v_item;

  select * into strict v_fact from public.item_expiry_facts where item_id = v_item and is_active;

  if v_fact.expires_on is distinct from '2026-11-01'::date
    or v_fact.source is distinct from 'printed'
    or v_fact.printed_marking is distinct from 'best_before'
    or v_fact.confirmed_by is distinct from v_actor
  then
    raise exception '12: a matching expected fact id did not apply the correction';
  end if;

  ---------------------------------------------------------------------------
  -- 12b. A null expected fact id proceeds when no active fact exists.
  ---------------------------------------------------------------------------
  insert into public.items (household_id, name, qty_value, qty_unit, category_id, zone_id, expires_on)
  values (v_household, 'No active fact subject', 1, 'pcs', 'dairy', v_fridge, null)
  returning id into v_item_c;

  update public.items
  set expiry_declaration = jsonb_build_object(
        'source', 'user',
        'confirm', true,
        'expected_fact_id', null
      )
  where id = v_item_c;

  select * into strict v_fact from public.item_expiry_facts where item_id = v_item_c and is_active;
  select * into strict v_row from public.items where id = v_item_c;

  if v_fact.expires_on is not null
    or v_fact.source is distinct from 'user'
    or v_fact.confirmed_at is null
    or v_row.expiry_fact_id is distinct from v_fact.id
  then
    raise exception '12b: a null expected fact id did not guard the no-active-fact path';
  end if;

  ---------------------------------------------------------------------------
  -- 13. A soft removal leaves provenance untouched.
  ---------------------------------------------------------------------------
  select count(*) into v_count from public.item_expiry_facts where item_id = v_item;
  update public.items set removed_on = current_date, removal_reason = 'used' where id = v_item;

  select * into strict v_row from public.items where id = v_item;

  if v_row.expiry_fact_id is distinct from v_fact.id then
    raise exception '13: removing an item rewrote its expiry provenance';
  end if;

  if (select count(*) from public.item_expiry_facts where item_id = v_item) <> v_count then
    raise exception '13: removing an item appended an expiry fact';
  end if;

  ---------------------------------------------------------------------------
  -- 14. Batch inserts record one fact per row.
  ---------------------------------------------------------------------------
  insert into public.items (household_id, name, qty_value, qty_unit, category_id, zone_id, expires_on, expiry_declaration)
  values
    (v_household, 'Batch one', 1, 'pcs', 'pantry', v_fridge, '2026-12-01', '{"source":"user","confirm":true}'::jsonb),
    (v_household, 'Batch two', 1, 'pcs', 'pantry', v_fridge, null, null),
    (v_household, 'Batch three', 1, 'pcs', 'pantry', v_fridge, '2026-12-03',
     '{"source":"estimated","estimator_version":"category-zone-v1"}'::jsonb);

  select count(*) into v_count from public.items
    where household_id = v_household and name like 'Batch %' and expiry_fact_id is not null;

  if v_count <> 2 then
    raise exception '14: batch insert did not record exactly the dated rows, found %', v_count;
  end if;

  ---------------------------------------------------------------------------
  -- 15. The projection and the active fact never disagree.
  ---------------------------------------------------------------------------
  select count(*) into v_count
  from public.items
  left join public.item_expiry_facts as active
    on active.item_id = items.id and active.is_active
  where items.expires_on is distinct from active.expires_on
     or items.expiry_fact_id is distinct from active.id
     or items.expiry_source is distinct from active.source
     or items.expiry_origin is distinct from active.origin
     or items.expiry_confirmed_at is distinct from active.confirmed_at;

  if v_count <> 0 then
    raise exception '15: % rows have a projection that disagrees with the active fact', v_count;
  end if;

  raise notice 'SCKRL-406 expiry command assertions passed';
end $$;

-- 16. Every invalid declaration is rejected before anything is written.
do $$
declare
  v_household constant uuid := '40600000-0000-4000-8000-000000000010';
  v_fridge uuid;
  v_item uuid;
  v_before integer;
  v_case record;
  v_raised text;
begin
  select id into strict v_fridge from public.zones
    where household_id = v_household and key = 'fridge';

  insert into public.items (household_id, name, qty_value, qty_unit, category_id, zone_id, expires_on, expiry_declaration)
  values (v_household, 'Validation subject', 1, 'pcs', 'dairy', v_fridge, '2026-10-01',
          '{"source":"user","confirm":true}'::jsonb)
  returning id into v_item;

  select count(*) into v_before from public.item_expiry_facts where item_id = v_item;

  for v_case in
    select *
    from (values
      ('model source is reserved but rejected', '{"source":"model"}'::jsonb, '2026-10-02'::date),
      ('unknown source', '{"source":"guessed"}'::jsonb, '2026-10-02'::date),
      ('missing source', '{"confirm":true}'::jsonb, '2026-10-02'::date),
      ('unsupported key', '{"source":"user","confirmed_by":"40600000-0000-4000-8000-000000000002"}'::jsonb, '2026-10-02'::date),
      ('actor cannot be named', '{"source":"user","recorded_by":"40600000-0000-4000-8000-000000000002"}'::jsonb, '2026-10-02'::date),
      ('printed needs a date', '{"source":"printed"}'::jsonb, null::date),
      ('clearing needs the user source', '{"source":"estimated"}'::jsonb, null::date),
      ('confidence needs an estimate', '{"source":"user","confidence":0.5}'::jsonb, '2026-10-02'::date),
      ('confidence above one', '{"source":"estimated","confidence":1.5}'::jsonb, '2026-10-02'::date),
      ('confidence below zero', '{"source":"estimated","confidence":-0.1}'::jsonb, '2026-10-02'::date),
      ('confidence must be numeric', '{"source":"estimated","confidence":"high"}'::jsonb, '2026-10-02'::date),
      ('estimator needs an estimate', '{"source":"printed","estimator_version":"v1"}'::jsonb, '2026-10-02'::date),
      ('estimator must be a string', '{"source":"estimated","estimator_version":7}'::jsonb, '2026-10-02'::date),
      ('a guess has no printed marking', '{"source":"estimated","printed_marking":"use_by"}'::jsonb, '2026-10-02'::date),
      ('unknown printed marking', '{"source":"printed","printed_marking":"sell_by"}'::jsonb, '2026-10-02'::date),
      ('confirm must be a boolean', '{"source":"user","confirm":"yes"}'::jsonb, '2026-10-02'::date),
      ('expected fact id must be a uuid', '{"source":"user","expected_fact_id":"not-a-uuid"}'::jsonb, '2026-10-02'::date),
      ('declaration must be an object', '["source"]'::jsonb, '2026-10-02'::date)
    ) as cases(label, declaration, next_date)
  loop
    v_raised := null;

    begin
      update public.items
      set expires_on = v_case.next_date,
          expiry_declaration = v_case.declaration
      where id = v_item;
    exception
      when sqlstate 'PT400' then v_raised := 'PT400';
    end;

    if v_raised is distinct from 'PT400' then
      raise exception '16: "%" was accepted instead of rejected', v_case.label;
    end if;
  end loop;

  if (select count(*) from public.item_expiry_facts where item_id = v_item) <> v_before then
    raise exception '16: a rejected declaration still wrote history';
  end if;

  if (select expires_on from public.items where id = v_item) is distinct from '2026-10-01'::date then
    raise exception '16: a rejected declaration still moved the displayed date';
  end if;

  raise notice 'SCKRL-406 declaration validation assertions passed';
end $$;

-- 17. A failed statement inside a transaction leaves a coherent projection and history.
do $$
declare
  v_household constant uuid := '40600000-0000-4000-8000-000000000010';
  v_fridge uuid;
  v_item uuid;
  v_fact uuid;
  v_count integer;
  v_raised boolean := false;
begin
  select id into strict v_fridge from public.zones
    where household_id = v_household and key = 'fridge';

  insert into public.items (household_id, name, qty_value, qty_unit, category_id, zone_id, expires_on, expiry_declaration)
  values (v_household, 'Rollback subject', 1, 'pcs', 'dairy', v_fridge, '2026-10-01',
          '{"source":"printed","printed_marking":"use_by","confirm":true}'::jsonb)
  returning id into v_item;

  select expiry_fact_id into strict v_fact from public.items where id = v_item;

  begin
    -- A valid expiry change followed by an invalid quantity in the same statement set.
    update public.items
    set expires_on = '2026-10-15',
        expiry_declaration = '{"source":"user","confirm":true}'::jsonb
    where id = v_item;

    update public.items set qty_value = -1 where id = v_item;
  exception
    when check_violation then v_raised := true;
  end;

  if not v_raised then
    raise exception '17: the injected failure did not occur';
  end if;

  if (select expiry_fact_id from public.items where id = v_item) is distinct from v_fact then
    raise exception '17: rollback left the projection pointing at a rolled-back fact';
  end if;

  select count(*) into v_count from public.item_expiry_facts where item_id = v_item;

  if v_count <> 1 then
    raise exception '17: rollback left % history rows instead of 1', v_count;
  end if;

  if (select is_active from public.item_expiry_facts where id = v_fact) is distinct from true then
    raise exception '17: rollback left the original fact superseded with no successor';
  end if;

  raise notice 'SCKRL-406 failure-rollback assertions passed';
end $$;

-- Settle the deferrable item foreign key so the rollback below cannot hide a violation.
set constraints all immediate;

rollback;
