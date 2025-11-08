-- Add stripe_session_id column to payments table
ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS stripe_session_id VARCHAR(255);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_payments_stripe_session_id
ON public.payments(stripe_session_id);
