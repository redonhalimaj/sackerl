-- SCKRL-406: expiry provenance and confirmation.
--
-- items.expires_on stays the compatible displayed-date projection. Every change to it now also
-- appends one immutable row to public.item_expiry_facts describing where that date came from and
-- whether a person confirmed it. No value in this model asserts that food is safe.
--
-- See docs/features/sckrl-406-expiry-provenance.md and the 2026-09-16 addendum in
-- docs/architecture/adr-0001-reliable-food-loop.md.

do $$
begin
  create type public.expiry_fact_source as enum ('printed', 'user', 'estimated', 'model');
exception
  when duplicate_object then null;
end $$;

-- How the provenance itself was obtained, so an undeclared write cannot claim a source it does
-- not have and a migration backfill stays distinguishable from a real estimate.
do $$
begin
  create type public.expiry_fact_origin as enum ('declared', 'inferred', 'backfill');
exception
  when duplicate_object then null;
end $$;

-- What the package label said. Independent of source and confirmation.
do $$
begin
  create type public.expiry_printed_marking as enum ('use_by', 'best_before', 'unknown');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'items_id_household_id_key'
      and conrelid = 'public.items'::regclass
  ) then
    alter table public.items
      add constraint items_id_household_id_key unique (id, household_id);
  end if;
end $$;

create table if not exists public.item_expiry_facts (
  id uuid primary key default gen_random_uuid(),
  fact_sequence bigint generated always as identity,
  household_id uuid not null,
  item_id uuid not null,
  expires_on date,
  source public.expiry_fact_source not null,
  origin public.expiry_fact_origin not null,
  printed_marking public.expiry_printed_marking not null default 'unknown',
  confidence numeric(4, 3),
  estimator_version text,
  confirmed_at timestamptz,
  confirmed_by uuid,
  supersedes_fact_id uuid,
  superseded_at timestamptz,
  is_active boolean not null default true,
  recorded_by uuid,
  recorded_at timestamptz not null default now(),
  constraint item_expiry_facts_fact_sequence_key unique (fact_sequence),
  constraint item_expiry_facts_id_household_id_key unique (id, household_id),
  constraint item_expiry_facts_item_fk
    foreign key (item_id, household_id)
    references public.items (id, household_id)
    on update cascade
    on delete cascade
    deferrable initially deferred,
  -- A missing date is never package evidence.
  constraint item_expiry_facts_printed_requires_date
    check (source <> 'printed' or expires_on is not null),
  -- Only a person records "this item has no expiry date".
  constraint item_expiry_facts_cleared_requires_user
    check (expires_on is not null or source = 'user'),
  constraint item_expiry_facts_confidence_scope
    check (
      confidence is null
      or (source in ('estimated', 'model') and confidence >= 0 and confidence <= 1)
    ),
  constraint item_expiry_facts_estimator_scope
    check (
      estimator_version is null
      or (
        source in ('estimated', 'model')
        and char_length(trim(estimator_version)) between 1 and 80
      )
    ),
  -- A guess has no printed label.
  constraint item_expiry_facts_marking_scope
    check (printed_marking = 'unknown' or source in ('printed', 'user')),
  constraint item_expiry_facts_confirmation_pair
    check ((confirmed_at is null) = (confirmed_by is null)),
  constraint item_expiry_facts_active_supersede_check
    check (is_active = (superseded_at is null)),
  constraint item_expiry_facts_no_self_supersede
    check (supersedes_fact_id is null or supersedes_fact_id <> id),
  -- An undeclared write is forced into the weakest honest shape: no confidence, no estimator,
  -- no printed marking and no confirmation.
  constraint item_expiry_facts_undeclared_shape
    check (
      origin = 'declared'
      or (
        confidence is null
        and estimator_version is null
        and confirmed_at is null
        and confirmed_by is null
        and printed_marking = 'unknown'
        and (
          (expires_on is not null and source = 'estimated')
          or (expires_on is null and source = 'user')
        )
      )
    ),
  constraint item_expiry_facts_backfill_actor
    check (origin <> 'backfill' or recorded_by is null)
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'item_expiry_facts_supersedes_fk'
      and conrelid = 'public.item_expiry_facts'::regclass
  ) then
    alter table public.item_expiry_facts
      add constraint item_expiry_facts_supersedes_fk
      foreign key (supersedes_fact_id, household_id)
      references public.item_expiry_facts (id, household_id)
      deferrable initially deferred;
  end if;
