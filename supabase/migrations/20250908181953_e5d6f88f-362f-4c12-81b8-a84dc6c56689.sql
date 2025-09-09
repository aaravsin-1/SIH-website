-- Enable teachers to manage wellness articles/resources
-- Update RLS policies for resources table to allow teachers full access

-- Allow teachers to insert new resources
CREATE POLICY "Teachers can insert resources" 
ON public.resources 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM teacher_profiles 
  WHERE user_id = auth.uid()
));

-- Allow teachers to update resources
CREATE POLICY "Teachers can update resources" 
ON public.resources 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM teacher_profiles 
  WHERE user_id = auth.uid()
));

-- Allow teachers to delete resources
CREATE POLICY "Teachers can delete resources" 
ON public.resources 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM teacher_profiles 
  WHERE user_id = auth.uid()
));