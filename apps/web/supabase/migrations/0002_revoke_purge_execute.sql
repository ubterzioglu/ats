-- Close the execute surface on the purge function.
--
-- 0001 created purge_expired_ats_reports() as security definer but left the
-- default PUBLIC execute grant in place. On Supabase that lets anon and
-- authenticated call it via RPC. The function only deletes expired rows, so
-- the blast radius is small, but the surface is unnecessary. Restrict it to
-- service_role, which is the only caller the application ever uses.

revoke execute on function public.purge_expired_ats_reports() from public, anon, authenticated;
grant execute on function public.purge_expired_ats_reports() to service_role;
