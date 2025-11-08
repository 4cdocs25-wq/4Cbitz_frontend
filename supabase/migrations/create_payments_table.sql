-- ============================================================================
-- PAYMENTS TABLE SETUP FOR 4CSECURE STRIPE INTEGRATION
-- ============================================================================
-- This script creates the payments table to track Stripe payment records
-- Run this in Supabase SQL Editor: Dashboard > SQL Editor > New Query
-- ============================================================================

-- Drop existing table if you need to recreate (CAREFUL: deletes data!)
-- DROP TABLE IF EXISTS public.payments CASCADE;

-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_status VARCHAR(50) NOT NULL DEFAULT 'pending',
  stripe_payment_intent_id VARCHAR(255),
  amount BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure one payment record per user (allows upsert in webhook)
  CONSTRAINT unique_user_payment UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_id ON public.payments(stripe_payment_intent_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on payments table
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow service role full access (for webhook to write payments)
CREATE POLICY "Service role has full access to payments"
  ON public.payments
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy 2: Allow authenticated users to read their own payment records
CREATE POLICY "Users can read their own payments"
  ON public.payments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy 3: Prevent regular users from writing/updating payments
-- (Only webhook via service role should write)
CREATE POLICY "Users cannot modify payments"
  ON public.payments
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

CREATE POLICY "Users cannot update payments"
  ON public.payments
  FOR UPDATE
  TO authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Users cannot delete payments"
  ON public.payments
  FOR DELETE
  TO authenticated
  USING (false);

-- ============================================================================
-- FUNCTION: Auto-update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VERIFICATION QUERIES (optional - run these to verify setup)
-- ============================================================================

-- Check if table was created successfully
-- SELECT * FROM information_schema.tables WHERE table_name = 'payments';

-- Check if RLS is enabled
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'payments';

-- View all policies on payments table
-- SELECT * FROM pg_policies WHERE tablename = 'payments';

-- ============================================================================
-- SAMPLE DATA FOR TESTING (optional - uncomment to insert test payment)
-- ============================================================================

-- Insert a test payment record (replace <USER_ID> with actual user ID from auth.users)
-- INSERT INTO public.payments (user_id, payment_status, stripe_payment_intent_id, amount)
-- VALUES
--   ('<USER_ID>', 'completed', 'pi_test_123456', 2999);

-- ============================================================================
-- CLEANUP COMMANDS (if needed)
-- ============================================================================

-- To remove all policies:
-- DROP POLICY IF EXISTS "Service role has full access to payments" ON public.payments;
-- DROP POLICY IF EXISTS "Users can read their own payments" ON public.payments;
-- DROP POLICY IF EXISTS "Users cannot modify payments" ON public.payments;
-- DROP POLICY IF EXISTS "Users cannot update payments" ON public.payments;
-- DROP POLICY IF EXISTS "Users cannot delete payments" ON public.payments;

-- To drop the table completely:
-- DROP TABLE IF EXISTS public.payments CASCADE;

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================
