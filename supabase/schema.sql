-- QR Attendance database schema
-- Safe to run more than once in the Supabase SQL editor.

create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  full_name  text,
  role       text not null default 'student'
             check (role in ('student', 'teacher')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  event_code  text not null unique,
  title       text not null,
  start_time  timestamptz,
  end_time    timestamptz,
  created_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now()
);

create table if not exists public.attendance (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references auth.users (id) on delete cascade,
  event_id    uuid not null references public.events (id) on delete cascade,
  scanned_at  timestamptz not null default now(),
  unique (student_id, event_id)
);

alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.attendance enable row level security;

-- Remove policies first so this script can be safely rerun.
drop policy if exists "Profiles are viewable by owner" on public.profiles;
drop policy if exists "Teachers can view profiles of their attendees" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Users cannot change their own role" on public.profiles;
drop policy if exists "Events are readable by any authenticated user" on public.events;
drop policy if exists "Users can insert events" on public.events;
drop policy if exists "Users can update their own events" on public.events;
drop policy if exists "Students can view their own attendance" on public.attendance;
drop policy if exists "Students can insert their own attendance" on public.attendance;
drop policy if exists "Teachers can view attendance for their events" on public.attendance;

create policy "Profiles are viewable by owner"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "Teachers can view profiles of their attendees"
  on public.profiles for select
  to authenticated
  using (
    exists (
      select 1
      from public.attendance a
      join public.events e on e.id = a.event_id
      where a.student_id = profiles.id
        and e.created_by = auth.uid()
    )
  );

create policy "Users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id and role = 'student');

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create or replace function public.prevent_profile_role_change()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() = old.id and new.role is distinct from old.role then
    raise exception 'Profile role cannot be changed by the user';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_profile_role_change on public.profiles;

create trigger prevent_profile_role_change
  before update of role on public.profiles
  for each row
  execute function public.prevent_profile_role_change();

create policy "Events are readable by any authenticated user"
  on public.events for select
  to authenticated
  using (true);

create policy "Users can insert events"
  on public.events for insert
  to authenticated
  with check (
    created_by is null
    or (
      created_by = auth.uid()
      and exists (
        select 1
        from public.profiles p
        where p.id = auth.uid()
          and p.role = 'teacher'
      )
    )
  );

create policy "Users can update their own events"
  on public.events for update
  to authenticated
  using (
    created_by = auth.uid()
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'teacher'
    )
  )
  with check (
    created_by = auth.uid()
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'teacher'
    )
  );

create policy "Students can view their own attendance"
  on public.attendance for select
  to authenticated
  using (auth.uid() = student_id);

create policy "Students can insert their own attendance"
  on public.attendance for insert
  to authenticated
  with check (auth.uid() = student_id);

create policy "Teachers can view attendance for their events"
  on public.attendance for select
  to authenticated
  using (
    exists (
      select 1
      from public.events e
      where e.id = attendance.event_id
        and e.created_by = auth.uid()
    )
  );

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    new.raw_user_meta_data ->> 'full_name',
    coalesce(new.raw_user_meta_data ->> 'role', 'student')
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, profiles.full_name),
        role = excluded.role,
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

update public.profiles p
set role = u.raw_user_meta_data ->> 'role',
    updated_at = now()
from auth.users u
where u.id = p.id
  and u.raw_user_meta_data ->> 'role' in ('student', 'teacher')
  and p.role is distinct from u.raw_user_meta_data ->> 'role';
