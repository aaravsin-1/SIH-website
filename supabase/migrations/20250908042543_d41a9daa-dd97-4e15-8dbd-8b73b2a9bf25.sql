-- Enable RLS on tables that are missing it
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dep_classifier ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stud_in ENABLE ROW LEVEL SECURITY;

-- Fix function search paths for security
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name, phone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name', 
    NEW.raw_user_meta_data ->> 'phone'
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_teacher_student_relationships_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.enforce_message_limit()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $function$
begin
  delete from messages
  where phone_number = new.phone_number
  and id not in (
    select id from messages
    where phone_number = new.phone_number
    order by id desc
    limit 50
  );
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;