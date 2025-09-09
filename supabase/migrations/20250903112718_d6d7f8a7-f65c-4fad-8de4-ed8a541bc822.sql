-- Enable RLS on the stud_info table that was missing it
ALTER TABLE public.stud_info ENABLE ROW LEVEL SECURITY;

-- Create basic policy for stud_info (assuming it should be user-specific)
-- Since this table doesn't have a user_id column, we'll make it publicly readable for now
-- but restrict modifications
CREATE POLICY "Allow public read access to stud_info" 
ON public.stud_info 
FOR SELECT 
USING (true);

CREATE POLICY "Only authenticated users can insert stud_info" 
ON public.stud_info 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can update stud_info" 
ON public.stud_info 
FOR UPDATE 
USING (auth.role() = 'authenticated');