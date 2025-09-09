-- Add group visibility and management features

-- Add columns to peer_support_groups for management
ALTER TABLE public.peer_support_groups 
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Create table to track which groups students can see (assigned by their counselor)
CREATE TABLE IF NOT EXISTS public.student_group_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  group_id UUID NOT NULL REFERENCES public.peer_support_groups(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(student_id, group_id)
);

-- Enable RLS on the new table
ALTER TABLE public.student_group_permissions ENABLE ROW LEVEL SECURITY;

-- RLS policies for student_group_permissions
CREATE POLICY "Teachers can manage their students' group permissions"
ON public.student_group_permissions
FOR ALL
TO authenticated
USING (
  auth.uid() = teacher_id OR 
  auth.uid() = student_id
);

-- Update peer_support_groups policies for teacher management
DROP POLICY IF EXISTS "Groups are viewable by authenticated users" ON public.peer_support_groups;

-- Students can only see default groups or groups they have permission for
CREATE POLICY "Students can view allowed groups"
ON public.peer_support_groups
FOR SELECT
TO authenticated
USING (
  -- Always show default groups
  is_default = true 
  OR 
  -- Show groups the student has permission for
  EXISTS (
    SELECT 1 FROM public.student_group_permissions sgp
    WHERE sgp.group_id = id 
    AND sgp.student_id = auth.uid()
  )
  OR
  -- Show all groups to teachers/counselors
  EXISTS (
    SELECT 1 FROM public.teacher_profiles tp
    WHERE tp.user_id = auth.uid()
  )
);

-- Teachers can create, update, and delete groups
CREATE POLICY "Teachers can manage groups"
ON public.peer_support_groups
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.teacher_profiles tp
    WHERE tp.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.teacher_profiles tp
    WHERE tp.user_id = auth.uid()
  )
);

-- Mark existing groups as default
UPDATE public.peer_support_groups 
SET is_default = true, is_active = true 
WHERE is_default IS NULL;