end $$;

create unique index if not exists item_expiry_facts_active_item_idx
  on public.item_expiry_facts (item_id)
  where is_active;

create unique index if not exists item_expiry_facts_supersedes_idx
  on public.item_expiry_facts (supersedes_fact_id)
  where supersedes_fact_id is not null;

create index if not exists item_expiry_facts_history_idx
  on public.item_expiry_facts (household_id, item_id, fact_sequence desc);

-- Read projection of the active fact so list screens keep one query. Maintained only by
-- sync_item_expiry_fact; any client-supplied value is discarded on every write.
alter table public.items
  add column if not exists expiry_fact_id uuid,
  add column if not exists expiry_source public.expiry_fact_source,
  add column if not exists expiry_origin public.expiry_fact_origin,
  add column if not exists expiry_printed_marking public.expiry_printed_marking,
  add column if not exists expiry_confirmed_at timestamptz,
  add column if not exists expiry_declaration jsonb;

alter table public.households
  add column if not exists calendar_time_zone text not null default 'Europe/Vienna';

alter table public.households
  drop constraint if exists households_calendar_time_zone_check;

alter table public.households
  add constraint households_calendar_time_zone_check
  check (calendar_time_zone ~ '^(UTC|[A-Za-z][A-Za-z0-9_+-]*(/[A-Za-z0-9_+.-]+){1,2})$');

create or replace function public.validate_household_calendar_time_zone()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1
    from pg_timezone_names
    where name = new.calendar_time_zone
  ) then
    raise sqlstate 'PT400' using message = 'calendar_time_zone must be a valid IANA time zone.';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_household_calendar_time_zone_on_write on public.households;

create trigger validate_household_calendar_time_zone_on_write
  before insert or update of calendar_time_zone on public.households
  for each row execute function public.validate_household_calendar_time_zone();

drop policy if exists "Household members can view households" on public.households;
create policy "Household members can view households"
  on public.households
  for select
  using (public.is_household_member(id));

-- Appends one fact and supersedes the previous active one. Idempotent: an identical active fact
-- is returned unchanged so client retries do not create history noise. Confirmation is never
-- inherited from the superseded fact.
create or replace function public.append_item_expiry_fact(
  p_household_id uuid,
  p_item_id uuid,
  p_expires_on date,
  p_source public.expiry_fact_source,
  p_origin public.expiry_fact_origin,
  p_printed_marking public.expiry_printed_marking,
  p_confidence numeric,
  p_estimator_version text,
  p_confirm boolean,
  p_actor uuid
)
returns public.item_expiry_facts
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_active public.item_expiry_facts%rowtype;
  v_fact public.item_expiry_facts%rowtype;
  v_confidence numeric(4, 3);
  v_confirmed_at timestamptz;
  v_confirmed_by uuid;
begin
  v_confidence := case when p_confidence is null then null else round(p_confidence, 3) end;

  select *
  into v_active
  from public.item_expiry_facts
  where item_id = p_item_id
    and is_active
  limit 1;

  if v_active.id is not null
    and v_active.household_id <> p_household_id
  then
    raise sqlstate 'PT403' using message = 'Expiry history belongs to another household.';
  end if;

  if v_active.id is not null
    and v_active.expires_on is not distinct from p_expires_on
    and v_active.source = p_source
    and v_active.origin = p_origin
    and v_active.printed_marking = p_printed_marking
    and v_active.confidence is not distinct from v_confidence
    and v_active.estimator_version is not distinct from p_estimator_version
    and (not coalesce(p_confirm, false) or v_active.confirmed_at is not null)
  then
    return v_active;
  end if;

  if coalesce(p_confirm, false) then
    if p_actor is null then
      raise sqlstate 'PT401' using message = 'Authentication is required to confirm an expiry date.';
    end if;

    v_confirmed_at := now();
    v_confirmed_by := p_actor;
  end if;

  if v_active.id is not null then
    update public.item_expiry_facts
    set is_active = false,
        superseded_at = now()
    where id = v_active.id;
  end if;

  insert into public.item_expiry_facts (
    household_id,
    item_id,
    expires_on,
    source,
    origin,
    printed_marking,
    confidence,
    estimator_version,
    confirmed_at,
    confirmed_by,
    supersedes_fact_id,
    superseded_at,
    is_active,
    recorded_by
  )
  values (
    p_household_id,
    p_item_id,
    p_expires_on,
    p_source,
    p_origin,
    p_printed_marking,
    v_confidence,
    p_estimator_version,
    v_confirmed_at,
    v_confirmed_by,
    v_active.id,
    null,
    true,
    case when p_origin = 'backfill' then null else p_actor end
  )
  returning * into v_fact;

  return v_fact;
