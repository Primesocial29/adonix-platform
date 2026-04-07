/*
  # Allow Guest Bookings

  1. Changes
    - Make `client_id` nullable to support guest bookings
    - Add `contact_email` column to store guest email addresses
    - Update RLS policies to work with null client_id

  2. Security
    - Update policies to allow guests to create bookings
    - Maintain security for viewing/updating bookings
*/

-- Add contact_email column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'contact_email'
  ) THEN
    ALTER TABLE bookings ADD COLUMN contact_email text;
  END IF;
END $$;

-- Make client_id nullable to allow guest bookings
ALTER TABLE bookings ALTER COLUMN client_id DROP NOT NULL;

-- Drop and recreate the policies to allow guest bookings

DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can create bookings as client" ON bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON bookings;

-- Allow authenticated users to view their bookings
CREATE POLICY "Users can view own bookings"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (
    client_id = auth.uid() OR 
    partner_id = auth.uid()
  );

-- Allow anyone (including guests) to create bookings
CREATE POLICY "Anyone can create bookings"
  ON bookings
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow users to update their own bookings
CREATE POLICY "Users can update own bookings"
  ON bookings
  FOR UPDATE
  TO authenticated
  USING (
    client_id = auth.uid() OR 
    partner_id = auth.uid()
  )
  WITH CHECK (
    client_id = auth.uid() OR 
    partner_id = auth.uid()
  );