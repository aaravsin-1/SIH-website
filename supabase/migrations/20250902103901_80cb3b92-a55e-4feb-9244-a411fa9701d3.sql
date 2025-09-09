-- Create a flexible student_info table that can be easily extended
CREATE TABLE public.student_info (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id TEXT UNIQUE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  year_level TEXT,
  major TEXT,
  campus TEXT,
  preferred_pronouns TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- JSON field for flexible additional data
  additional_info JSONB DEFAULT '{}'::jsonb
);

-- Enable Row Level Security
ALTER TABLE public.student_info ENABLE ROW LEVEL SECURITY;

-- Create policies for student data access
CREATE POLICY "Students can view their own info" 
ON public.student_info 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Students can insert their own info" 
ON public.student_info 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Students can update their own info" 
ON public.student_info 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_student_info_updated_at
  BEFORE UPDATE ON public.student_info
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create wellness_sessions table for tracking student wellness activities
CREATE TABLE public.wellness_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL, -- 'ai_chat', 'counselor', 'peer_support', 'self_care'
  duration_minutes INTEGER,
  mood_before INTEGER CHECK (mood_before >= 1 AND mood_before <= 10),
  mood_after INTEGER CHECK (mood_after >= 1 AND mood_after <= 10),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on wellness_sessions
ALTER TABLE public.wellness_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for wellness sessions
CREATE POLICY "Users can view their own sessions" 
ON public.wellness_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions" 
ON public.wellness_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" 
ON public.wellness_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create appointments table
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  appointment_type TEXT NOT NULL, -- 'counseling', 'academic_advisor', 'peer_mentor'
  counselor_name TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled', 'no_show'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on appointments
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Create policies for appointments
CREATE POLICY "Users can view their own appointments" 
ON public.appointments 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own appointments" 
ON public.appointments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own appointments" 
ON public.appointments 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add update trigger for appointments
CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();