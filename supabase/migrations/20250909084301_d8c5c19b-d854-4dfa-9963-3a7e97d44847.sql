-- Add RLS policies to allow teachers to manage their students' information
CREATE POLICY "Teachers can view their students' info" 
ON public.student_info 
FOR SELECT 
USING (
  (auth.uid() = user_id) OR 
  (EXISTS (
    SELECT 1 
    FROM teacher_student_relationships tsr 
    WHERE tsr.teacher_id = auth.uid() 
    AND tsr.student_id = student_info.user_id 
    AND tsr.is_active = true
  ))
);

CREATE POLICY "Teachers can update their students' info" 
ON public.student_info 
FOR UPDATE 
USING (
  (auth.uid() = user_id) OR 
  (EXISTS (
    SELECT 1 
    FROM teacher_student_relationships tsr 
    WHERE tsr.teacher_id = auth.uid() 
    AND tsr.student_id = student_info.user_id 
    AND tsr.is_active = true
  ))
);

-- Drop the existing restrictive policies first
DROP POLICY IF EXISTS "Students can view their own info" ON public.student_info;
DROP POLICY IF EXISTS "Students can update their own info" ON public.student_info;