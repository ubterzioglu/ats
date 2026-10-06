-- Supabase doğrulama sorguları
-- Supabase Dashboard > SQL Editor'de çalıştır

-- 1. Tablo var mı?
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'ats_reports';

-- 2. Policy var mı? (0 beklenir)
SELECT count(*) 
FROM pg_policies 
WHERE tablename = 'ats_reports';

-- 3. Anon purge fonksiyonunu çağırabilir mi? (false beklenir)
SELECT has_function_privilege('anon', 'public.purge_expired_ats_reports()', 'execute') AS anon_can_execute;

-- 4. Authenticated purge fonksiyonunu çağırabilir mi? (false beklenir)
SELECT has_function_privilege('authenticated', 'public.purge_expired_ats_reports()', 'execute') AS authenticated_can_execute;

-- 5. Service role çağırabilir mi? (true beklenir)
SELECT has_function_privilege('service_role', 'public.purge_expired_ats_reports()', 'execute') AS service_role_can_execute;

-- 6. Profiles tablosu var mı ve RLS açık mı?
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'profiles';

-- 7. Profiles policy var mı? (0 beklenir, service-role only)
SELECT count(*) 
FROM pg_policies 
WHERE tablename = 'profiles';
