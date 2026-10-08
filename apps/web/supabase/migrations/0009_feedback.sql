-- Visitor feedback, read by admins.
-- RLS on, no policies: service-role only, deny-all pattern.

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  category text not null check (category in ('bug', 'idea', 'praise', 'other')),
  message text not null check (char_length(message) between 10 and 2000),
  email text check (email is null or char_length(email) <= 254),
  locale text check (locale is null or locale in ('en', 'tr', 'de')),
  client_hash text,
  status text not null default 'new' check (status in ('new', 'read', 'archived')),
  handled_at timestamptz,
  handled_by text
);

create index if not exists feedback_created_idx on public.feedback (created_at desc);
create index if not exists feedback_client_idx on public.feedback (client_hash, created_at);

alter table public.feedback enable row level security;

revoke all on public.feedback from anon, authenticated;

-- Extend admin_audit_log.action CHECK with the feedback action.
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'admin_audit_log_action_check'
  ) then
    alter table public.admin_audit_log
      drop constraint admin_audit_log_action_check;
    alter table public.admin_audit_log
      add constraint admin_audit_log_action_check
      check (action in (
        'list', 'view', 'download', 'delete', 'export', 'request_update',
        'submission_delete', 'submission_drive_delete', 'submission_storage_delete',
        'report_delete', 'data_request_create', 'data_request_update',
        'blog_create', 'blog_update', 'blog_publish', 'blog_delete',
        'user_list', 'feedback_update'
      ));
  end if;
end $$;
