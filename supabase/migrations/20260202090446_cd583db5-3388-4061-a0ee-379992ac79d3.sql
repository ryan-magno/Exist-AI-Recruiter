-- Create offer status enum
DO $$ BEGIN
  CREATE TYPE offer_status AS ENUM ('pending', 'accepted', 'rejected', 'negotiating', 'unresponsive');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Create offers table to store offer form data
CREATE TABLE IF NOT EXISTS public.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL UNIQUE REFERENCES public.candidate_job_applications(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  offer_date DATE,
  expiry_date DATE,
  offer_amount TEXT,
  position TEXT,
  start_date DATE,
  status offer_status DEFAULT 'pending',
  benefits TEXT,
  remarks TEXT,
  negotiation_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on offers table
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- Create policies for offers
CREATE POLICY "Offers viewable by authenticated" ON public.offers FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage offers" ON public.offers FOR ALL USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_offers_updated_at
  BEFORE UPDATE ON public.offers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();