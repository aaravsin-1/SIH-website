-- Add actual_duration column to activity_completions table
ALTER TABLE public.activity_completions 
ADD COLUMN actual_duration_minutes integer;