-- SCKRL-912: coded placement conflicts (F1) and the unchanged lineage guard branches (L4).
-- Run on the populated SCKRL-311 disposable replay after the SCKRL-912 migration. Everything
-- runs in one rollback-only transaction; do not add --single-transaction.
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
    if expected_code is not null and coalesce(v_detail,'') not like '%"code":"'||expected_code||'"%' then
      raise exception 'Expected detail %, got %',expected_code,v_detail;
    end if;
    return;
  end;
  raise exception 'Expected SQLSTATE % but statement succeeded.',expected_state;
end; $$;

do $$ begin
  if not exists (select 1 from public.receipts where id='31100000-0000-4000-8000-000000000100')
    or exists (select 1 from public.receipt_placements where receipt_id='31100000-0000-4000-8000-000000000100') then
    raise exception 'Missing SCKRL-311 seed or receipt already placed; use a fresh populated replay.';
  end if;
end; $$;

-- The migration must keep the function contract: definer, search_path and grants.
do $$ begin
  perform pg_temp.expect((select prosecdef and proconfig @> array['search_path=public, pg_temp']
    from pg_proc where oid='public.finalize_receipt_placement(uuid,uuid,uuid,integer,uuid,jsonb)'::regprocedure),
    'finalize_receipt_placement lost security definer or search_path.');
  perform pg_temp.expect(has_function_privilege('authenticated','public.finalize_receipt_placement(uuid,uuid,uuid,integer,uuid,jsonb)','EXECUTE')
    and not has_function_privilege('anon','public.finalize_receipt_placement(uuid,uuid,uuid,integer,uuid,jsonb)','EXECUTE')
    and not has_function_privilege('service_role','public.finalize_receipt_placement(uuid,uuid,uuid,integer,uuid,jsonb)','EXECUTE'),
    'finalize_receipt_placement grants changed.');
  perform pg_temp.expect(not has_function_privilege('authenticated','public.guard_item_receipt_lineage()','EXECUTE')
    and (select prosecdef from pg_proc where oid='public.guard_item_receipt_lineage()'::regprocedure),
    'guard_item_receipt_lineage grants or definer changed.');
end; $$;

create temporary table s912_ctx(h uuid, r uuid, g uuid, rev integer, assignments jsonb, first_line uuid, second_line uuid, zone uuid);
grant all on s912_ctx to authenticated;
insert into s912_ctx
select '31100000-0000-4000-8000-000000000010','31100000-0000-4000-8000-000000000100',
  rc.active_parse_generation_id, rc.review_revision,
  (select jsonb_agg(jsonb_build_object('receiptItemId',ri.id,'zoneId',z.id) order by ri.id)
     from public.receipt_items ri where ri.receipt_id=rc.id and ri.generation_id=rc.active_parse_generation_id and ri.included),
  (select ri.id from public.receipt_items ri where ri.receipt_id=rc.id and ri.generation_id=rc.active_parse_generation_id and ri.included order by ri.id limit 1),
  (select ri.id from public.receipt_items ri where ri.receipt_id=rc.id and ri.generation_id=rc.active_parse_generation_id and ri.included order by ri.id offset 1 limit 1),
  z.id
from public.receipts rc
join public.zones z on z.household_id=rc.household_id and z.key='fridge'
where rc.id='31100000-0000-4000-8000-000000000100';

-- F1a: a real 23505. A forged (owner-level) item already holds the second line's lineage, so the
-- placement's item insert violates items_source_receipt_item_key mid-loop.
insert into public.items(household_id,name,qty_value,qty_unit,category_id,zone_id,source,source_receipt_item_id)
select h,'S912 forged lineage holder',1,'pcs','pantry',zone,'receipt',second_line from s912_ctx;

