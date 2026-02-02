-- Enable realtime for candidates table to get notifications when new candidates are added
ALTER PUBLICATION supabase_realtime ADD TABLE public.candidates;