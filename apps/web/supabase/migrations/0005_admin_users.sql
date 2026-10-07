create table public.admin_users (
  email text primary key check (email = lower(email)),
  created_at timestamptz not null default now(),
  created_by text
);

alter table public.admin_users enable row level security;
-- no policies on purpose: only the service role reaches this table
revoke all on public.admin_users from anon, authenticated;

insert into public.admin_users (email, created_by)
values ('ubterzioglu@gmail.com', 'migration')
on conflict (email) do nothing;