set local role authenticated;
select set_config('request.jwt.claim.sub','31100000-0000-4000-8000-000000000001',true);
do $$
declare c s912_ctx; before_items bigint; before_events bigint;
begin
  select * into c from s912_ctx;
  select count(*) into before_items from public.items where household_id=c.h;
  select count(*) into before_events from public.inventory_acquisition_events where household_id=c.h;
  perform pg_temp.expect_error(format('select public.finalize_receipt_placement(%L,%L,%L,%s,%L,%L::jsonb)',
    c.h,c.r,c.g,c.rev,'91200000-0000-4000-8000-000000000001',c.assignments::text),'PT409','PLACEMENT_CONFLICT');
  perform pg_temp.expect((select count(*)=before_items from public.items where household_id=c.h)
    and (select count(*)=before_events from public.inventory_acquisition_events where household_id=c.h)
    and not exists (select 1 from public.receipt_placements where receipt_id=c.r),
    'A coded unique conflict must roll back every placement write.');
end; $$;
reset role;
delete from public.items where name='S912 forged lineage holder';

-- F1b: a 23503 raised after partial item/event work maps to the same code and rolls back.
create or replace function public.sckrl_912_test_fk_failure()
returns trigger language plpgsql as $$
begin
  if new.source_receipt_item_id = (select second_line from s912_ctx) then
    raise sqlstate '23503' using message = 'SCKRL912_INJECTED_FK_FAILURE';
  end if;
  return new;
end; $$;
create trigger sckrl_912_test_fk_failure_before_insert
  before insert on public.inventory_acquisition_events
  for each row execute function public.sckrl_912_test_fk_failure();

set local role authenticated;
select set_config('request.jwt.claim.sub','31100000-0000-4000-8000-000000000001',true);
do $$
declare c s912_ctx; before_items bigint;
begin
  select * into c from s912_ctx;
  select count(*) into before_items from public.items where household_id=c.h;
  perform pg_temp.expect_error(format('select public.finalize_receipt_placement(%L,%L,%L,%s,%L,%L::jsonb)',
    c.h,c.r,c.g,c.rev,'91200000-0000-4000-8000-000000000002',c.assignments::text),'PT409','PLACEMENT_CONFLICT');
  perform pg_temp.expect((select count(*)=before_items from public.items where household_id=c.h)
    and not exists (select 1 from public.inventory_acquisition_events where receipt_id=c.r)
    and not exists (select 1 from public.receipt_placements where receipt_id=c.r),
    'A coded foreign-key conflict must roll back every placement write.');
end; $$;
reset role;
drop trigger sckrl_912_test_fk_failure_before_insert on public.inventory_acquisition_events;
drop function public.sckrl_912_test_fk_failure();

-- Non-integrity failures are not remapped, and the existing coded errors are unchanged.
create or replace function public.sckrl_912_test_other_failure()
returns trigger language plpgsql as $$
begin raise exception 'SCKRL912_INJECTED_OTHER_FAILURE'; end; $$;
create trigger sckrl_912_test_other_failure_before_insert
  before insert on public.inventory_acquisition_events
  for each row execute function public.sckrl_912_test_other_failure();
set local role authenticated;
select set_config('request.jwt.claim.sub','31100000-0000-4000-8000-000000000001',true);
do $$
declare c s912_ctx;
begin
  select * into c from s912_ctx;
  perform pg_temp.expect_error(format('select public.finalize_receipt_placement(%L,%L,%L,%s,%L,%L::jsonb)',
    c.h,c.r,c.g,c.rev,'91200000-0000-4000-8000-000000000003',c.assignments::text),'P0001');
  perform pg_temp.expect_error(format('select public.finalize_receipt_placement(%L,%L,%L,%s,%L,%L::jsonb)',
    c.h,c.r,c.g,c.rev+1,'91200000-0000-4000-8000-000000000003',c.assignments::text),'PT409','STALE_RECEIPT_REVIEW');
end; $$;
reset role;
drop trigger sckrl_912_test_other_failure_before_insert on public.inventory_acquisition_events;
drop function public.sckrl_912_test_other_failure();

