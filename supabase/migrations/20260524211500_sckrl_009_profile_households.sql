-- SCKRL-009: user profile and household model.

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  locale text not null default 'de',
  created_at timestamptz not null default now(),
  constraint users_locale_check check (locale ~ '^[a-z]{2}$')
);

create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users (id) on delete cascade,
  name text not null,or you
  created_at timestamptz not null default now(),
  constraint households_owner_id_key unique (owner_id),
  constraint households_name_check check (char_length(trim(name)) between 1 and 80)
);

create table if not exists public.household_members (
  household_id uuid not null references public.households (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  role text not null default 'owner',
  primary key (household_id, user_id),
  constraint household_members_user_id_key unique (user_id),
  constraint household_members_role_check check (role in ('owner', 'member'))
);

alter table public.users enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;

drop policy if exists "Users can insert their own profile" on public.users;
create policy "Users can insert their own profile"
  on public.users
  for insert
  with check (id = auth.uid());

drop policy if exists "Users can view their own profile" on public.users;
create policy "Users can view their own profile"
  on public.users
  for select
  using (id = auth.uid());

drop policy if exists "Users can update their own profile" on public.users;
create policy "Users can update their own profile"
  on public.users
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "Users can create their own household" on public.households;
create policy "Users can create their own household"
  on public.households
  for insert
  with check (owner_id = auth.uid());

drop policy if exists "Users can view their owned household" on public.households;
create policy "Users can view their owned household"
  on public.households
  for select
  using (owner_id = auth.uid());

drop policy if exists "Users can update their owned household" on public.households;
create policy "Users can update their owned household"
  on public.households
  for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "Users can create their own household membership" on public.household_members;
create policy "Users can create their own household membership"
  on public.household_members
  for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.households
      where households.id = household_members.household_id
        and households.owner_id = auth.uid()
    )
  );

drop policy if exists "Users can view their own household membership" on public.household_members;
create policy "Users can view their own household membership"
  on public.household_members
  for select
  using (user_id = auth.uid());

create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, locale, created_at)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(nullif(lower(substring(replace(new.raw_user_meta_data ->> 'locale', '_', '-') from '^[a-z]{2}')), ''), 'de'),
    coalesce(new.created_at, now())
  )
  on conflict (id) do update
    set email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_auth_user_created();

insert into public.users (id, email, locale, created_at)
select
  id,
  coalesce(email, ''),
  coalesce(nullif(lower(substring(replace(raw_user_meta_data ->> 'locale', '_', '-') from '^[a-z]{2}')), ''), 'de'),
  coalesce(created_at, now())
from auth.users
on conflict (id) do update
  set email = excluded.email;
