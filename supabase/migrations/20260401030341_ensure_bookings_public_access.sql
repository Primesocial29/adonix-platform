/*
  # Ensure public access to bookings table for testing

  1. Security Changes
    - Drop existing restrictive policies
    - Add public read/write policies for testing phase
    - Admin dashboard needs full access to all bookings

  2. Important Notes
    - This is for TESTING PHASE ONLY
    - Public can view all bookings
    - Public can insert/update bookings
    - In production, restrict to authenticated users only
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can create own bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON bookings;

-- Add public policies for testing
CREATE POLICY "Public can view all bookings"
  ON bookings
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can insert bookings"
  ON bookings
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update bookings"
  ON bookings
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete bookings"
  ON bookings
  FOR DELETE
  TO public
  USING (true);