-- ADR-0002: User profile storage.
-- One row per user, keyed by user_id. The resume column holds a JSON Resume
-- object; extras holds future extensions without schema changes.
-- Retained until the account is deleted (separate from the 12-month CV retention).

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  resume jsonb not null default '{}',
  extras jsonb not null default '{}',
  version int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- No RLS policies: service-role only, matching the ats_reports pattern.
