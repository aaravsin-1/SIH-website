-- Create teacher-student relationship table
CREATE TABLE public.teacher_student_relationships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_phone TEXT NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(teacher_id, student_id)
);

-- Enable RLS on the teacher_student_relationships table
ALTER TABLE public.teacher_student_relationships ENABLE ROW LEVEL SECURITY;

-- Create policies for teacher-student relationships
CREATE POLICY "Teachers can view their assigned students" 
ON public.teacher_student_relationships 
FOR SELECT 
USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can assign students" 
ON public.teacher_student_relationships 
FOR INSERT 
WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update their student relationships" 
ON public.teacher_student_relationships 
FOR UPDATE 
USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete their student relationships" 
ON public.teacher_student_relationships 
FOR DELETE 
USING (auth.uid() = teacher_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_teacher_student_relationships_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_teacher_student_relationships_updated_at
BEFORE UPDATE ON public.teacher_student_relationships
FOR EACH ROW
EXECUTE FUNCTION public.update_teacher_student_relationships_updated_at();

-- Create a view for teachers to see their students' wellness data
CREATE VIEW public.teacher_student_wellness_view AS
SELECT 
  tsr.teacher_id,
  tsr.student_id,
  tsr.student_phone,
  tsr.assigned_at,
  tsr.notes as teacher_notes,
  si.first_name,
  si.last_name,
  si.email,
  si.college_name,
  si.course,
  si.year_of_study,
  si.guardian_name,
  si.guardian_phone,
  -- Latest mood entry
  (SELECT mood_value FROM mood_entries me WHERE me.user_id = tsr.student_id ORDER BY me.created_at DESC LIMIT 1) as latest_mood,
  (SELECT created_at FROM mood_entries me WHERE me.user_id = tsr.student_id ORDER BY me.created_at DESC LIMIT 1) as latest_mood_date,
  -- Count of recent mood entries (last 7 days)
  (SELECT COUNT(*) FROM mood_entries me WHERE me.user_id = tsr.student_id AND me.created_at >= NOW() - INTERVAL '7 days') as weekly_mood_entries,
  -- Average mood last 7 days
  (SELECT AVG(mood_value) FROM mood_entries me WHERE me.user_id = tsr.student_id AND me.created_at >= NOW() - INTERVAL '7 days') as avg_weekly_mood,
  -- Recent appointments
  (SELECT COUNT(*) FROM appointments a WHERE a.user_id = tsr.student_id AND a.scheduled_at >= NOW() - INTERVAL '30 days') as recent_appointments
FROM public.teacher_student_relationships tsr
LEFT JOIN public.student_info si ON si.user_id = tsr.student_id
WHERE tsr.is_active = true;

-- Enable RLS on the view (teachers can only see their students)
ALTER VIEW public.teacher_student_wellness_view OWNER TO postgres;
GRANT SELECT ON public.teacher_student_wellness_view TO authenticated;

-- Create RLS policy for the view
CREATE POLICY "Teachers can view their students wellness data" 
ON public.teacher_student_wellness_view 
FOR SELECT 
USING (auth.uid() = teacher_id);