end;
$$;

-- Single write path for expiry provenance. It runs for every items insert and update, including
-- the existing direct PostgREST calls, so the active fact and items.expires_on can never disagree.
create or replace function public.sync_item_expiry_fact()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_declaration jsonb := new.expiry_declaration;
  v_allowed_keys constant text[] := array[
    'source',
    'printed_marking',
    'confidence',
    'estimator_version',
    'confirm',
    'expected_fact_id'
  ];
  v_source public.expiry_fact_source;
  v_marking public.expiry_printed_marking := 'unknown';
  v_confidence numeric;
  v_estimator text;
  v_confirm boolean := false;
  v_expected uuid;
  v_expected_present boolean := false;
  v_actor uuid := auth.uid();
  v_active public.item_expiry_facts%rowtype;
  v_fact public.item_expiry_facts%rowtype;
  v_date_changed boolean;
  v_raw text;
begin
  -- The declaration is a write-only command value and is never stored.
  new.expiry_declaration := null;

  -- Projection columns are database owned; discard whatever the client sent.
  if tg_op = 'UPDATE' then
    new.expiry_fact_id := old.expiry_fact_id;
    new.expiry_source := old.expiry_source;
    new.expiry_origin := old.expiry_origin;
    new.expiry_printed_marking := old.expiry_printed_marking;
    new.expiry_confirmed_at := old.expiry_confirmed_at;
    v_date_changed := new.expires_on is distinct from old.expires_on;
  else
    new.expiry_fact_id := null;
    new.expiry_source := null;
    new.expiry_origin := null;
    new.expiry_printed_marking := null;
    new.expiry_confirmed_at := null;
    v_date_changed := new.expires_on is not null;
  end if;

  if v_declaration is not null and jsonb_typeof(v_declaration) <> 'object' then
    raise sqlstate 'PT400' using message = 'expiry_declaration must be a JSON object.';
  end if;

  -- An unrelated edit keeps the existing provenance and confirmation untouched.
  if v_declaration is null and not v_date_changed then
    return new;
  end if;

  if v_declaration is not null then
    if exists (
      select 1
      from jsonb_object_keys(v_declaration) as declaration_key
      where declaration_key <> all (v_allowed_keys)
    ) then
      raise sqlstate 'PT400' using message = 'expiry_declaration contains unsupported keys.';
    end if;

    v_raw := v_declaration ->> 'source';

    if v_raw is null then
      raise sqlstate 'PT400' using message = 'expiry_declaration.source is required.';
    end if;

    if v_raw = 'model' then
      raise sqlstate 'PT400' using message = 'Model-derived expiry provenance is not enabled.';
    end if;

    if v_raw not in ('printed', 'user', 'estimated') then
      raise sqlstate 'PT400' using message = 'expiry_declaration.source is invalid.';
    end if;

    v_source := v_raw::public.expiry_fact_source;

    if v_declaration ? 'printed_marking' and jsonb_typeof(v_declaration -> 'printed_marking') <> 'null' then
      v_raw := v_declaration ->> 'printed_marking';

      if v_raw not in ('use_by', 'best_before', 'unknown') then
        raise sqlstate 'PT400' using message = 'expiry_declaration.printed_marking is invalid.';
      end if;

      v_marking := v_raw::public.expiry_printed_marking;
    end if;

    if v_declaration ? 'confidence' and jsonb_typeof(v_declaration -> 'confidence') <> 'null' then
      if jsonb_typeof(v_declaration -> 'confidence') <> 'number' then
        raise sqlstate 'PT400' using message = 'expiry_declaration.confidence must be a number.';
      end if;

      v_confidence := (v_declaration ->> 'confidence')::numeric;

      if v_confidence < 0 or v_confidence > 1 then
        raise sqlstate 'PT400' using message = 'expiry_declaration.confidence must be between 0 and 1.';
      end if;
    end if;

    if v_declaration ? 'estimator_version' and jsonb_typeof(v_declaration -> 'estimator_version') <> 'null' then
      if jsonb_typeof(v_declaration -> 'estimator_version') <> 'string' then
        raise sqlstate 'PT400' using message = 'expiry_declaration.estimator_version must be a string.';
      end if;

      v_estimator := trim(v_declaration ->> 'estimator_version');

      if char_length(v_estimator) < 1 or char_length(v_estimator) > 80 then
        raise sqlstate 'PT400' using message = 'expiry_declaration.estimator_version must be 1 to 80 characters.';
      end if;
    end if;

    if v_declaration ? 'confirm' and jsonb_typeof(v_declaration -> 'confirm') <> 'null' then
      if jsonb_typeof(v_declaration -> 'confirm') <> 'boolean' then
        raise sqlstate 'PT400' using message = 'expiry_declaration.confirm must be a boolean.';
      end if;

      v_confirm := (v_declaration ->> 'confirm')::boolean;
    end if;

    if v_declaration ? 'expected_fact_id' then
      v_expected_present := true;

      if jsonb_typeof(v_declaration -> 'expected_fact_id') = 'null' then
        v_expected := null;
      elsif jsonb_typeof(v_declaration -> 'expected_fact_id') <> 'string' then
        raise sqlstate 'PT400' using message = 'expiry_declaration.expected_fact_id must be a uuid string.';
      else
        begin
          v_expected := (v_declaration ->> 'expected_fact_id')::uuid;
        exception
          when invalid_text_representation then
            raise sqlstate 'PT400' using message = 'expiry_declaration.expected_fact_id must be a uuid string.';
        end;
      end if;
    end if;

    if v_source = 'printed' and new.expires_on is null then
      raise sqlstate 'PT400' using message = 'A printed expiry source requires a date.';
    end if;

    if new.expires_on is null and v_source <> 'user' then
      raise sqlstate 'PT400' using message = 'Clearing an expiry date requires the user source.';
    end if;

    if v_confidence is not null and v_source <> 'estimated' then
      raise sqlstate 'PT400' using message = 'Confidence is only valid for an estimated expiry date.';
    end if;

    if v_estimator is not null and v_source <> 'estimated' then
      raise sqlstate 'PT400' using message = 'An estimator version is only valid for an estimated expiry date.';
    end if;

    if v_marking <> 'unknown' and v_source not in ('printed', 'user') then
      raise sqlstate 'PT400' using message = 'A printed marking requires a printed or user-entered date.';
    end if;
  end if;

  if v_expected_present then
    select *
    into v_active
    from public.item_expiry_facts
    where item_id = new.id
      and is_active
    limit 1;

    if v_active.id is distinct from v_expected then
      if v_expected is not null and exists (
        select 1
        from public.item_expiry_facts
        where id = v_expected
          and household_id <> new.household_id
      ) then
        raise sqlstate 'PT403' using message = 'The expected expiry fact belongs to another household.';
      end if;

      raise sqlstate 'PT409' using message = 'The expiry date changed. Reload the item before saving.';
    end if;
  end if;

  if v_declaration is null then
    v_fact := public.append_item_expiry_fact(
      new.household_id,
      new.id,
      new.expires_on,
      case when new.expires_on is null then 'user' else 'estimated' end::public.expiry_fact_source,
      'inferred',
      'unknown',
      null,
      null,
      false,
      v_actor
    );
  else
    v_fact := public.append_item_expiry_fact(
      new.household_id,
      new.id,
      new.expires_on,
      v_source,
      'declared',
      v_marking,
      v_confidence,
      v_estimator,
      v_confirm,
      v_actor
    );
  end if;

  new.expiry_fact_id := v_fact.id;
  new.expiry_source := v_fact.source;
  new.expiry_origin := v_fact.origin;
  new.expiry_printed_marking := v_fact.printed_marking;
  new.expiry_confirmed_at := v_fact.confirmed_at;

  return new;
