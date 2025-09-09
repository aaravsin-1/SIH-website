-- Enable Row Level Security on resources table
-- This fixes the security warning about policies existing but RLS being disabled

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;