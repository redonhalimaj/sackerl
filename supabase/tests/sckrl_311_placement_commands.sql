-- Atomic placement, validation, replay, status and freeze behavior. Synthetic mutations roll back.
\set ON_ERROR_STOP on
begin;
create or replace function pg_temp.expect(condition boolean, message text)
returns void language plpgsql as $$ begin
  if condition is not true then raise exception '%',message; end if;
end; $$;
create or replace function pg_temp.expect_error(command text, expected_state text, expected_code text default null, expected_detail text default null)
returns void language plpgsql as $$
declare v_state text; v_detail text;
begin
  begin execute command;
  exception when others then
    get stacked diagnostics v_state = returned_sqlstate, v_detail = pg_exception_detail;
    if v_state <> expected_state then raise exception 'Expected SQLSTATE %, received % (%).',expected_state,v_state,sqlerrm; end if;
    if expected_code is not null and coalesce(v_detail,'') not like '%'||expected_code||'%' then
      raise exception 'Expected error detail code %, received %.',expected_code,v_detail;
    end if;
    if expected_detail is not null and coalesce(v_detail,'') not like '%'||expected_detail||'%' then
      raise exception 'Expected detail fragment %, received %.',expected_detail,v_detail;
    end if;
    return;
  end;
  raise exception 'Expected SQLSTATE % but statement succeeded.',expected_state;
end; $$;

do $$ begin
  if not exists (select 1 from public.receipts where id='31100000-0000-4000-8000-000000000100')
    or not exists (select 1 from public.receipts where id='31100000-0000-4000-8000-000000000106')
    or exists (select 1 from public.receipts where id in
      ('31100000-0000-4000-8000-000000000107','31100000-0000-4000-8000-000000000108') and review_revision<>0) then
    raise exception 'Missing SCKRL-311 seed; replay 312, run sckrl_311_legacy_seed.sql, then migrate 311.';
  end if;
end; $$;

select set_config('sckrl_311_test.foreign_zone',
  (select id::text from public.zones where household_id='31100000-0000-4000-8000-000000000020' and key='fridge'),true);
set local role authenticated;
select set_config('request.jwt.claim.sub','31100000-0000-4000-8000-000000000001',true);

-- Authentication, membership-before-disclosure, scope, list pagination and strict RPC input.
do $$
declare
  h uuid := '31100000-0000-4000-8000-000000000010';
  r uuid := '31100000-0000-4000-8000-000000000100';
  g uuid;
  rev integer;
  review jsonb;
  assignments jsonb;
  too_many jsonb;
  foreign_zone uuid;
  line_id uuid;
  listing jsonb;