end;
$$;

-- History survives an accidentally broad grant: only the supersede transition may update a fact,
-- and a fact may only disappear together with its item.
create or replace function public.guard_item_expiry_fact_history()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'DELETE' then
    if not exists (
      select 1
      from public.items
      where id = old.item_id
    ) then
      return old;
    end if;

    raise sqlstate 'PT403' using message = 'Expiry fact history cannot be deleted.';
  end if;

  if old.is_active
    and not new.is_active
    and old.superseded_at is null
    and new.superseded_at is not null
    and new.id = old.id
    and new.household_id = old.household_id
    and new.item_id = old.item_id
    and new.expires_on is not distinct from old.expires_on
    and new.source = old.source
    and new.origin = old.origin
    and new.printed_marking = old.printed_marking
    and new.confidence is not distinct from old.confidence
    and new.estimator_version is not distinct from old.estimator_version
    and new.confirmed_at is not distinct from old.confirmed_at
    and new.confirmed_by is not distinct from old.confirmed_by
    and new.supersedes_fact_id is not distinct from old.supersedes_fact_id
    and new.recorded_by is not distinct from old.recorded_by
    and new.recorded_at = old.recorded_at
    and new.fact_sequence = old.fact_sequence
  then
    return new;
  end if;

  raise sqlstate 'PT403' using message = 'Expiry facts are append-only.';
