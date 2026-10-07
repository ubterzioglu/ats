-- Add user_id to ats_reports for account binding
alter table public.ats_reports
  add column user_id uuid references auth.users(id) on delete set null;

create index idx_ats_reports_user_id on public.ats_reports(user_id);

-- cv_submissions already has user_id from 0003
