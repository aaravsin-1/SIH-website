-- Allow teachers to delete their students' appointments
CREATE POLICY "Teachers can delete their students' appointments" 
ON appointments 
FOR DELETE 
USING (
  (auth.uid() = user_id) OR 
  (EXISTS (
    SELECT 1 
    FROM teacher_student_relationships tsr 
    WHERE tsr.teacher_id = auth.uid() 
    AND tsr.student_id = appointments.user_id 
    AND tsr.is_active = true
  ))
);