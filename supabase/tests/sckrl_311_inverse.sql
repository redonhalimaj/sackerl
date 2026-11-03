-- SCKRL-914 (F3): inverse of 20261015100000_sckrl_311_atomic_receipt_placement.sql.
-- REVIEWED, NOT APPLIED. Emergency rollback only, with explicit owner approval.
-- See docs/qa/sckrl-311-inverse-migration.md for preconditions, data-loss caveats and the
-- full procedure. Run sckrl_912_inverse.sql first. Run with psql -v ON_ERROR_STOP=1.
--
-- Result: the schema of a database migrated through 20260930100000_sckrl_312_receipt_expiry.sql.
-- DESTRUCTIVE: drops receipt_placements, inventory_acquisition_events and
-- items.source_receipt_item_id. Stock rows created by placement are kept as ordinary
-- source = 'receipt' items without lineage.
--
-- The legacy RPC bodies are restored exactly: SCKRL-311 renamed the 310/312 implementations to
-- *_before_311 and wrapped them, so the inverse drops the wrappers and renames the untouched
-- originals back (prosrc, security definer and search_path are preserved by RENAME).

begin;

do $$
begin
  if to_regclass('public.receipt_placements') is null
    or to_regclass('public.inventory_acquisition_events') is null
    or to_regprocedure('public.save_receipt_review_before_311(uuid, uuid, uuid, integer, jsonb)') is null
    or to_regprocedure('public.promote_receipt_parse_before_311(uuid, uuid, uuid, integer, text, text, text, date, text, integer, jsonb)') is null
    or to_regprocedure('public.mark_receipt_parse_failed_before_311(uuid, uuid, uuid, integer)') is null then
    raise exception 'SCKRL-311 inverse: SCKRL-311 objects are not fully installed; aborting.';
  end if;
end $$;

-- Block concurrent writers on every table 311 touched for the rest of the transaction.
lock table public.items, public.receipts, public.receipt_items, public.receipt_parse_generations,
  public.receipt_placements, public.inventory_acquisition_events in access exclusive mode;

-- 1. Placement read/commit RPCs.
drop function public.list_unplaced_receipt_reviews(uuid, integer, integer);
drop function public.get_receipt_placement(uuid, uuid, uuid);
drop function public.finalize_receipt_placement(uuid, uuid, uuid, integer, uuid, jsonb);

-- 2. Legacy RPC wrappers -> original 310/312 implementations, with their pre-311 grants.
drop function public.save_receipt_review(uuid, uuid, uuid, integer, jsonb);
drop function public.promote_receipt_parse(uuid, uuid, uuid, integer, text, text, text, date, text, integer, jsonb);
drop function public.mark_receipt_parse_failed(uuid, uuid, uuid, integer);
drop function public.assert_receipt_unplaced(uuid, uuid);

alter function public.save_receipt_review_before_311(uuid, uuid, uuid, integer, jsonb)
  rename to save_receipt_review;
alter function public.promote_receipt_parse_before_311(uuid, uuid, uuid, integer, text, text, text, date, text, integer, jsonb)
  rename to promote_receipt_parse;
alter function public.mark_receipt_parse_failed_before_311(uuid, uuid, uuid, integer)
  rename to mark_receipt_parse_failed;

-- Pre-311 ACL: 310/312 revoked public/anon/authenticated and granted authenticated; the
-- service_role execute grant from the schema default privileges was never revoked.
revoke all on function public.save_receipt_review(uuid, uuid, uuid, integer, jsonb) from public, anon, authenticated, service_role;
revoke all on function public.promote_receipt_parse(uuid, uuid, uuid, integer, text, text, text, date, text, integer, jsonb) from public, anon, authenticated, service_role;
revoke all on function public.mark_receipt_parse_failed(uuid, uuid, uuid, integer) from public, anon, authenticated, service_role;
-- Two statements so the ACL order matches pre-311 exactly (service_role entry before authenticated).
grant execute on function public.save_receipt_review(uuid, uuid, uuid, integer, jsonb) to service_role;
grant execute on function public.promote_receipt_parse(uuid, uuid, uuid, integer, text, text, text, date, text, integer, jsonb) to service_role;
grant execute on function public.mark_receipt_parse_failed(uuid, uuid, uuid, integer) to service_role;
grant execute on function public.save_receipt_review(uuid, uuid, uuid, integer, jsonb) to authenticated;
grant execute on function public.promote_receipt_parse(uuid, uuid, uuid, integer, text, text, text, date, text, integer, jsonb) to authenticated;
grant execute on function public.mark_receipt_parse_failed(uuid, uuid, uuid, integer) to authenticated;

-- 3. Placed-receipt freeze guards.
drop trigger guard_placed_receipt_header_on_update on public.receipts;
drop trigger guard_placed_receipt_line_on_write on public.receipt_items;
drop trigger guard_placed_receipt_generation_on_write on public.receipt_parse_generations;
drop function public.guard_placed_receipt_header();
drop function public.guard_placed_receipt_line();
drop function public.guard_placed_receipt_generation();

-- 4. Acquisition events and placements (dropping a table does not fire its row triggers).
drop table public.inventory_acquisition_events;
drop table public.receipt_placements;
drop function public.guard_acquisition_event_immutable();
drop function public.guard_receipt_placement_immutable();

-- 5. Item lineage. Dropping the column also drops its unique key and foreign key.
drop trigger guard_item_receipt_lineage_on_write on public.items;
drop function public.guard_item_receipt_lineage();
alter table public.items drop column source_receipt_item_id;

-- 6. Item write grants: replace 311's column-level insert/update grants with the pre-311
-- table-level privileges (schema default privileges: all to anon, authenticated, service_role).
revoke insert (
  id, household_id, name, qty_value, qty_unit, category_id, zone_id, expires_on, added_on,
  removed_on, source, removal_reason, expiry_fact_id, expiry_source, expiry_origin,
  expiry_printed_marking, expiry_confirmed_at, expiry_declaration
), update (
  id, household_id, name, qty_value, qty_unit, category_id, zone_id, expires_on, added_on,
  removed_on, source, removal_reason, expiry_fact_id, expiry_source, expiry_origin,
  expiry_printed_marking, expiry_confirmed_at, expiry_declaration
) on public.items from authenticated, service_role;
grant insert, update on table public.items to anon, authenticated, service_role;

commit;