begin
  review:=public.get_receipt_review(h,r);
  g:=(review #>> '{receipt,active_parse_generation_id}')::uuid;
  rev:=(review #>> '{receipt,review_revision}')::integer;
  select jsonb_agg(jsonb_build_object('receiptItemId',item->>'id','zoneId',z.id) order by item->>'id')
    into assignments
    from jsonb_array_elements(review->'items') item
    cross join lateral (select id from public.zones where household_id=h and key='fridge') z
    where (item->>'included')::boolean;
  select (item->>'id')::uuid into strict line_id
    from jsonb_array_elements(review->'items') item
    where (item->>'included')::boolean order by item->>'id' limit 1;
  foreign_zone:=current_setting('sckrl_311_test.foreign_zone')::uuid;

  perform set_config('request.jwt.claim.sub','',true);
  perform pg_temp.expect_error(format('select public.get_receipt_placement(%L,%L)',h,r),'PT401','AUTH_REQUIRED');
  perform pg_temp.expect_error(format('select public.list_unplaced_receipt_reviews(%L,1,25)',h),'PT401','AUTH_REQUIRED');
  perform pg_temp.expect_error(format('select public.finalize_receipt_placement(%L,%L,%L,%s,%L,%L::jsonb)',
    h,r,g,rev,'31100000-0000-4000-8000-000000000501',assignments::text),'PT401','AUTH_REQUIRED');
  perform set_config('request.jwt.claim.sub','31100000-0000-4000-8000-000000000001',true);

  perform set_config('request.jwt.claim.sub','31100000-0000-4000-8000-000000000003',true);
  perform pg_temp.expect_error(format('select public.get_receipt_placement(%L,%L)',h,r),'PT403','HOUSEHOLD_ACCESS_REQUIRED');
  perform pg_temp.expect_error(format('select public.list_unplaced_receipt_reviews(%L,1,25)',h),'PT403','HOUSEHOLD_ACCESS_REQUIRED');
  perform pg_temp.expect_error(format('select public.finalize_receipt_placement(%L,%L,%L,%s,%L,%L::jsonb)',
    h,r,g,rev,'31100000-0000-4000-8000-000000000501',assignments::text),'PT403','HOUSEHOLD_ACCESS_REQUIRED');
  perform set_config('request.jwt.claim.sub','31100000-0000-4000-8000-000000000001',true);

  perform pg_temp.expect_error(format('select public.get_receipt_placement(%L,%L)',h,'31100000-0000-4000-8000-000000000200'),
    'PT404','RECEIPT_NOT_FOUND');
  perform pg_temp.expect_error(format('select public.finalize_receipt_placement(%L,%L,%L,%s,%L,%L::jsonb)',
    h,'31100000-0000-4000-8000-000000000200',g,rev,'31100000-0000-4000-8000-000000000501',assignments::text),
    'PT404','RECEIPT_NOT_FOUND');

  listing:=public.list_unplaced_receipt_reviews(h,1,2);
  perform pg_temp.expect(jsonb_array_length(listing->'receipts')=2
    and (listing #>> '{pagination,page}')::integer=1
    and (listing #>> '{pagination,pageSize}')::integer=2
    and (listing #>> '{pagination,total}')::integer=7,
    'Saved-review discovery must return a stable count and page from the seeded snapshot.');
  perform pg_temp.expect_error(format('select public.list_unplaced_receipt_reviews(%L,0,25)',h),'PT400','INVALID_PLACEMENT_INPUT');
  perform pg_temp.expect_error(format('select public.list_unplaced_receipt_reviews(%L,1,101)',h),'PT400','INVALID_PLACEMENT_INPUT');

  perform pg_temp.expect_error(format('select public.finalize_receipt_placement(%L,%L,%L,%s,%L,%L::jsonb)',
    h,r,g,rev,'31100000-0000-4000-8000-000000000501',
    jsonb_set(assignments,'{0,zoneId}',to_jsonb(foreign_zone::text))::text),
    'PT422','INVALID_PLACEMENT_ZONE',line_id::text);
  perform pg_temp.expect_error(format('select public.finalize_receipt_placement(%L,%L,%L,%s,%L,%L::jsonb)',
    h,r,g,rev,'31100000-0000-4000-8000-000000000501',
    jsonb_set(assignments,'{0,zoneId}',to_jsonb('00000000-0000-4000-8000-000000000998'::text))::text),
    'PT422','INVALID_PLACEMENT_ZONE',line_id::text);
  perform pg_temp.expect_error(format('select public.finalize_receipt_placement(%L,%L,%L,%s,%L,%L::jsonb)',
    h,r,g,rev,'31100000-0000-4000-8000-000000000501',
    jsonb_build_array(jsonb_build_object('receiptItemId',line_id,'zoneId',(assignments->0->>'zoneId')),
      jsonb_build_object('receiptItemId',line_id,'zoneId',(assignments->0->>'zoneId')))::text),
    'PT400','INVALID_PLACEMENT_INPUT');
  perform pg_temp.expect_error(format('select public.finalize_receipt_placement(%L,%L,%L,%s,%L,%L::jsonb)',
    h,r,'00000000-0000-4000-8000-000000000999',rev,'31100000-0000-4000-8000-000000000501',assignments::text),
    'PT409','STALE_RECEIPT_REVIEW');
  perform pg_temp.expect_error(format('select public.finalize_receipt_placement(%L,%L,%L,%s,%L,%L::jsonb)',
    h,r,g,rev+1,'31100000-0000-4000-8000-000000000501',assignments::text),'PT409','STALE_RECEIPT_REVIEW');
  perform pg_temp.expect_error(format('select public.finalize_receipt_placement(%L,%L,%L,%s,%L,%L::jsonb)',
    h,r,g,rev,'31100000-0000-4000-8000-000000000501','[]'::jsonb::text),'PT422','PLACEMENT_LINE_SET_MISMATCH');

  select jsonb_agg(jsonb_build_object(
    'receiptItemId','00000000-0000-4000-8000-'||lpad(i::text,12,'0'),
    'zoneId',assignments->0->>'zoneId'
  )) into too_many from generate_series(1,151) i;
  perform pg_temp.expect_error(format('select public.finalize_receipt_placement(%L,%L,%L,%s,%L,%L::jsonb)',
    h,r,g,rev,'31100000-0000-4000-8000-000000000501',too_many::text),'PT400','INVALID_PLACEMENT_INPUT');
  perform pg_temp.expect_error(format('select public.finalize_receipt_placement(%L,%L,%L,%s,%L,%L::jsonb)',
    h,r,g,rev,'31100000-0000-4000-8000-000000000501',
    jsonb_build_array(jsonb_build_object('receiptItemId',line_id,'zoneId',assignments->0->>'zoneId','householdId',h))::text),
    'PT400','INVALID_PLACEMENT_INPUT');
end; $$;

-- An all-excluded but saved review returns EMPTY_RECEIPT_PLACEMENT before set mismatch.
do $$
declare review jsonb; h uuid := '31100000-0000-4000-8000-000000000010'; r uuid := '31100000-0000-4000-8000-000000000101';
  g uuid; rev integer;
begin
  review:=public.get_receipt_review(h,r);
  g:=(review #>> '{receipt,active_parse_generation_id}')::uuid;
  rev:=(review #>> '{receipt,review_revision}')::integer;
  perform public.save_receipt_review(h,r,g,rev,jsonb_build_array(jsonb_build_object(
    'id',review #>> '{items,0,id}','included',false,'review_state','reviewed',
    'name','Fixture Item','qty_value',1,'qty_unit','pcs','category_id','pantry',
    'expiry',jsonb_build_object('state','unknown','date',null)
  )));
  review:=public.get_receipt_review(h,r);
  perform pg_temp.expect_error(format('select public.finalize_receipt_placement(%L,%L,%L,%s,%L,''[]''::jsonb)',
    h,r,(review #>> '{receipt,active_parse_generation_id}')::uuid,
    (review #>> '{receipt,review_revision}')::integer,'31100000-0000-4000-8000-000000000601'),
    'PT422','EMPTY_RECEIPT_PLACEMENT');
end; $$;

-- Persisted NaN is rejected as a line error. Restore it before placement.
reset role;
update public.receipt_items set corrected_qty_value='NaN'
 where id=(select id from public.receipt_items where receipt_id='31100000-0000-4000-8000-000000000100' and included order by id limit 1);
set local role authenticated;
do $$
declare review jsonb; generation uuid; assignments jsonb; zone uuid; line_id uuid;
begin
  review:=public.get_receipt_review('31100000-0000-4000-8000-000000000010','31100000-0000-4000-8000-000000000100');
  generation:=(review #>> '{receipt,active_parse_generation_id}')::uuid;
  select id into strict zone from public.zones where household_id='31100000-0000-4000-8000-000000000010' and key='fridge';
  select (item->>'id')::uuid into line_id from jsonb_array_elements(review->'items') item
    where (item->>'included')::boolean order by item->>'id' limit 1;
  select jsonb_agg(jsonb_build_object('receiptItemId',item->>'id','zoneId',zone) order by item->>'id') into assignments
    from jsonb_array_elements(review->'items') item where (item->>'included')::boolean;
  perform pg_temp.expect_error(format('select public.finalize_receipt_placement(%L,%L,%L,1,%L,%L::jsonb)',
    '31100000-0000-4000-8000-000000000010','31100000-0000-4000-8000-000000000100',generation,
    '31100000-0000-4000-8000-000000000099',assignments::text),'PT422','INVALID_PLACEMENT_LINE',line_id::text);
end; $$;
reset role;
update public.receipt_items set corrected_qty_value=1
 where id=(select id from public.receipt_items where receipt_id='31100000-0000-4000-8000-000000000100' and included order by id limit 1);

-- Inject an event failure on the second line. The first item's stock, expiry fact and event must roll back too.
create or replace function public.sckrl_311_test_fail_event()
returns trigger language plpgsql as $$
begin
  if new.source_receipt_item_id = nullif(current_setting('sckrl_311_test.fail_line',true),'')::uuid then
    raise exception 'SCKRL311_INJECTED_EVENT_FAILURE';
  end if;
  return new;
end; $$;
create trigger sckrl_311_test_fail_event_before_insert
  before insert on public.inventory_acquisition_events
  for each row execute function public.sckrl_311_test_fail_event();
set local role authenticated;
do $$
declare review jsonb; assignments jsonb; zone uuid; fail_line uuid; h uuid := '31100000-0000-4000-8000-000000000010';
  r uuid := '31100000-0000-4000-8000-000000000100'; v_state text; v_message text; before_items bigint; before_events bigint;
begin
  review:=public.get_receipt_review(h,r);
  select id into strict zone from public.zones where household_id=h and key='fridge';
  select (item->>'id')::uuid into fail_line from jsonb_array_elements(review->'items') item
    where (item->>'included')::boolean order by item->>'id' offset 1 limit 1;
  select jsonb_agg(jsonb_build_object('receiptItemId',item->>'id','zoneId',zone) order by item->>'id') into assignments
    from jsonb_array_elements(review->'items') item where (item->>'included')::boolean;
  select count(*) into before_items from public.items where household_id=h;
  select count(*) into before_events from public.inventory_acquisition_events where household_id=h;
  perform set_config('sckrl_311_test.fail_line',fail_line::text,true);
  begin
    perform public.finalize_receipt_placement(h,r,(review #>> '{receipt,active_parse_generation_id}')::uuid,
      (review #>> '{receipt,review_revision}')::integer,'31100000-0000-4000-8000-000000000501',assignments);
  exception when others then
    get stacked diagnostics v_state=returned_sqlstate,v_message=message_text;
    if v_state <> 'P0001' or v_message not like 'SCKRL311_INJECTED_EVENT_FAILURE%' then raise; end if;
  end;
  perform pg_temp.expect((select count(*)=before_items from public.items where household_id=h)
    and (select count(*)=before_events from public.inventory_acquisition_events where household_id=h)
    and not exists (select 1 from public.receipt_placements where receipt_id=r),
    'A failure after partial item/event work must roll back the complete placement.');
end; $$;
reset role;
drop trigger sckrl_311_test_fail_event_before_insert on public.inventory_acquisition_events;
drop function public.sckrl_311_test_fail_event();

-- Force a placement calendar date distinct from UTC while keeping the choice valid at every hour.
update public.households set calendar_time_zone = case
  when extract(hour from (clock_timestamp() at time zone 'UTC')) < 10 then 'Etc/GMT+12'
  else 'Pacific/Kiritimati'
end where id='31100000-0000-4000-8000-000000000010';

-- The reviewer remains the owner; a second household member places the immutable result.
set local role authenticated;
select set_config('request.jwt.claim.sub','31100000-0000-4000-8000-000000000002',true);
do $$
declare
  h uuid := '31100000-0000-4000-8000-000000000010';
  r uuid := '31100000-0000-4000-8000-000000000100';
  k uuid := '31100000-0000-4000-8000-000000000501';
  review jsonb; assignments jsonb; reply jsonb; replay jsonb; second jsonb; status jsonb;
  zone uuid; other_zone uuid; first_zone uuid; second_zone uuid; line_ids uuid[]; returned_assignments jsonb;
  calendar_zone text; placed_at timestamptz; listing jsonb;
  pending_before integer; pending_after integer; page_one_ids text[]; page_two_ids text[]; first_four_ids text[];
  before_items bigint; before_events bigint; result_ids text[]; source_ids text[];
  first_item uuid; second_item uuid; future_reply jsonb; future_review jsonb; future_assignments jsonb;
begin
  review:=public.get_receipt_review(h,r);
  select id into strict zone from public.zones where household_id=h and key='fridge';
  select id into strict other_zone from public.zones where household_id=h and key='basement';
  select array_agg((item->>'id')::uuid order by item->>'id') into line_ids
    from jsonb_array_elements(review->'items') item where (item->>'included')::boolean;
  perform pg_temp.expect(cardinality(line_ids)=3,'Expected exactly three included lines for the multi-zone placement.');
  -- The first requested zone is deliberately the larger UUID; the RPC must lock zones in sorted ID order.
  first_zone:=greatest(zone,other_zone);
  second_zone:=least(zone,other_zone);
  assignments:=jsonb_build_array(
    jsonb_build_object('receiptItemId',line_ids[1],'zoneId',first_zone),
    jsonb_build_object('receiptItemId',line_ids[2],'zoneId',second_zone),
    jsonb_build_object('receiptItemId',line_ids[3],'zoneId',first_zone)
  );
  select calendar_time_zone into strict calendar_zone from public.households where id=h;
  listing:=public.list_unplaced_receipt_reviews(h,1,100);
  pending_before:=(listing #>> '{pagination,total}')::integer;
  perform pg_temp.expect(exists (select 1 from jsonb_array_elements(listing->'receipts') receipt where receipt->>'id'=r::text),
    'The main receipt must be pending before its placement command.');
  select count(*) into before_items from public.items where household_id=h;
  select count(*) into before_events from public.inventory_acquisition_events where household_id=h;

  reply:=public.finalize_receipt_placement(h,r,(review #>> '{receipt,active_parse_generation_id}')::uuid,
    (review #>> '{receipt,review_revision}')::integer,k,assignments);
  perform pg_temp.expect(reply->>'outcome'='placed','First placement did not commit.');
  perform pg_temp.expect((select count(*)=before_items+3 from public.items where household_id=h)
    and (select count(*)=before_events+3 from public.inventory_acquisition_events where household_id=h),
    'Placement must create one stock row/event per included line and none for the excluded line.');
  perform pg_temp.expect(jsonb_array_length(reply #> '{placement,items}')=3,'Canonical result has the wrong included-line count.');
  perform pg_temp.expect(exists (select 1 from jsonb_array_elements(reply #> '{placement,items}') item
    where item->>'name'='Whole Milk' and item->>'expiresOn'='2026-10-20' and item->>'expiryFactId' is not null)
    and exists (select 1 from jsonb_array_elements(reply #> '{placement,items}') item
      where item->>'name'='Bread' and item->'expiresOn'='null'::jsonb and item->>'expiryFactId' is not null)
    and exists (select 1 from jsonb_array_elements(reply #> '{placement,items}') item
      where item->>'name'='Apples' and item->'expiresOn'='null'::jsonb and item->'expiryFactId'='null'::jsonb),
    'Dated, no-date and unknown expiry facts/projections must match persisted review choices.');
  placed_at:=(reply #>> '{placement,placedAt}')::timestamptz;
  perform pg_temp.expect((reply #>> '{placement,purchasedOn}')='2026-10-01'
    and (reply #>> '{placement,addedOn}')::date=(placed_at at time zone calendar_zone)::date
    and (reply #>> '{placement,addedOn}')::date<>(placed_at at time zone 'UTC')::date,
    'Purchase day must remain separate and added_on must use the household day distinct from UTC.');
  perform pg_temp.expect((select count(*)=2 and bool_and(recorded_by='31100000-0000-4000-8000-000000000002'
      and source='user' and printed_marking='unknown' and estimator_version is null and confirmed_at is null)
    from public.item_expiry_facts where item_id in
      (select (item->>'itemId')::uuid from jsonb_array_elements(reply #> '{placement,items}') item)
      and source='user'),
    'Dated/no-date expiry facts must be attributed to the placer without inherited confirmation.');
  perform pg_temp.expect((select count(*)=3 and bool_and(occurred_at=(reply #>> '{placement,placedAt}')::timestamptz
      and actor_id='31100000-0000-4000-8000-000000000002' and idempotency_key=k)
    from public.inventory_acquisition_events where receipt_id=r),
    'Acquisition events must share the result timestamp, placer and original command key.');
  select jsonb_agg(jsonb_build_object('receiptItemId',item->>'receiptItemId','zoneId',item->>'zoneId')
      order by item->>'receiptItemId') into returned_assignments
    from jsonb_array_elements(reply #> '{placement,items}') item;
  perform pg_temp.expect(returned_assignments=assignments
    and (select count(distinct a.value->>'zoneId')=2 from jsonb_array_elements(assignments) a(value))
    and (select count(*)=3 and count(distinct i.zone_id)=2
      and bool_and(i.zone_id=(a.value->>'zoneId')::uuid)
      from jsonb_array_elements(assignments) a(value)
      join public.items i on i.source_receipt_item_id=(a.value->>'receiptItemId')::uuid),
    'Canonical result and stock rows must preserve all three exact line-to-zone assignments across two zones.');
  perform pg_temp.expect((select reviewed_by='31100000-0000-4000-8000-000000000001'
    from public.receipts where id=r),'Placement must preserve the distinct receipt reviewer attribution.');
  perform pg_temp.expect((select count(*)=3 and count(distinct source_receipt_item_id)=3
    from public.items where household_id=h and source_receipt_item_id is not null),
    'Stock rows need unique receipt-line lineage.');
  select array_agg(item->>'receiptItemId' order by ord) into result_ids
    from jsonb_array_elements(reply #> '{placement,items}') with ordinality e(item,ord);
  select array_agg(id::text order by id) into source_ids from public.receipt_items where receipt_id=r and included;
  perform pg_temp.expect(result_ids=source_ids,'Canonical result items must sort by receiptItemId.');

  replay:=public.finalize_receipt_placement(h,r,(review #>> '{receipt,active_parse_generation_id}')::uuid,
    (review #>> '{receipt,review_revision}')::integer,k,assignments);
  perform pg_temp.expect(replay->>'outcome'='replayed' and replay->'placement'=reply->'placement',
    'Normalized same-key retry did not return the immutable original result.');
  select jsonb_agg(jsonb_build_object('receiptItemId',upper(item->>'receiptItemId'),'zoneId',upper(item->>'zoneId'))
      order by item->>'receiptItemId' desc) into returned_assignments
    from jsonb_array_elements(assignments) item;
  replay:=public.finalize_receipt_placement(h,r,(review #>> '{receipt,active_parse_generation_id}')::uuid,
    (review #>> '{receipt,review_revision}')::integer,k,returned_assignments);
  perform pg_temp.expect(replay->>'outcome'='replayed' and replay->'placement'=reply->'placement',
    'Reversed assignments with uppercase UUID strings must normalize to the same canonical replay.');
  perform pg_temp.expect_error(format('select public.finalize_receipt_placement(%L,%L,%L,%s,%L,%L::jsonb)',
    h,r,(review #>> '{receipt,active_parse_generation_id}')::uuid,
    (review #>> '{receipt,review_revision}')::integer,k,
    jsonb_set(assignments,'{0,zoneId}',to_jsonb('00000000-0000-4000-8000-000000000000'::text))::text),
    'PT409','PLACEMENT_KEY_REUSED');
  second:=public.finalize_receipt_placement(h,r,(review #>> '{receipt,active_parse_generation_id}')::uuid,
    (review #>> '{receipt,review_revision}')::integer,'31100000-0000-4000-8000-000000000502',assignments);
  perform pg_temp.expect(second->>'outcome'='already_placed' and second->'placement'=reply->'placement',
    'Second key did not receive the canonical result without binding an alias.');
  perform pg_temp.expect_error(format('select public.finalize_receipt_placement(%L,%L,%L,%s,%L,%L::jsonb)',
    h,'31100000-0000-4000-8000-000000000101',
    (select active_parse_generation_id from public.receipts where id='31100000-0000-4000-8000-000000000101'),1,k,
    jsonb_build_array(jsonb_build_object('receiptItemId',(select id from public.receipt_items where receipt_id='31100000-0000-4000-8000-000000000101'), 'zoneId',zone))::text),
    'PT409','PLACEMENT_KEY_REUSED');

  status:=public.get_receipt_placement(h,r,k);
  perform pg_temp.expect(status->>'state'='placed' and (status->>'keyMatches')::boolean
    and status->'placement'=reply->'placement','Canonical status did not confirm the original key/result.');
  status:=public.get_receipt_placement(h,r,'31100000-0000-4000-8000-000000000502');
  perform pg_temp.expect((status->>'keyMatches')::boolean is false,'An alternate key was incorrectly bound.');
  status:=public.get_receipt_placement(h,r);
  perform pg_temp.expect(status->>'state'='placed' and status->'keyMatches'='null'::jsonb,
    'Status without a supplied key must not claim a key match.');

  listing:=public.list_unplaced_receipt_reviews(h,1,100);
  pending_after:=(listing #>> '{pagination,total}')::integer;
  perform pg_temp.expect(pending_after=pending_before-1
      and not exists (select 1 from jsonb_array_elements(listing->'receipts') receipt where receipt->>'id'=r::text),
    'Placed receipt must disappear from pending placement and decrement the saved-review total once.');
  listing:=public.list_unplaced_receipt_reviews(h,1,2);
  select array_agg(receipt->>'id' order by ord) into page_one_ids
    from jsonb_array_elements(listing->'receipts') with ordinality rows(receipt,ord);
  listing:=public.list_unplaced_receipt_reviews(h,2,2);
  select array_agg(receipt->>'id' order by ord) into page_two_ids
    from jsonb_array_elements(listing->'receipts') with ordinality rows(receipt,ord);
  listing:=public.list_unplaced_receipt_reviews(h,1,4);
  select array_agg(receipt->>'id' order by ord) into first_four_ids
    from jsonb_array_elements(listing->'receipts') with ordinality rows(receipt,ord);
  perform pg_temp.expect(cardinality(page_one_ids)=2 and cardinality(page_two_ids)=2
      and cardinality(first_four_ids)=4 and page_one_ids=first_four_ids[1:2] and page_two_ids=first_four_ids[3:4],
    'Adjacent pending-review pages must concatenate into the same deterministic first-page window.');
  listing:=public.list_unplaced_receipt_reviews(h,((pending_after+1)/2)+1,2);
  perform pg_temp.expect(jsonb_array_length(listing->'receipts')=0
      and (listing #>> '{pagination,page}')::integer=((pending_after+1)/2)+1
      and (listing #>> '{pagination,pageSize}')::integer=2
      and (listing #>> '{pagination,total}')::integer=pending_after,
    'An out-of-range page after placement must retain the same total and pagination values.');

  -- Edit, soft-remove and hard-delete stock, then prove replay never recreates it.
  select (reply #>> '{placement,items,0,itemId}')::uuid,
    (reply #>> '{placement,items,1,itemId}')::uuid into first_item,second_item;
  update public.items set removed_on=added_on where id=first_item;
  delete from public.items where id=second_item;
  replay:=public.finalize_receipt_placement(h,r,(review #>> '{receipt,active_parse_generation_id}')::uuid,
    (review #>> '{receipt,review_revision}')::integer,k,assignments);
  perform pg_temp.expect(replay->>'outcome'='replayed' and replay->'placement'=reply->'placement'
    and (select count(*)=before_items+2 from public.items where household_id=h)
    and (select count(*)=before_events+2 from public.inventory_acquisition_events where household_id=h),
    'Replay after stock edit/removal/deletion must preserve the result and never recreate stock.');

  -- Every legacy mutation path must reject the placed receipt before stale or no-op behavior.
  perform pg_temp.expect_error(format('select public.mark_receipt_parse_failed(%L,%L,%L,%s)',h,r,
    (review #>> '{receipt,active_parse_generation_id}')::uuid,(review #>> '{receipt,review_revision}')::integer),
    'PT409','RECEIPT_ALREADY_PLACED');
  perform pg_temp.expect_error(format('select public.save_receipt_review(%L,%L,%L,%s,%L::jsonb)',h,r,
    (review #>> '{receipt,active_parse_generation_id}')::uuid,(review #>> '{receipt,review_revision}')::integer,
    jsonb_build_array(jsonb_build_object('id',review #>> '{items,0,id}','included',true,'review_state','reviewed',
      'name','Whole Milk','qty_value',1,'qty_unit','l','category_id','dairy'))::text),
    'PT409','RECEIPT_ALREADY_PLACED');
  perform pg_temp.expect_error(format('select public.promote_receipt_parse(%L,%L,%L,%s,%L,%L,%L,%L,%L,%s,%L::jsonb)',
    h,r,(review #>> '{receipt,active_parse_generation_id}')::uuid,(review #>> '{receipt,review_revision}')::integer,
    'fixture-parser-v1','fixture-provider','EUR','2026-10-01','S311 fixture',499,'[]'::jsonb::text),
    'PT409','RECEIPT_ALREADY_PLACED');
  perform pg_temp.expect_error(format('update public.receipts set store_name=''must fail'' where id=%L',r),
    'PT409','RECEIPT_ALREADY_PLACED');
  perform pg_temp.expect_error(format('update public.receipt_items set corrected_name=''must fail'' where id=%L',
    (review #>> '{items,0,id}')::uuid),'42501');
  perform pg_temp.expect_error(format('update public.receipt_parse_generations set provider=''must fail'' where id=%L',
    (review #>> '{receipt,active_parse_generation_id}')::uuid),'42501');
  perform pg_temp.expect_error(format('update public.inventory_acquisition_events set quantity_delta=quantity_delta+1 where receipt_id=%L',r),'42501');
  perform pg_temp.expect_error(format('update public.receipt_placements set result=''{}''::jsonb where receipt_id=%L',r),'42501');

  -- A future parser purchase day is retained separately from the actual placement day.
  future_review:=public.get_receipt_review(h,'31100000-0000-4000-8000-000000000102');
  select jsonb_build_array(jsonb_build_object('receiptItemId',item->>'id','zoneId',zone)) into future_assignments
    from jsonb_array_elements(future_review->'items') item where (item->>'included')::boolean;
  future_reply:=public.finalize_receipt_placement(h,'31100000-0000-4000-8000-000000000102',
    (future_review #>> '{receipt,active_parse_generation_id}')::uuid,
    (future_review #>> '{receipt,review_revision}')::integer,'31100000-0000-4000-8000-000000000503',future_assignments);
  perform pg_temp.expect(future_reply #>> '{placement,purchasedOn}'='2030-01-01'
    and future_reply #>> '{placement,addedOn}'=((future_reply #>> '{placement,placedAt}')::timestamptz at time zone calendar_zone)::date::text,
    'Purchase day must remain separate from the timestamp-derived household placement day.');
end; $$;

-- Owner-level direct writes still hit the placed freeze triggers; app callers lack these grants.
reset role;
do $$
begin
  perform pg_temp.expect_error('update public.receipt_items set corrected_name=''must fail'' where receipt_id=''31100000-0000-4000-8000-000000000100''',
    'PT409','RECEIPT_ALREADY_PLACED');
  perform pg_temp.expect_error('update public.receipt_parse_generations set provider=''must fail'' where receipt_id=''31100000-0000-4000-8000-000000000100''',
    'PT409','RECEIPT_ALREADY_PLACED');
end; $$;
set local role authenticated;

set constraints all immediate;

rollback;
