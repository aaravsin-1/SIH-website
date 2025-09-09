-- Allow teachers to insert appointments for their students
CREATE POLICY "Teachers can insert appointments for their students" 
ON public.appointments 
FOR INSERT 
WITH CHECK (
  (auth.uid() = user_id) OR 
  (EXISTS (
    SELECT 1
    FROM teacher_student_relationships tsr
    WHERE tsr.teacher_id = auth.uid() 
    AND tsr.student_id = appointments.user_id 
    AND tsr.is_active = true
  ))
);