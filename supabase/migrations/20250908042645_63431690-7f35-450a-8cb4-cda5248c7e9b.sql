-- Add basic RLS policies for the newly enabled tables

-- Messages table policies (since it has RLS enabled but no policies)
CREATE POLICY "Messages are only accessible to authenticated users"
ON public.messages
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Dep_classifier table policies
CREATE POLICY "Dep_classifier is accessible to authenticated users"
ON public.dep_classifier
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Check what other tables need RLS enabled
DO $$
BEGIN
    -- Only enable RLS if table exists and doesn't have it
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles' AND rowsecurity = true) THEN
            ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
        END IF;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'student_info') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'student_info' AND rowsecurity = true) THEN
            ALTER TABLE public.student_info ENABLE ROW LEVEL SECURITY;
        END IF;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'teacher_profiles') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'teacher_profiles' AND rowsecurity = true) THEN
            ALTER TABLE public.teacher_profiles ENABLE ROW LEVEL SECURITY;
        END IF;
    END IF;
END $$;