end;
$$;

-- Backfill before the item trigger exists so the projection update is not treated as an edit.
-- Existing dates are preserved exactly, stay unconfirmed, and invent no estimator or confidence.
insert into public.item_expiry_facts (
  household_id,
  item_id,
  expires_on,
  source,
  origin,
  printed_marking,
  confidence,
  estimator_version,
  confirmed_at,
  confirmed_by,
  supersedes_fact_id,
  superseded_at,
  is_active,
  recorded_by
)
select
  items.household_id,
  items.id,
  items.expires_on,
  'estimated',
  'backfill',
  'unknown',
  null,
  null,
  null,
  null,
  null,
  null,
  true,
  null
from public.items
where items.expires_on is not null
  and not exists (
    select 1
    from public.item_expiry_facts
    where item_expiry_facts.item_id = items.id
  );

update public.items
set expiry_fact_id = fact.id,
    expiry_source = fact.source,
    expiry_origin = fact.origin,
    expiry_printed_marking = fact.printed_marking,
    expiry_confirmed_at = fact.confirmed_at
from public.item_expiry_facts as fact
where fact.item_id = items.id
  and fact.is_active
  and items.expiry_fact_id is distinct from fact.id;

-- The item foreign key is deferrable, so settle the backfill's pending events before the
-- remaining ALTER statements in this migration.
set constraints all immediate;

alter table public.items
  drop constraint if exists items_expiry_projection_check;

alter table public.items
  add constraint items_expiry_projection_check
  check (
    (
      expiry_fact_id is null
      and expiry_source is null
      and expiry_origin is null
      and expiry_printed_marking is null
      and expiry_confirmed_at is null
    )
    or (
      expiry_fact_id is not null
      and expiry_source is not null
      and expiry_origin is not null
      and expiry_printed_marking is not null
    )
  );

alter table public.items
  drop constraint if exists items_expiry_declaration_is_write_only;

alter table public.items
  add constraint items_expiry_declaration_is_write_only
  check (expiry_declaration is null);

drop trigger if exists sync_item_expiry_fact_on_write on public.items;

create trigger sync_item_expiry_fact_on_write
  before insert or update on public.items
  for each row execute function public.sync_item_expiry_fact();

drop trigger if exists guard_item_expiry_fact_history_on_write on public.item_expiry_facts;

create trigger guard_item_expiry_fact_history_on_write
  before update or delete on public.item_expiry_facts
  for each row execute function public.guard_item_expiry_fact_history();

alter table public.item_expiry_facts enable row level security;

drop policy if exists "Household members can view expiry facts" on public.item_expiry_facts;
create policy "Household members can view expiry facts"
  on public.item_expiry_facts
  for select
  using (public.is_household_member(household_id));

revoke all on table public.item_expiry_facts from public, anon, authenticated;
grant select on table public.item_expiry_facts to authenticated;

revoke all on function public.append_item_expiry_fact(
  uuid,
  uuid,
  date,
  public.expiry_fact_source,
  public.expiry_fact_origin,
  public.expiry_printed_marking,
  numeric,
  text,
  boolean,
  uuid
) from public, anon, authenticated;

revoke all on function public.sync_item_expiry_fact() from public, anon, authenticated;
revoke all on function public.guard_item_expiry_fact_history() from public, anon, authenticated;
revoke all on function public.validate_household_calendar_time_zone() from public, anon, authenticated;

comment on table public.item_expiry_facts is
  'SCKRL-406 append-only expiry provenance. One active fact per item mirrors items.expires_on. No value here asserts food safety.';
comment on column public.items.expiry_declaration is
  'SCKRL-406 write-only command value. The item trigger consumes it and always stores null.';
comment on column public.households.calendar_time_zone is
  'SCKRL-406 household IANA calendar zone. Defaults to the SCKRL-506 Europe/Vienna pilot value.';
