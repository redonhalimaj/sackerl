-- Run after the 311 migration on the same populated disposable replay as the legacy seed.
\set ON_ERROR_STOP on

do $$
begin
  if not exists (select 1 from public.items where id='31100000-0000-4000-8000-000000000300'
    and source='receipt' and source_receipt_item_id is null and name='Legacy receipt item') then
    raise exception 'Legacy unlinked receipt stock was not preserved/grandfathered.';
  end if;
  if not exists (select 1 from public.receipts where id='31100000-0000-4000-8000-000000000100'
    and purchased_on=date '2026-10-01' and review_revision=1 and review_status='reviewed') then
    raise exception 'Legacy receipt header/review state changed during SCKRL-311 upgrade.';
  end if;
  if (select count(*) from public.receipt_items where receipt_id='31100000-0000-4000-8000-000000000100') <> 4
    or (select count(*) from public.items where household_id='31100000-0000-4000-8000-000000000010') <> 1
    or exists (select 1 from public.receipt_placements where receipt_id='31100000-0000-4000-8000-000000000100') then
    raise exception '311 migration altered legacy review/stock or invented a placement.';
  end if;
end;
$$;
