-- Application-role grants, lineage, RLS, immutable facts and documented deletion behavior.
-- All mutations run in a rollback-only transaction on the prepared disposable replay.
\set ON_ERROR_STOP on
begin;
create or replace function pg_temp.expect(condition boolean,message text) returns void
language plpgsql as $$ begin if condition is not true then raise exception '%',message; end if; end; $$;
create or replace function pg_temp.expect_error(command text,expected_state text,expected_code text default null)
returns void language plpgsql as $$
declare v_state text; v_detail text;
begin
  begin execute command;
  exception when others then
    get stacked diagnostics v_state=returned_sqlstate,v_detail=pg_exception_detail;
    if v_state<>expected_state then raise exception 'Expected %, got %: %',expected_state,v_state,sqlerrm; end if;
    if expected_code is not null and coalesce(v_detail,'') not like '%'||expected_code||'%' then
      raise exception 'Expected detail %, got %',expected_code,v_detail;
    end if;
    return;
  end;
  raise exception 'Expected SQLSTATE % but statement succeeded.',expected_state;
end; $$;

do $$ begin
  if not exists (select 1 from public.receipts where id='31100000-0000-4000-8000-000000000100')
    or not exists (select 1 from public.receipts where id='31100000-0000-4000-8000-000000000200') then
    raise exception 'Missing SCKRL-311 seed; run the populated pre-upgrade fixture first.';
  end if;
end; $$;

-- Preserve all pre-311 item column privileges, deny the new lineage column to both app roles.
do $$
declare c text;
begin
  foreach c in array array['id','household_id','name','qty_value','qty_unit','category_id','zone_id','expires_on','added_on',
    'removed_on','source','removal_reason','expiry_fact_id','expiry_source','expiry_origin','expiry_printed_marking',
    'expiry_confirmed_at','expiry_declaration'] loop
    if not has_column_privilege('authenticated','public.items',c,'INSERT')
      or not has_column_privilege('authenticated','public.items',c,'UPDATE')
      or not has_column_privilege('service_role','public.items',c,'INSERT')
      or not has_column_privilege('service_role','public.items',c,'UPDATE') then
      raise exception 'Pre-311 item column privilege was lost: %',c;
    end if;
  end loop;
  if has_column_privilege('authenticated','public.items','source_receipt_item_id','INSERT')
    or has_column_privilege('authenticated','public.items','source_receipt_item_id','UPDATE')
    or has_column_privilege('service_role','public.items','source_receipt_item_id','INSERT')
    or has_column_privilege('service_role','public.items','source_receipt_item_id','UPDATE') then
    raise exception 'Application roles may directly write receipt lineage.';
  end if;
  if not (select rolbypassrls from pg_roles where rolname='service_role')
    or not has_table_privilege('service_role','public.items','SELECT')
    or not has_table_privilege('service_role','public.items','DELETE') then
    raise exception 'Service-role RLS bypass and prior item table rights must remain intact.';
  end if;
end; $$;

-- Owner-level forged writes still meet the source/household guard; generic clients cannot set lineage.
do $$
declare fridge uuid; foreign_line uuid;
begin
  select id into strict fridge from public.zones where household_id='31100000-0000-4000-8000-000000000010' and key='fridge';
  select id into strict foreign_line from public.receipt_items where receipt_id='31100000-0000-4000-8000-000000000200' limit 1;
  perform pg_temp.expect_error(format($q$insert into public.items(household_id,name,qty_value,qty_unit,category_id,zone_id,source,source_receipt_item_id)
    values (%L,'Cross household forged source',1,'pcs','pantry',%L,'receipt',%L)$q$,
    '31100000-0000-4000-8000-000000000010',fridge,foreign_line),'PT422','RECEIPT_LINEAGE_REQUIRED');
  perform pg_temp.expect_error(format($q$update public.items set source_receipt_item_id=%L where id='31100000-0000-4000-8000-000000000300'$q$,
    foreign_line),'PT422','RECEIPT_LINEAGE_REQUIRED');
end; $$;

