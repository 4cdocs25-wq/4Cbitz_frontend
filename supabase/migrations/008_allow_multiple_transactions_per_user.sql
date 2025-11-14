-- Migration: Allow multiple transactions per user
-- Purpose: Remove unique constraint to track all payment attempts (pending, completed, failed, expired)
-- Date: 2025-11-14

-- Remove unique constraint that limited to one payment per user
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS unique_user_payment;

-- Add index for efficient user transaction queries (ordered by most recent first)
CREATE INDEX IF NOT EXISTS idx_payments_user_created ON public.payments(user_id, created_at DESC);

-- Add comment for documentation
COMMENT ON TABLE public.payments IS 'Stores all payment transaction attempts including pending, completed, failed, and expired';
