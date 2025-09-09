-- Fix the RLS policy for peer support groups
-- The current policy has a bug where sgp.group_id = sgp.id instead of sgp.group_id = peer_support_groups.id

DROP POLICY IF EXISTS "Students can view allowed groups" ON public.peer_support_groups;

CREATE POLICY "Students can view allowed groups" 
ON public.peer_support_groups 
FOR SELECT 
USING (
  (is_default = true) 
  OR (EXISTS ( 
    SELECT 1
    FROM student_group_permissions sgp
    WHERE sgp.group_id = peer_support_groups.id 
    AND sgp.student_id = auth.uid()
  )) 
  OR (EXISTS ( 
    SELECT 1
    FROM teacher_profiles tp
    WHERE tp.user_id = auth.uid()
  ))
);

-- Ensure teachers can manage groups properly
DROP POLICY IF EXISTS "Teachers can manage groups" ON public.peer_support_groups;

CREATE POLICY "Teachers can manage groups" 
ON public.peer_support_groups 
FOR ALL 
USING (
  EXISTS ( 
    SELECT 1
    FROM teacher_profiles tp
    WHERE tp.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS ( 
    SELECT 1
    FROM teacher_profiles tp
    WHERE tp.user_id = auth.uid()
  )
);