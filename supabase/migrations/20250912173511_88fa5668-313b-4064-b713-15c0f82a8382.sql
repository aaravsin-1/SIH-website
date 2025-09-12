-- Enable realtime for group_messages table
ALTER TABLE public.group_messages REPLICA IDENTITY FULL;

-- Add the table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;