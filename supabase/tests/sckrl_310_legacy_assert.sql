-- Verify the upgrade preserves original evidence and never infers user approval.
do $$
declare
  v_receipt public.receipts%rowtype;
  v_item public.receipt_items%rowtype;
begin
  select * into strict v_receipt from public.receipts
    where id = '31000000-0000-4000-8000-000000000100';
  select * into strict v_item from public.receipt_items
    where id = '31000000-0000-4000-8000-000000001000';

  if v_receipt.store_name is distinct from 'Fixture store'
    or v_receipt.total_cents is distinct from 123
    or v_receipt.parsed_at is distinct from '2026-09-01T10:01:00Z'::timestamptz
    or v_receipt.status is distinct from 'parsed'
  then
    raise exception 'Legacy receipt header changed during upgrade';
  end if;

  if v_item.raw_text is distinct from 'MILK 1L 1.23'
    or v_item.inferred_name is distinct from 'Milk'
    or v_item.qty_value is distinct from 1
    or v_item.qty_unit is distinct from 'l'
    or v_item.category_id is distinct from 'dairy'
    or v_item.confidence is distinct from 0.99
    or v_item.confidence_level is distinct from 'high'
  then
    raise exception 'Legacy parser evidence changed during upgrade';
  end if;

  if v_item.generation_id is null
    or v_item.generation_id is distinct from v_receipt.active_parse_generation_id
    or v_item.parser_version is distinct from 'legacy-sckrl-303'
    or v_item.review_state is distinct from 'unresolved'
    or v_item.reviewed_at is not null
    or v_item.reviewed_by is not null
    or v_item.corrected_at is not null
    or v_receipt.review_status is distinct from 'needs_review'
    or v_receipt.review_revision is distinct from 0
    or v_receipt.reviewed_at is not null
    or v_receipt.reviewed_by is not null
  then
    raise exception 'Legacy receipt acquired incorrect generation or user approval';
  end if;

  if v_item.inferred_line_total_cents is not null
    or v_item.inferred_unit_price_cents is not null
    or v_item.inferred_discount_cents is not null
    or v_item.inferred_tax_cents is not null
  then
    raise exception 'Legacy unknown financial values were fabricated';
  end if;
end $$;
