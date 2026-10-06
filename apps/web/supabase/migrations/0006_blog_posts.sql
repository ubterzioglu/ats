-- Blog posts table.
-- One language per post (no translation linking).
-- RLS on, no policies: service-role only, deny-all pattern.

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  locale text not null check (locale in ('en', 'tr', 'de')),
  slug text not null check (slug ~ '^[a-z0-9-]+$'),
  title text not null,
  description text not null default '',
  body_md text not null default '',
  status text not null check (status in ('draft', 'published')) default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  author_email text not null default '',
  unique (locale, slug)
);

create index if not exists idx_blog_posts_locale_status_published
  on public.blog_posts (locale, status, published_at desc);

alter table public.blog_posts enable row level security;

revoke all on public.blog_posts from anon, authenticated;

-- Extend admin_audit_log.action CHECK to include blog and user actions.
-- This assumes the CHECK constraint exists; if not, this is a no-op.
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
        'user_list'
      ));
  end if;
end $$;
