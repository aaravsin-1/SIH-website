-- Create resources table for wellness resources
CREATE TABLE public.resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  category TEXT NOT NULL,
  url TEXT,
  is_external BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- Create policies for resources (public read access)
CREATE POLICY "Resources are viewable by everyone" 
ON public.resources 
FOR SELECT 
USING (true);

-- Create peer support groups table
CREATE TABLE public.peer_support_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  max_members INTEGER DEFAULT 20,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.peer_support_groups ENABLE ROW LEVEL SECURITY;

-- Create policies for peer support groups
CREATE POLICY "Groups are viewable by authenticated users" 
ON public.peer_support_groups 
FOR SELECT 
TO authenticated
USING (true);

-- Create group members table
CREATE TABLE public.group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.peer_support_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_moderator BOOLEAN DEFAULT false,
  UNIQUE(group_id, user_id)
);

-- Enable RLS
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Create policies for group members
CREATE POLICY "Users can view group members of their groups" 
ON public.group_members 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.group_members gm 
    WHERE gm.group_id = group_members.group_id 
    AND gm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can join groups" 
ON public.group_members 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave groups" 
ON public.group_members 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Create self-care activities table
CREATE TABLE public.self_care_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  duration_minutes INTEGER,
  instructions TEXT,
  difficulty_level TEXT DEFAULT 'easy',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.self_care_activities ENABLE ROW LEVEL SECURITY;

-- Create policies for activities (public read)
CREATE POLICY "Activities are viewable by authenticated users" 
ON public.self_care_activities 
FOR SELECT 
TO authenticated
USING (true);

-- Create user activity completions table
CREATE TABLE public.activity_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_id UUID NOT NULL REFERENCES public.self_care_activities(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  mood_before INTEGER,
  mood_after INTEGER,
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.activity_completions ENABLE ROW LEVEL SECURITY;

-- Create policies for activity completions
CREATE POLICY "Users can view their own completions" 
ON public.activity_completions 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own completions" 
ON public.activity_completions 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_resources_updated_at
BEFORE UPDATE ON public.resources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data
INSERT INTO public.resources (title, description, category, content, is_external) VALUES
('Deep Breathing Exercise', 'Simple breathing technique for anxiety relief', 'mindfulness', 'Breathe in for 4 counts, hold for 4, breathe out for 6. Repeat 5 times.', false),
('Campus Mental Health Services', 'Connect with professional counselors on campus', 'support', 'Visit the Student Services building or call 555-0123 for appointments.', false),
('Study Tips for Stress Management', 'Evidence-based strategies for academic success', 'academic', 'Break tasks into smaller chunks, use the Pomodoro technique, and take regular breaks.', false);

INSERT INTO public.peer_support_groups (name, description, category) VALUES
('First Year Support Circle', 'A supportive community for first-year students navigating college life', 'academic'),
('Anxiety and Stress Management', 'Share coping strategies and support each other through anxious moments', 'mental-health'),
('Study Buddies', 'Find study partners and create accountability for academic success', 'academic');

INSERT INTO public.self_care_activities (title, description, category, duration_minutes, instructions, difficulty_level) VALUES
('5-Minute Meditation', 'Quick mindfulness practice to center yourself', 'mindfulness', 5, 'Sit comfortably, close your eyes, and focus on your breath. When thoughts arise, gently return to your breath.', 'easy'),
('Progressive Muscle Relaxation', 'Tense and release muscle groups to reduce physical stress', 'relaxation', 15, 'Starting with your toes, tense each muscle group for 5 seconds then release. Work your way up to your head.', 'medium'),
('Gratitude Journaling', 'Write down three things you''re grateful for today', 'journaling', 10, 'Find a quiet space and write 3 specific things you''re grateful for, explaining why each matters to you.', 'easy'),
('Nature Walk', 'Take a mindful walk outdoors to refresh your mind', 'physical', 20, 'Walk slowly and notice your surroundings. Focus on what you see, hear, and feel.', 'easy');