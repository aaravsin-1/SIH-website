-- Check which tables don't have RLS enabled in the public schema
-- and enable RLS on any that are missing it

-- Get a list of all tables in public schema and their RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Enable RLS on all public tables that don't have it
DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT IN (
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public' 
            AND rowsecurity = true
        )
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', rec.tablename);
    END LOOP;
END $$;