-- Enable RLS on all public tables that need it
ALTER TABLE public.stud_in ENABLE ROW LEVEL SECURITY;

-- Check if other tables need RLS enabled
DO $$
DECLARE
    table_name text;
    table_list text[] := ARRAY['activity_completions', 'appointments', 'group_members', 'mood_entries', 'peer_support_groups', 'profiles', 'resources', 'self_care_activities', 'student_info', 'teacher_profiles', 'teacher_student_relationships', 'wellness_sessions'];
BEGIN
    FOREACH table_name IN ARRAY table_list
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', table_name);
    END LOOP;
END
$$;