-- Create notifications table for the existing notification system
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  priority text NOT NULL DEFAULT 'medium',
  read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on notifications table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can update their own notifications (for marking as read)
CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Function to create appointment confirmation notification
CREATE OR REPLACE FUNCTION public.notify_appointment_confirmed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only send notification if status changed to 'confirmed'
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    INSERT INTO public.notifications (user_id, type, title, message, priority)
    VALUES (
      NEW.user_id,
      'appointment',
      'Appointment Confirmed',
      'Your ' || NEW.appointment_type || ' appointment scheduled for ' || 
      to_char(NEW.scheduled_at, 'Mon DD, YYYY at HH12:MI AM') || 
      CASE 
        WHEN NEW.counselor_name IS NOT NULL THEN ' with ' || NEW.counselor_name 
        ELSE '' 
      END || ' has been confirmed.',
      'high'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for appointment confirmation notifications
CREATE TRIGGER appointment_confirmed_notification
  AFTER UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_appointment_confirmed();