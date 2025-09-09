-- Add campus field to teacher_profiles table
ALTER TABLE public.teacher_profiles 
ADD COLUMN campus text;