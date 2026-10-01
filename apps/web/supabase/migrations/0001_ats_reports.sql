-- Shared analysis reports.
--
-- Rows hold scores and advice only: the server strips finding evidence before
-- inserting, and the CV text is never sent to the server in the first place.
-- Access goes exclusively through the service-role key in lib/supabase, so no
-- policy grants anon or authenticated any access.

create table if not exists public.ats_reports (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  total smallint not null check (total between 0 and 100),
  band text not null check (band in ('excellent', 'good', 'fair', 'risky')),
  language text not null check (char_length(language) <= 8),
  payload jsonb not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '30 days'
);

create index if not exists ats_reports_token_idx on public.ats_reports (token);
create index if not exists ats_reports_expires_at_idx on public.ats_reports (expires_at);

alter table public.ats_reports enable row level security;

-- Deliberately no policies: with RLS on and nothing granted, anon and
-- authenticated roles cannot read or write. Only the service role can.

comment on table public.ats_reports is
  'Shareable ATS readability reports. Scores and findings only, no CV content. Expires after 30 days.';

-- Housekeeping: run this from a scheduled job, or call it manually.
create or replace function public.purge_expired_ats_reports()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  removed integer;
begin
  delete from public.ats_reports where expires_at < now();
  get diagnostics removed = row_count;
  return removed;
end;
$$;
