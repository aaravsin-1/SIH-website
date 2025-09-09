-- Enable RLS on stud_in table that was missing it
ALTER TABLE public.stud_in ENABLE ROW LEVEL SECURITY;

-- Create basic policies for stud_in table (making it read-only for now)
CREATE POLICY "stud_in is viewable by everyone" 
ON public.stud_in 
FOR SELECT 
USING (true);

-- Restrict modifications to authenticated users only
CREATE POLICY "Only authenticated users can insert to stud_in" 
ON public.stud_in 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Only authenticated users can update stud_in" 
ON public.stud_in 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Only authenticated users can delete from stud_in" 
ON public.stud_in 
FOR DELETE 
TO authenticated
USING (true);