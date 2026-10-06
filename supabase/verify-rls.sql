-- Verify RLS is enabled on the new tables
do $$
begin
  if not exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'cv_submissions' and rowsecurity) then
    raise exception 'RLS not enabled on cv_submissions';
  end if;
  if not exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'admin_audit_log' and rowsecurity) then
    raise exception 'RLS not enabled on admin_audit_log';
  end if;
  if not exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'data_requests' and rowsecurity) then
    raise exception 'RLS not enabled on data_requests';
  end if;
end $$;

-- Verify cv-files bucket is private
do $$
begin
  if not exists (select 1 from storage.buckets where id = 'cv-files' and public = false) then
    raise exception 'cv-files bucket is not private or does not exist';
  end if;
end $$;
