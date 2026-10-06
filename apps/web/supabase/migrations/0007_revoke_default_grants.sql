-- ats_reports and profiles were created without the explicit revoke the other
-- tables carry, so Supabase's default privileges left anon and authenticated
-- with table grants. RLS with no policies already denies them; this removes
-- the grants as well so a future policy cannot open the table by accident.

revoke all on public.ats_reports from anon, authenticated;
revoke all on public.profiles from anon, authenticated;
