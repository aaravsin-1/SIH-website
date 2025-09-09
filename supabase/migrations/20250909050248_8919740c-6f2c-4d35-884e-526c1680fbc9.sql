-- Enable RLS on tables that have policies but RLS is disabled
ALTER TABLE public.stud_in ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.dep_classifier ENABLE ROW LEVEL SECURITY;