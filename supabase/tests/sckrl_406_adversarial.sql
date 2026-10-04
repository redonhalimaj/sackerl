-- SCKRL-406 authorization and tamper resistance. Run after the SCKRL-406 migration on a
-- disposable database seeded with sckrl_406_legacy_seed.sql. Manages its own transaction.
begin;

-- Check prerequisites before creating the extra member. These are test-fixture IDs, not
-- application households; this suite does not create or repair its legacy seed implicitly.
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

INSERT INTO auth.users(id,email) VALUES
  ('40600000-0000-4000-8000-000000000003','s406-household-member@example.invalid')
ON CONFLICT DO NOTHING;

INSERT INTO public.users(id,email,locale) VALUES
  ('40600000-0000-4000-8000-000000000003','s406-household-member@example.invalid','de')
ON CONFLICT DO NOTHING;

INSERT INTO public.household_members(household_id,user_id,role) VALUES
  ('40600000-0000-4000-8000-000000000010','40600000-0000-4000-8000-000000000003','member')
ON CONFLICT DO NOTHING;

-- 1. Database-owned values cannot be forged through an item payload.
do $$
declare
  v_household constant uuid := '40600000-0000-4000-8000-000000000010';
  v_actor constant uuid := '40600000-0000-4000-8000-000000000001';
  v_outsider constant uuid := '40600000-0000-4000-8000-000000000002';
  v_fridge uuid;
  v_item uuid;
  v_row public.items%rowtype;
  v_fact public.item_expiry_facts%rowtype;
begin
  select id into strict v_fridge from public.zones
    where household_id = v_household and key = 'fridge';

  insert into public.items (
    household_id, name, qty_value, qty_unit, category_id, zone_id, expires_on,
    expiry_fact_id, expiry_source, expiry_origin, expiry_printed_marking, expiry_confirmed_at
  )
  values (
    v_household, 'Spoofed projection', 1, 'pcs', 'dairy', v_fridge, '2026-10-01',
    '40600000-0000-4000-8000-0000000009ee', 'printed', 'declared', 'use_by', '2020-01-01T00:00:00Z'
  )
  returning id into v_item;

  select * into strict v_row from public.items where id = v_item;
  select * into strict v_fact from public.item_expiry_facts where item_id = v_item and is_active;

  if v_row.expiry_fact_id is distinct from v_fact.id
    or v_row.expiry_source is distinct from 'estimated'
    or v_row.expiry_origin is distinct from 'inferred'
    or v_row.expiry_printed_marking is distinct from 'unknown'
    or v_row.expiry_confirmed_at is not null
  then
    raise exception '1: client-supplied projection values survived an insert';
  end if;

  if v_fact.confirmed_at is not null or v_fact.confirmed_by is not null then
    raise exception '1: a forged projection produced a forged confirmation';
  end if;

  update public.items
  set expiry_source = 'printed',
      expiry_origin = 'declared',
      expiry_printed_marking = 'use_by',
      expiry_confirmed_at = now(),
      expiry_fact_id = '40600000-0000-4000-8000-0000000009ee'
  where id = v_item;

  select * into strict v_row from public.items where id = v_item;

  if v_row.expiry_fact_id is distinct from v_fact.id
    or v_row.expiry_source is distinct from 'estimated'
    or v_row.expiry_confirmed_at is not null
  then
    raise exception '1: client-supplied projection values survived an update';
  end if;

  -- The confirming actor is always the session, never a payload value.
  update public.items
  set expiry_declaration = '{"source":"user","confirm":true}'::jsonb
  where id = v_item;

  select * into strict v_fact from public.item_expiry_facts where item_id = v_item and is_active;

  if v_fact.confirmed_by is distinct from v_actor or v_fact.recorded_by is distinct from v_actor then
    raise exception '1: the recorded actor was not the authenticated session';
  end if;

  if v_fact.confirmed_by = v_outsider then
    raise exception '1: another user was credited with the confirmation';
  end if;

  raise notice 'SCKRL-406 forged-payload assertions passed';
end $$;

-- 2. An expected fact id from another household is refused.
do $$
declare
  v_household constant uuid := '40600000-0000-4000-8000-000000000010';
  v_fridge uuid;
  v_item uuid;
  v_foreign_fact uuid;
  v_raised text;
begin
  select id into strict v_fridge from public.zones
    where household_id = v_household and key = 'fridge';

  select id into strict v_foreign_fact from public.item_expiry_facts
    where item_id = '40600000-0000-4000-8000-000000000200';

  insert into public.items (household_id, name, qty_value, qty_unit, category_id, zone_id, expires_on, expiry_declaration)
  values (v_household, 'Cross household subject', 1, 'pcs', 'dairy', v_fridge, '2026-10-01',
          '{"source":"user","confirm":true}'::jsonb)
  returning id into v_item;

  v_raised := null;

  begin
    update public.items
    set expires_on = '2026-10-02',
        expiry_declaration = jsonb_build_object('source', 'user', 'expected_fact_id', v_foreign_fact)
    where id = v_item;
  exception
    when sqlstate 'PT403' then v_raised := 'PT403';
  end;

  if v_raised is distinct from 'PT403' then
    raise exception '2: a cross-household expiry fact reference was accepted';
  end if;

  if (select expires_on from public.items where id = v_item) is distinct from '2026-10-01'::date then
    raise exception '2: the refused cross-household write still moved the date';
  end if;

  raise notice 'SCKRL-406 cross-household assertions passed';
