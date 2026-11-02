-- Structural assertions for a clean post-311 schema. Never run outside disposable PostgreSQL.
\set ON_ERROR_STOP on

do $$
begin
  if to_regclass('public.receipt_placements') is null
    or to_regclass('public.inventory_acquisition_events') is null
    or not exists (select 1 from information_schema.columns where table_schema='public' and table_name='items' and column_name='source_receipt_item_id') then
    raise exception 'SCKRL-311 objects are missing from the clean schema.';
  end if;
  if not has_column_privilege('authenticated','public.items','source_receipt_item_id','INSERT')
    and not has_column_privilege('authenticated','public.items','source_receipt_item_id','UPDATE')
    and not has_column_privilege('service_role','public.items','source_receipt_item_id','INSERT')
    and not has_column_privilege('service_role','public.items','source_receipt_item_id','UPDATE') then
    null;
  else
    raise exception 'Receipt-line lineage must not be directly writable by application roles.';
  end if;
  if not has_function_privilege('authenticated','public.finalize_receipt_placement(uuid,uuid,uuid,integer,uuid,jsonb)','EXECUTE')
    or has_function_privilege('service_role','public.finalize_receipt_placement(uuid,uuid,uuid,integer,uuid,jsonb)','EXECUTE') then
    raise exception 'Placement RPC grants do not match the application contract.';
  end if;
  if has_table_privilege('service_role','public.receipt_placements','INSERT')
    or has_table_privilege('service_role','public.inventory_acquisition_events','INSERT') then
    raise exception 'Service role must not write placement metadata/events directly.';
  end if;
  if not exists (
    select 1 from pg_constraint where conname='inventory_acquisition_events_placement_fk'
      and conrelid='public.inventory_acquisition_events'::regclass and condeferrable and condeferred
  ) then raise exception 'Event-to-placement FK must defer until the same transaction commits.'; end if;
end;
$$;
