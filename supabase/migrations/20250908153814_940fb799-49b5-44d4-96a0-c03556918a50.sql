-- Allow teachers to view and manage appointments for their assigned students
CREATE POLICY "Teachers can view their students' appointments" 
ON appointments 
FOR SELECT 
USING (
  auth.uid() = user_id OR  -- Users can see their own appointments
  EXISTS (
    SELECT 1 FROM teacher_student_relationships tsr 
    WHERE tsr.teacher_id = auth.uid() 
    AND tsr.student_id = appointments.user_id 
    AND tsr.is_active = true
  )
);

CREATE POLICY "Teachers can update their students' appointments" 
ON appointments 
FOR UPDATE 
USING (
  auth.uid() = user_id OR  -- Users can update their own appointments
  EXISTS (
    SELECT 1 FROM teacher_student_relationships tsr 
    WHERE tsr.teacher_id = auth.uid() 
    AND tsr.student_id = appointments.user_id 
    AND tsr.is_active = true
  )
);

-- Drop the old duplicate policies that might conflict
DROP POLICY IF EXISTS "Users can view their own appointments" ON appointments;
DROP POLICY IF EXISTS "Users can update their own appointments" ON appointments;