end $$;

-- 3. History is append-only even for a caller that can reach the table directly.
do $$
declare
  v_household constant uuid := '40600000-0000-4000-8000-000000000010';
  v_fridge uuid;
  v_item uuid;
  v_fact uuid;
  v_raised text;
begin
  select id into strict v_fridge from public.zones
    where household_id = v_household and key = 'fridge';

  insert into public.items (household_id, name, qty_value, qty_unit, category_id, zone_id, expires_on, expiry_declaration)
  values (v_household, 'History subject', 1, 'pcs', 'dairy', v_fridge, '2026-10-01',
          '{"source":"printed","printed_marking":"use_by","confirm":true}'::jsonb)
  returning id into v_item;

  select expiry_fact_id into strict v_fact from public.items where id = v_item;

  v_raised := null;
  begin
    update public.item_expiry_facts set expires_on = '2030-01-01' where id = v_fact;
  exception
    when sqlstate 'PT403' then v_raised := 'PT403';
  end;

  if v_raised is distinct from 'PT403' then
    raise exception '3: an expiry fact was edited in place';
  end if;

  v_raised := null;
  begin
    update public.item_expiry_facts set confirmed_by = '40600000-0000-4000-8000-000000000002' where id = v_fact;
  exception
    when sqlstate 'PT403' then v_raised := 'PT403';
  end;

  if v_raised is distinct from 'PT403' then
    raise exception '3: the confirming actor was rewritten after the fact';
  end if;

  v_raised := null;
  begin
    delete from public.item_expiry_facts where id = v_fact;
  exception
    when sqlstate 'PT403' then v_raised := 'PT403';
  end;

  if v_raised is distinct from 'PT403' then
    raise exception '3: expiry history was deleted while its item still exists';
  end if;

  if (select count(*) from public.item_expiry_facts where id = v_fact) <> 1 then
    raise exception '3: the guarded fact disappeared anyway';
  end if;

  -- Deleting the item itself still cascades its history.
  delete from public.items where id = v_item;

  if (select count(*) from public.item_expiry_facts where item_id = v_item) <> 0 then
    raise exception '3: deleting an item left orphaned expiry history';
  end if;

  raise notice 'SCKRL-406 append-only assertions passed';
end $$;

-- 4. Household calendar zones are validated, and the pilot default is unchanged.
do $$
declare
  v_household constant uuid := '40600000-0000-4000-8000-000000000010';
  v_raised boolean;
begin
  if (select calendar_time_zone from public.households where id = v_household) is distinct from 'Europe/Vienna' then
    raise exception '4: the household calendar default is not the Europe/Vienna pilot value';
  end if;

  v_raised := false;
  begin
    update public.households set calendar_time_zone = 'Not/AZone' where id = v_household;
  exception
    when sqlstate 'PT400' then v_raised := true;
  end;

  if not v_raised then
    raise exception '4: an unknown IANA zone was accepted';
  end if;

  -- The validating trigger runs before the syntactic CHECK, so a malformed value is reported
  -- as PT400 too. The CHECK constraint remains as defense in depth if the trigger is ever
  -- dropped, and is not separately reachable from here.
  v_raised := false;
  begin
    update public.households set calendar_time_zone = 'definitely not a zone' where id = v_household;
  exception
    when sqlstate 'PT400' then v_raised := true;
    when check_violation then v_raised := true;
  end;

  if not v_raised then
    raise exception '4: a malformed calendar zone was accepted';
  end if;

  update public.households set calendar_time_zone = 'America/Argentina/Buenos_Aires' where id = v_household;

  if (select calendar_time_zone from public.households where id = v_household)
    is distinct from 'America/Argentina/Buenos_Aires'
  then
    raise exception '4: a valid IANA zone was not stored';
  end if;

  update public.households set calendar_time_zone = 'Europe/Vienna' where id = v_household;

  raise notice 'SCKRL-406 calendar zone assertions passed';
end $$;

-- 5. Under the application role, history is readable only inside the household and never writable.
set local role authenticated;

do $$
declare
  v_raised text;
  v_visible integer;
  v_updated integer;
