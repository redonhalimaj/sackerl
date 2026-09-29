-- Verify the SCKRL-406 upgrade preserves visible dates and claims no provenance it does not have.
do $$
declare
  v_dated public.items%rowtype;
  v_undated public.items%rowtype;
  v_fact public.item_expiry_facts%rowtype;
  v_count integer;
  v_zone text;
begin
  select * into strict v_dated from public.items
    where id = '40600000-0000-4000-8000-000000000100';
  select * into strict v_undated from public.items
    where id = '40600000-0000-4000-8000-000000000101';

  if v_dated.expires_on is distinct from '2026-09-20'::date
    or v_dated.added_on is distinct from '2026-09-01'::date
    or v_dated.name is distinct from 'Legacy milk'
    or v_dated.qty_value is distinct from 1
    or v_dated.source is distinct from 'manual'
  then
    raise exception 'Legacy item changed during the SCKRL-406 upgrade';
  end if;

  if v_undated.expires_on is not null then
    raise exception 'Undated legacy item gained a date during the upgrade';
  end if;

  select * into strict v_fact from public.item_expiry_facts
    where item_id = v_dated.id;

  if v_fact.expires_on is distinct from '2026-09-20'::date then
    raise exception 'Backfilled fact does not preserve the legacy date exactly';
  end if;

  if v_fact.origin is distinct from 'backfill'
    or v_fact.source is distinct from 'estimated'
    or v_fact.printed_marking is distinct from 'unknown'
    or v_fact.is_active is distinct from true
  then
    raise exception 'Backfilled fact does not identify itself as a legacy backfill';
  end if;

  if v_fact.confidence is not null
    or v_fact.estimator_version is not null
    or v_fact.confirmed_at is not null
    or v_fact.confirmed_by is not null
    or v_fact.recorded_by is not null
    or v_fact.supersedes_fact_id is not null
    or v_fact.superseded_at is not null
  then
    raise exception 'Backfill invented estimator, confidence, actor or confirmation evidence';
  end if;

  if v_dated.expiry_fact_id is distinct from v_fact.id
    or v_dated.expiry_source is distinct from 'estimated'
    or v_dated.expiry_origin is distinct from 'backfill'
    or v_dated.expiry_printed_marking is distinct from 'unknown'
    or v_dated.expiry_confirmed_at is not null
  then
    raise exception 'Backfilled projection columns do not match the active fact';
  end if;

  select count(*) into v_count from public.item_expiry_facts
    where item_id = v_undated.id;

  if v_count <> 0 then
    raise exception 'Undated legacy item received a fact it has no evidence for';
  end if;

  if v_undated.expiry_fact_id is not null
    or v_undated.expiry_source is not null
    or v_undated.expiry_origin is not null
  then
    raise exception 'Undated legacy item received projection values';
  end if;

  select count(*) into v_count from public.items
    where expires_on is not null and expiry_fact_id is null;

  if v_count <> 0 then
    raise exception 'A dated item was left without an active expiry fact';
  end if;

  select count(*) into v_count
  from public.items
  join public.item_expiry_facts on item_expiry_facts.id = items.expiry_fact_id
  where items.expires_on is distinct from item_expiry_facts.expires_on
     or item_expiry_facts.is_active is distinct from true;

  if v_count <> 0 then
    raise exception 'Projection and active fact disagree after the backfill';
  end if;

  select calendar_time_zone into strict v_zone from public.households
    where id = '40600000-0000-4000-8000-000000000010';

  if v_zone is distinct from 'Europe/Vienna' then
    raise exception 'Existing households did not take the Europe/Vienna pilot default';
  end if;

  raise notice 'SCKRL-406 legacy assertions passed';
end $$;
