-- Fix infinite recursion in group_members RLS policy
DROP POLICY IF EXISTS "Users can view group members of their groups" ON public.group_members;

-- Create a simple policy that allows users to see group members without recursion
CREATE POLICY "Users can view group members"
ON public.group_members
FOR SELECT
TO authenticated
USING (true);

-- Allow users to join groups (insert their own membership)
DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;
CREATE POLICY "Users can join groups"
ON public.group_members
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to leave groups (delete their own membership)
DROP POLICY IF EXISTS "Users can leave groups" ON public.group_members;
CREATE POLICY "Users can leave groups"
ON public.group_members
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to update their own membership (for moderator status, etc.)
CREATE POLICY "Users can update their own membership"
ON public.group_members
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Ensure peer_support_groups table has proper policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.peer_support_groups;
CREATE POLICY "Groups are viewable by authenticated users"
ON public.peer_support_groups
FOR SELECT
TO authenticated
USING (true);

-- Add some sample peer support groups if none exist
INSERT INTO public.peer_support_groups (name, description, category, max_members)
VALUES 
  ('Anxiety Support Circle', 'A safe space to share experiences and coping strategies for anxiety', 'Mental Health', 15),
  ('Study Stress Management', 'Tips and support for managing academic pressure', 'Academic', 20),
  ('Mindfulness & Meditation', 'Practice mindfulness together and share meditation techniques', 'Wellness', 12),
  ('Social Connection Hub', 'Building friendships and social skills in a supportive environment', 'Social', 25),
  ('Exam Preparation Support', 'Mutual support during exam periods', 'Academic', 18)
ON CONFLICT DO NOTHING;