begin
  update public.households
  set calendar_time_zone = 'Europe/Berlin'
  where id = '40600000-0000-4000-8000-000000000010';
  get diagnostics v_updated = row_count;

  if v_updated <> 1 or (select calendar_time_zone from public.households
      where id = '40600000-0000-4000-8000-000000000010') is distinct from 'Europe/Berlin'
  then
    raise exception '5: an authenticated owner cannot update their household calendar zone';
  end if;

  update public.households set calendar_time_zone = 'Europe/Vienna'
  where id = '40600000-0000-4000-8000-000000000010';

  select count(*) into v_visible from public.item_expiry_facts
    where household_id = '40600000-0000-4000-8000-000000000010';

  if v_visible < 1 then
    raise exception '5: a household member cannot read their own expiry history';
  end if;

  if (select count(*) from public.item_expiry_facts
      where household_id = '40600000-0000-4000-8000-000000000020') <> 0
  then
    raise exception '5: a member can read another household''s expiry history';
  end if;

  v_raised := null;
  begin
    insert into public.item_expiry_facts (household_id, item_id, expires_on, source, origin)
    values ('40600000-0000-4000-8000-000000000010', '40600000-0000-4000-8000-000000000100',
            '2030-01-01', 'printed', 'declared');
  exception
    when insufficient_privilege then v_raised := 'denied';
  end;

  if v_raised is distinct from 'denied' then
    raise exception '5: the application role can write expiry history directly';
  end if;

  v_raised := null;
  begin
    update public.item_expiry_facts set expires_on = '2030-01-01'
      where household_id = '40600000-0000-4000-8000-000000000010';
  exception
    when insufficient_privilege then v_raised := 'denied';
    when sqlstate 'PT403' then v_raised := 'denied';
  end;

  if v_raised is distinct from 'denied' then
    raise exception '5: the application role can edit expiry history directly';
  end if;

  raise notice 'SCKRL-406 application-role assertions passed';
end $$;

-- 6. A household member can read the household calendar zone but cannot update it.
set local "request.jwt.claim.sub" = '40600000-0000-4000-8000-000000000003';

do $$
declare
  v_updated integer;
begin
  if (select count(*) from public.households
      where id = '40600000-0000-4000-8000-000000000010'
        and calendar_time_zone = 'Europe/Vienna') <> 1
  then
    raise exception '6: a household member cannot read their household calendar zone';
  end if;

  if (select count(*) from public.households
      where id = '40600000-0000-4000-8000-000000000020') <> 0
  then
    raise exception '6: a household member can read another household calendar zone';
  end if;

  update public.households
  set calendar_time_zone = 'Europe/Berlin'
  where id = '40600000-0000-4000-8000-000000000010';

  get diagnostics v_updated = row_count;

  if v_updated <> 0 then
    raise exception '6: a household member updated the owner-only calendar zone';
  end if;

  if (select calendar_time_zone from public.households
      where id = '40600000-0000-4000-8000-000000000010') is distinct from 'Europe/Vienna'
  then
    raise exception '6: a denied member calendar update still changed the row';
  end if;

  raise notice 'SCKRL-406 member household calendar assertions passed';
end $$;

set local "request.jwt.claim.sub" = '40600000-0000-4000-8000-000000000002';

do $$
begin
  if (select count(*) from public.item_expiry_facts
      where household_id = '40600000-0000-4000-8000-000000000010') <> 0
  then
    raise exception '7: a non-member can read another household''s expiry history';
  end if;

  if (select count(*) from public.item_expiry_facts
      where household_id = '40600000-0000-4000-8000-000000000020') < 1
  then
    raise exception '7: the outside household cannot read its own expiry history';
  end if;

  if (select count(*) from public.households
      where id = '40600000-0000-4000-8000-000000000010') <> 0
  then
    raise exception '7: a non-member can read another household calendar zone';
  end if;

  if (select count(*) from public.households
      where id = '40600000-0000-4000-8000-000000000020') <> 1
  then
    raise exception '7: the outside household cannot read its own calendar zone';
  end if;

  raise notice 'SCKRL-406 non-member isolation assertions passed';
end $$;

reset role;
set local "request.jwt.claim.sub" = '40600000-0000-4000-8000-000000000001';

-- 8. A fact cannot name an item from another household. Checked last because it settles
--    the deferrable foreign key for the rest of this transaction.
do $$
declare
  v_raised boolean := false;
begin
  begin
    -- Inserted inactive so only the household-scoped foreign key can reject it.
    insert into public.item_expiry_facts (
      household_id, item_id, expires_on, source, origin, is_active, superseded_at
    )
    values ('40600000-0000-4000-8000-000000000020', '40600000-0000-4000-8000-000000000100',
            '2030-01-01', 'printed', 'declared', false, now());
    set constraints all immediate;
  exception
    when foreign_key_violation then v_raised := true;
  end;

  if not v_raised then
    raise exception '8: a fact referenced an item outside its household';
  end if;

  raise notice 'SCKRL-406 household-scoped reference assertions passed';
end $$;

set constraints all immediate;

rollback;
