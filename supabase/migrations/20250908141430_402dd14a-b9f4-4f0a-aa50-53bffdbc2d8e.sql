-- Enable RLS on tables that have policies but RLS is not enabled
ALTER TABLE public.peer_support_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_group_permissions ENABLE ROW LEVEL SECURITY;

-- Ensure all other public tables that should have RLS enabled have it
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dep_classifier ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stud_in ENABLE ROW LEVEL SECURITY;