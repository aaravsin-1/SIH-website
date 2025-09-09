-- Enable Row Level Security on remaining tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_group_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_info ENABLE ROW LEVEL SECURITY;