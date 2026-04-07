/*
  # Update bookings table with admin fields

  1. Changes
    - Add `admin_notes` (text) - For internal admin notes about the booking
    - Add `cancelled_at` (timestamptz) - Timestamp when booking was cancelled
    - Add `cancellation_reason` (text) - Reason for cancellation
    - Add `additional_pets` (integer) - Number of additional pets (for Two-Dog Logic)
    - Add `additional_pet_fee` (numeric) - Fee for additional pets

  2. Two-Dog Logic
    - Supports charging extra for multi-pet sessions
    - `additional_pets` defaults to 0
    - `additional_pet_fee` tracks the extra charge

  3. Notes
    - Admin fields allow better booking management
    - Cancellation tracking for analytics and customer service
    - All new fields are nullable for backward compatibility
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'admin_notes'
  ) THEN
    ALTER TABLE bookings ADD COLUMN admin_notes text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'cancelled_at'
  ) THEN
    ALTER TABLE bookings ADD COLUMN cancelled_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'cancellation_reason'
  ) THEN
    ALTER TABLE bookings ADD COLUMN cancellation_reason text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'additional_pets'
  ) THEN
    ALTER TABLE bookings ADD COLUMN additional_pets integer DEFAULT 0 CHECK (additional_pets >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'additional_pet_fee'
  ) THEN
    ALTER TABLE bookings ADD COLUMN additional_pet_fee numeric DEFAULT 0 CHECK (additional_pet_fee >= 0);
  END IF;
END $$;

-- Add index for cancelled bookings for admin dashboard
CREATE INDEX IF NOT EXISTS idx_bookings_cancelled ON bookings(cancelled_at) WHERE cancelled_at IS NOT NULL;