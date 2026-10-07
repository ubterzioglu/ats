create table public.cv_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '12 months'),
  user_id uuid references auth.users(id) on delete set null,
  client_hash text,
  file_name text,
  file_mime text,
  file_size integer check (file_size is null or file_size between 1 and 10485760),
  storage_path text,
  drive_file_id text,
  drive_status text not null default 'pending'
    check (drive_status in ('pending','uploaded','failed','skipped','deleted')),
  cv_text text not null,
  job_description text,
  language text,
  total integer check (total is null or total between 0 and 100),
  band text,
  result jsonb,
  consent_version text not null,
  consent_at timestamptz not null default now()
);
create index cv_submissions_created_idx on public.cv_submissions (created_at desc);
create index cv_submissions_expires_idx on public.cv_submissions (expires_at);
create index cv_submissions_client_idx on public.cv_submissions (client_hash, created_at);

create table public.admin_audit_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  admin_email text not null,
  action text not null check (action in ('list','view','download','delete','export','request_update')),
  submission_id uuid,
  detail text
);
create index admin_audit_log_at_idx on public.admin_audit_log (at desc);

create table public.data_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email text not null,
  kind text not null check (kind in ('access','delete','rectify','object','other')),
  message text,
  client_hash text,
  status text not null default 'open' check (status in ('open','done','rejected')),
  handled_at timestamptz,
  handled_by text
);

alter table public.cv_submissions enable row level security;
alter table public.admin_audit_log enable row level security;
alter table public.data_requests enable row level security;
-- no policies on purpose: only the service role reaches these tables
revoke all on public.cv_submissions, public.admin_audit_log, public.data_requests from anon, authenticated;

insert into storage.buckets (id, name, public) values ('cv-files', 'cv-files', false) on conflict (id) do nothing;
