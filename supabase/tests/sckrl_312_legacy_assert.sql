-- Run after the 312 legacy seed and migration, on the SAME disposable database.
\set ON_ERROR_STOP on

do $$
begin
  if not exists (select 1 from public.receipts where id = '31200000-0000-4000-8000-000000000100') then
    raise exception 'Missing SCKRL-312 legacy fixture. Seed before the 312 migration; see supabase/tests/README.md.';
  end if;
  if (select count(*) from public.receipt_items where receipt_id = '31200000-0000-4000-8000-000000000100') <> 3
    or exists (
      select 1 from public.receipt_items where receipt_id = '31200000-0000-4000-8000-000000000100'
        and (expiry_state <> 'unknown' or expiry_date is not null
          or expiry_changed_by is not null or expiry_changed_at is not null)
    )
  then
    raise exception 'Legacy parser/manual lines must preserve identity and default to unknown/null with no expiry editor.';
  end if;
  if not exists (
    select 1 from public.receipt_items where receipt_id = '31200000-0000-4000-8000-000000000100'
      and line_index = 0 and source = 'parser' and raw_text = 'MILK 1L 1.49'
      and inferred_name = 'Milk' and corrected_name = 'Whole Milk'
      and confidence = 0.95 and review_state = 'reviewed'
  ) or not exists (
    select 1 from public.receipt_items where receipt_id = '31200000-0000-4000-8000-000000000100'
      and source = 'manual' and client_line_id = 'legacy-manual-1' and corrected_name = 'Oats'
      and inferred_name is null and raw_text is null and review_state = 'reviewed'
  ) or not exists (
    select 1 from public.receipts where id = '31200000-0000-4000-8000-000000000100'
      and review_revision = 1 and review_status = 'reviewed' and purchased_on = date '2026-09-29'
  ) then
    raise exception '312 upgrade changed accepted review, parser evidence, manual provenance or receipt metadata.';
  end if;
end;
$$;
