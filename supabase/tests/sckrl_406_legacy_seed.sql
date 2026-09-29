-- Synthetic pre-SCKRL-406 data. Apply after baseline migrations, before SCKRL-406.
-- Two households, one with dated and undated legacy stock, so the backfill and the
-- household isolation rules can both be checked after the upgrade.
INSERT INTO auth.users(id,email) VALUES
  ('40600000-0000-4000-8000-000000000001','s406-member@example.invalid'),
  ('40600000-0000-4000-8000-000000000002','s406-outsider@example.invalid');

INSERT INTO public.households(id,owner_id,name) VALUES
  ('40600000-0000-4000-8000-000000000010','40600000-0000-4000-8000-000000000001','S406 test household'),
  ('40600000-0000-4000-8000-000000000020','40600000-0000-4000-8000-000000000002','S406 outside household');

INSERT INTO public.household_members(household_id,user_id) VALUES
  ('40600000-0000-4000-8000-000000000010','40600000-0000-4000-8000-000000000001'),
  ('40600000-0000-4000-8000-000000000020','40600000-0000-4000-8000-000000000002');

-- Legacy item carrying a visible date that must survive the upgrade byte for byte.
INSERT INTO public.items(id,household_id,name,qty_value,qty_unit,category_id,zone_id,expires_on,added_on,source) VALUES
  ('40600000-0000-4000-8000-000000000100','40600000-0000-4000-8000-000000000010','Legacy milk',1,'l','dairy',
   (SELECT id FROM public.zones WHERE household_id='40600000-0000-4000-8000-000000000010' AND key='fridge'),
   '2026-09-20','2026-09-01','manual');

-- Legacy item without a date. It must receive no fact at all.
INSERT INTO public.items(id,household_id,name,qty_value,qty_unit,category_id,zone_id,expires_on,added_on,source) VALUES
  ('40600000-0000-4000-8000-000000000101','40600000-0000-4000-8000-000000000010','Legacy salt',500,'g','spices',
   (SELECT id FROM public.zones WHERE household_id='40600000-0000-4000-8000-000000000010' AND key='pantry'),
   NULL,'2026-09-01','manual');

-- Legacy item in the other household, used for cross-household checks.
INSERT INTO public.items(id,household_id,name,qty_value,qty_unit,category_id,zone_id,expires_on,added_on,source) VALUES
  ('40600000-0000-4000-8000-000000000200','40600000-0000-4000-8000-000000000020','Outside yoghurt',1,'pcs','dairy',
   (SELECT id FROM public.zones WHERE household_id='40600000-0000-4000-8000-000000000020' AND key='fridge'),
   '2026-09-25','2026-09-01','manual');
