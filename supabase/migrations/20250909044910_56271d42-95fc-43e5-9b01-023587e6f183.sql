-- Fix RLS issues for existing tables
ALTER TABLE public.dep_classifier ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stud_in ENABLE ROW LEVEL SECURITY;