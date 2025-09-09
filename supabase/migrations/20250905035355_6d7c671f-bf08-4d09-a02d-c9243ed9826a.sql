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

-- Add a teacher role table to distinguish teachers from students
CREATE TABLE public.teacher_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  employee_id TEXT,
  department TEXT,
  specialization TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on teacher_profiles
ALTER TABLE public.teacher_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for teacher profiles
CREATE POLICY "Teachers can view their own profile" 
ON public.teacher_profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Teachers can update their own profile" 
ON public.teacher_profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Teachers can insert their own profile" 
ON public.teacher_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);