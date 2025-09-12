-- Add RLS policy to allow group members to see each other's profiles
CREATE POLICY "Group members can view each other's profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM group_members gm1 
    JOIN group_members gm2 ON gm1.group_id = gm2.group_id
    WHERE gm1.user_id = auth.uid() 
    AND gm2.user_id = profiles.user_id
  )
);

-- Add RLS policy to allow group members to see each other's student info (names, basic info)
CREATE POLICY "Group members can view each other's student info" 
ON public.student_info 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM group_members gm1 
    JOIN group_members gm2 ON gm1.group_id = gm2.group_id
    WHERE gm1.user_id = auth.uid() 
    AND gm2.user_id = student_info.user_id
  )
);