-- A clean placement still succeeds, replays, and keeps PLACEMENT_KEY_REUSED for changed input.
set local role authenticated;
select set_config('request.jwt.claim.sub','31100000-0000-4000-8000-000000000001',true);
do $$
declare c s912_ctx; reply jsonb;
begin
  select * into c from s912_ctx;
  reply:=public.finalize_receipt_placement(c.h,c.r,c.g,c.rev,'91200000-0000-4000-8000-000000000004',c.assignments);
  perform pg_temp.expect(reply->>'outcome'='placed','Clean placement must still succeed.');
  reply:=public.finalize_receipt_placement(c.h,c.r,c.g,c.rev,'91200000-0000-4000-8000-000000000004',c.assignments);
  perform pg_temp.expect(reply->>'outcome'='replayed','Same-key retry must replay.');
  perform pg_temp.expect_error(format('select public.finalize_receipt_placement(%L,%L,%L,%s,%L,%L::jsonb)',
    c.h,c.r,c.g,c.rev,'91200000-0000-4000-8000-000000000004','[]'),'PT409','PLACEMENT_KEY_REUSED');
end; $$;
reset role;

-- L4: every remaining guard_item_receipt_lineage branch behaves as before (owner-level writes).
do $$
declare c s912_ctx; linked uuid; foreign_line uuid;
begin
  select * into c from s912_ctx;
  select id into strict linked from public.items where source_receipt_item_id=c.first_line;
  select id into strict foreign_line from public.receipt_items where receipt_id='31100000-0000-4000-8000-000000000200' limit 1;
  -- Linked stock cannot change households (still checked first).
  perform pg_temp.expect_error(format('update public.items set household_id=%L where id=%L',
    '31100000-0000-4000-8000-000000000020',linked),'PT409');
  -- Lineage cannot be reassigned to another same-household line.
  perform pg_temp.expect_error(format('update public.items set source_receipt_item_id=%L where id=%L',
    c.second_line,linked),'PT409');
  -- Cross-household lineage and non-receipt source with lineage are rejected.
  perform pg_temp.expect_error(format($q$insert into public.items(household_id,name,qty_value,qty_unit,category_id,zone_id,source,source_receipt_item_id)
    values (%L,'S912 cross household',1,'pcs','pantry',%L,'receipt',%L)$q$,c.h,c.zone,foreign_line),'PT422','RECEIPT_LINEAGE_REQUIRED');
  perform pg_temp.expect_error(format('update public.items set source=%L where id=%L','manual',linked),'PT422','RECEIPT_LINEAGE_REQUIRED');
  -- Clearing lineage while its receipt line still exists is a reassignment.
  perform pg_temp.expect_error(format('update public.items set source_receipt_item_id=null where id=%L',linked),'PT409');
  -- Generic receipt-source stock without lineage is rejected on insert.
  perform pg_temp.expect_error(format($q$insert into public.items(household_id,name,qty_value,qty_unit,category_id,zone_id,source)
    values (%L,'S912 generic receipt',1,'pcs','pantry',%L,'receipt')$q$,c.h,c.zone),'PT422','RECEIPT_LINEAGE_REQUIRED');
  -- Ordinary edits of linked stock are still allowed.
  update public.items set name='S912 renamed linked stock' where id=linked;
end; $$;

-- L4 cleared-lineage branch: once the receipt line is gone, only the FK's SET NULL shape passes.
do $$
declare c s912_ctx; linked uuid;
begin
  select * into c from s912_ctx;
  select id into strict linked from public.items where source_receipt_item_id=c.first_line;
  -- Delete the line with FK triggers suppressed so the dangling lineage reaches the guard.
  perform set_config('session_replication_role','replica',true);
  delete from public.receipt_items where id=c.first_line;
  perform set_config('session_replication_role','origin',true);
  perform pg_temp.expect((select source_receipt_item_id=c.first_line from public.items where id=linked),
    'Fixture setup: the dangling lineage must remain for the guard test.');
  perform pg_temp.expect_error(format('update public.items set source_receipt_item_id=null, source=%L where id=%L','manual',linked),
    'PT409');
  perform pg_temp.expect_error(format('update public.items set source_receipt_item_id=null, household_id=%L where id=%L',
    '31100000-0000-4000-8000-000000000020',linked),'PT409');
  update public.items set source_receipt_item_id=null where id=linked;
  perform pg_temp.expect((select source_receipt_item_id is null and source='receipt' from public.items where id=linked),
    'The FK SET NULL shape must remain allowed.');
end; $$;

rollback;
