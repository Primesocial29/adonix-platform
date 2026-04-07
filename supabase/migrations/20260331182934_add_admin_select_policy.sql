/*
  # Add Admin Access Policy for Bookings

  1. Changes
    - Add a SELECT policy that allows anonymous users to view all bookings
    - This enables the admin dashboard to fetch and display all bookings
    - The existing authenticated user policy remains for logged-in users

  2. Security
    - Allows public read access to bookings table for admin dashboard
    - INSERT policy remains restrictive (anyone can create)
    - UPDATE policy remains restrictive (only booking participants)
*/

CREATE POLICY "Allow public read access for admin dashboard"
  ON bookings
  FOR SELECT
  TO anon
  USING (true);
