-- Allow teachers to manage self-care activities
-- Teachers can insert new activities
CREATE POLICY "Teachers can insert activities" ON public.self_care_activities
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM teacher_profiles 
    WHERE teacher_profiles.user_id = auth.uid()
  )
);

-- Teachers can update activities
CREATE POLICY "Teachers can update activities" ON public.self_care_activities
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM teacher_profiles 
    WHERE teacher_profiles.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM teacher_profiles 
    WHERE teacher_profiles.user_id = auth.uid()
  )
);

-- Teachers can delete activities
CREATE POLICY "Teachers can delete activities" ON public.self_care_activities
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM teacher_profiles 
    WHERE teacher_profiles.user_id = auth.uid()
  )
);