set local role authenticated;
select set_config('request.jwt.claim.sub','31100000-0000-4000-8000-000000000001',true);
do $$
declare z uuid; before_count bigint;
begin
  select id into strict z from public.zones where household_id='31100000-0000-4000-8000-000000000010' and key='fridge';
  select count(*) into before_count from public.items where name like 'S311 %';
  perform pg_temp.expect_error(format(
    'insert into public.items(household_id,name,qty_value,qty_unit,category_id,zone_id,source) values (%L,%L,1,''pcs'',''pantry'',%L,''receipt'')',
    '31100000-0000-4000-8000-000000000010','Forbidden generic receipt item',z),'PT422','RECEIPT_LINEAGE_REQUIRED');
  insert into public.items(household_id,name,qty_value,qty_unit,category_id,zone_id,source)
    values ('31100000-0000-4000-8000-000000000010','S311 manual transition check',1,'pcs','pantry',z,'manual');
  perform pg_temp.expect_error($q$update public.items set source='receipt' where name='S311 manual transition check'$q$,
    'PT422','RECEIPT_LINEAGE_REQUIRED');
  perform pg_temp.expect_error(format($q$update public.items set source_receipt_item_id=%L where id='31100000-0000-4000-8000-000000000300'$q$,
    '31100000-0000-4000-8000-000000000999'),'42501');
  perform pg_temp.expect_error($q$update public.items set source_receipt_item_id=null where id='31100000-0000-4000-8000-000000000300'$q$,'42501');
  delete from public.items where name='S311 manual transition check';

  -- A multi-row generic batch is statement-atomic when any receipt-source row is rejected.
  perform pg_temp.expect_error(format($q$insert into public.items(household_id,name,qty_value,qty_unit,category_id,zone_id,source)
    values (%L,'S311 batch manual',1,'pcs','pantry',%L,'manual'),(%L,'S311 batch receipt',1,'pcs','pantry',%L,'receipt')$q$,
    '31100000-0000-4000-8000-000000000010',z,'31100000-0000-4000-8000-000000000010',z),'PT422','RECEIPT_LINEAGE_REQUIRED');
  perform pg_temp.expect((select count(*)=before_count from public.items where name like 'S311 %'),
    'A rejected batch must not retain its valid manual row.');

  update public.items set name='Legacy receipt item edited'
   where id='31100000-0000-4000-8000-000000000300';
  perform pg_temp.expect((select source='receipt' and source_receipt_item_id is null and name='Legacy receipt item edited'
    from public.items where id='31100000-0000-4000-8000-000000000300'),
    'Legacy unlinked receipt stock must remain editable.');
end; $$;

-- New placement/event rows are member-readable and app-role write-protected.
do $$
begin
  if has_table_privilege('authenticated','public.receipt_placements','INSERT')
    or has_table_privilege('authenticated','public.receipt_placements','UPDATE')
    or has_table_privilege('authenticated','public.receipt_placements','DELETE')
    or has_table_privilege('authenticated','public.inventory_acquisition_events','INSERT')
    or has_table_privilege('authenticated','public.inventory_acquisition_events','UPDATE')
    or has_table_privilege('authenticated','public.inventory_acquisition_events','DELETE') then
    raise exception 'Authenticated callers may write immutable placement metadata or events.';
  end if;
  if has_table_privilege('service_role','public.receipt_placements','INSERT')
    or has_table_privilege('service_role','public.receipt_placements','UPDATE')
    or has_table_privilege('service_role','public.receipt_placements','DELETE')
    or has_table_privilege('service_role','public.inventory_acquisition_events','INSERT')
    or has_table_privilege('service_role','public.inventory_acquisition_events','UPDATE')
    or has_table_privilege('service_role','public.inventory_acquisition_events','DELETE') then
    raise exception 'Service role may write immutable placement metadata or events.';
  end if;
end; $$;


-- Place as a household member, then verify the lineage column remains server-owned.
set local role authenticated;
select set_config('request.jwt.claim.sub','31100000-0000-4000-8000-000000000002',true);
do $$
declare review jsonb; assignments jsonb; zone uuid; reply jsonb; linked_item uuid; source_line uuid;
begin
  review:=public.get_receipt_review('31100000-0000-4000-8000-000000000010','31100000-0000-4000-8000-000000000100');
  select id into strict zone from public.zones where household_id='31100000-0000-4000-8000-000000000010' and key='fridge';
  select jsonb_agg(jsonb_build_object('receiptItemId',item->>'id','zoneId',zone) order by item->>'id') into assignments
    from jsonb_array_elements(review->'items') item where (item->>'included')::boolean;
  reply:=public.finalize_receipt_placement('31100000-0000-4000-8000-000000000010',
    '31100000-0000-4000-8000-000000000100',(review #>> '{receipt,active_parse_generation_id}')::uuid,
    (review #>> '{receipt,review_revision}')::integer,'31100000-0000-4000-8000-000000000603',assignments);
  select (reply #>> '{placement,items,0,itemId}')::uuid,(reply #>> '{placement,items,0,receiptItemId}')::uuid
    into linked_item,source_line;
  perform pg_temp.expect(reply->>'outcome'='placed','Adversarial fixture could not create its placement.');
  perform pg_temp.expect((select count(*)=1 from public.receipt_placements where receipt_id='31100000-0000-4000-8000-000000000100')
    and (select count(*)=3 from public.inventory_acquisition_events where receipt_id='31100000-0000-4000-8000-000000000100'),
    'Member reads must expose placement and included-line events.');
  perform pg_temp.expect_error(format($q$update public.items set source_receipt_item_id=%L where id='31100000-0000-4000-8000-000000000300'$q$,
    source_line),'42501');
  perform pg_temp.expect_error($q$update public.items set source_receipt_item_id=null where id=(
    select id from public.items where source_receipt_item_id is not null limit 1)$q$,'42501');
  perform pg_temp.expect_error(format($q$insert into public.items(household_id,name,qty_value,qty_unit,category_id,zone_id,source,source_receipt_item_id)
    values ('31100000-0000-4000-8000-000000000010','S311 authenticated forged',1,'pcs','pantry',%L,'receipt',%L)$q$,
    zone,source_line),'42501');
  perform pg_temp.expect_error(format('insert into public.inventory_acquisition_events(id,household_id,item_id,quantity_delta,qty_unit,zone_id,actor_id,occurred_at,idempotency_key) values (%L,%L,%L,1,''pcs'',%L,%L,now(),%L)',
    gen_random_uuid(),'31100000-0000-4000-8000-000000000010',linked_item,zone,
    '31100000-0000-4000-8000-000000000002','31100000-0000-4000-8000-000000000999'),'42501');
  perform pg_temp.expect_error('delete from public.receipt_placements where receipt_id=''31100000-0000-4000-8000-000000000100''','42501');
end; $$;

-- service_role keeps its previous ordinary item rights, including BYPASSRLS, but cannot write lineage.
reset role;
set local role service_role;
do $$
declare linked_item uuid; line_id uuid;
begin
  select id,source_receipt_item_id into strict linked_item,line_id from public.items
    where household_id='31100000-0000-4000-8000-000000000010' and source_receipt_item_id is not null limit 1;
  perform pg_temp.expect_error(format($q$update public.items set source_receipt_item_id=%L where id=%L$q$,
    '31100000-0000-4000-8000-000000000999',linked_item),'42501');
  perform pg_temp.expect_error(format($q$update public.items set source_receipt_item_id=null where id=%L$q$,linked_item),'42501');
  perform pg_temp.expect_error(format($q$insert into public.items(household_id,name,qty_value,qty_unit,category_id,zone_id,source,source_receipt_item_id)
    values ('31100000-0000-4000-8000-000000000010','S311 service forged',1,'pcs','pantry',
      (select id from public.zones where household_id='31100000-0000-4000-8000-000000000010' and key='fridge'),'receipt',%L)$q$,
    line_id),'42501');
  update public.items set name='Service role ordinary edit' where id='31100000-0000-4000-8000-000000000300';
  perform pg_temp.expect((select name='Service role ordinary edit' from public.items where id='31100000-0000-4000-8000-000000000300'),
    'Service role lost a prior ordinary item update right.');
end; $$;

-- A non-member sees neither metadata nor events, even with RLS bypass unavailable to authenticated.
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','31100000-0000-4000-8000-000000000003',true);
do $$
begin
  perform pg_temp.expect((select count(*)=0 from public.receipt_placements),'A non-member can read placement rows through RLS.');
  perform pg_temp.expect((select count(*)=0 from public.inventory_acquisition_events),'A non-member can read event rows through RLS.');
  perform pg_temp.expect_error('select public.get_receipt_placement(''31100000-0000-4000-8000-000000000010'',''31100000-0000-4000-8000-000000000100'')',
    'PT403','HOUSEHOLD_ACCESS_REQUIRED');
end; $$;

-- Account deletion must not erase actor IDs; membership revocation must deny later reads.
reset role;
delete from auth.users where id='31100000-0000-4000-8000-000000000002';
set local role authenticated;
select set_config('request.jwt.claim.sub','31100000-0000-4000-8000-000000000001',true);
do $$
begin
  perform pg_temp.expect((select placed_by='31100000-0000-4000-8000-000000000002'
      from public.receipt_placements where receipt_id='31100000-0000-4000-8000-000000000100')
    and (select bool_and(actor_id='31100000-0000-4000-8000-000000000002')
      from public.inventory_acquisition_events where receipt_id='31100000-0000-4000-8000-000000000100'),
    'Deleting an actor account must not rewrite placement/event provenance.');
end; $$;
select set_config('request.jwt.claim.sub','31100000-0000-4000-8000-000000000002',true);
do $$
begin
  perform pg_temp.expect_error('select public.get_receipt_placement(''31100000-0000-4000-8000-000000000010'',''31100000-0000-4000-8000-000000000100'')',
    'PT403','HOUSEHOLD_ACCESS_REQUIRED');
end; $$;

-- Receipt deletion clears nullable provenance links and retains stock/event rows.
reset role;
delete from public.receipts where id='31100000-0000-4000-8000-000000000100';
do $$
begin
  if exists (select 1 from public.items where source_receipt_item_id is not null and household_id='31100000-0000-4000-8000-000000000010')
    or (select count(*) from public.items where household_id='31100000-0000-4000-8000-000000000010') <> 4
    or (select count(*) from public.inventory_acquisition_events where household_id='31100000-0000-4000-8000-000000000010') <> 3
    or exists (select 1 from public.inventory_acquisition_events where receipt_id is not null or placement_id is not null or source_receipt_item_id is not null)
    or exists (select 1 from public.receipt_placements where receipt_id='31100000-0000-4000-8000-000000000100') then
    raise exception 'Receipt deletion must retain stock/events and clear nullable references/results.';
  end if;
end; $$;

-- Household deletion remains available and cascades placement-owned records.
set local role authenticated;
select set_config('request.jwt.claim.sub','31100000-0000-4000-8000-000000000003',true);
do $$
declare review jsonb; assignment jsonb; zone uuid; reply jsonb;
begin
  review:=public.get_receipt_review('31100000-0000-4000-8000-000000000020','31100000-0000-4000-8000-000000000200');
  select id into strict zone from public.zones where household_id='31100000-0000-4000-8000-000000000020' and key='fridge';
  select jsonb_build_array(jsonb_build_object('receiptItemId',item->>'id','zoneId',zone)) into assignment
    from jsonb_array_elements(review->'items') item where (item->>'included')::boolean;
  reply:=public.finalize_receipt_placement('31100000-0000-4000-8000-000000000020',
    '31100000-0000-4000-8000-000000000200',(review #>> '{receipt,active_parse_generation_id}')::uuid,
    (review #>> '{receipt,review_revision}')::integer,'31100000-0000-4000-8000-000000000604',assignment);
  perform pg_temp.expect(reply->>'outcome'='placed','Household deletion fixture placement failed.');
end; $$;
reset role;
delete from public.households where id='31100000-0000-4000-8000-000000000020';
do $$
begin
  if exists (select 1 from public.receipt_placements where household_id='31100000-0000-4000-8000-000000000020')
    or exists (select 1 from public.inventory_acquisition_events where household_id='31100000-0000-4000-8000-000000000020')
    or exists (select 1 from public.items where household_id='31100000-0000-4000-8000-000000000020')
    or exists (select 1 from public.receipts where household_id='31100000-0000-4000-8000-000000000020') then
    raise exception 'Household deletion must cascade its placement-owned data.';
  end if;
end; $$;

rollback;
