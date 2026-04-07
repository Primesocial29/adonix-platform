/*
  # Create Bookings Table

  1. New Tables
    - `bookings`
      - `id` (uuid, primary key)
      - `client_id` (uuid, references profiles) - user booking the session
      - `partner_id` (uuid, references profiles) - fitness partner being booked
      - `session_date` (timestamptz) - scheduled session date/time
      - `session_duration` (integer) - duration in minutes
      - `location_name` (text) - gym/park name
      - `location_lat` (numeric) - latitude for check-in verification
      - `location_lng` (numeric) - longitude for check-in verification
      - `partner_rate` (numeric) - partner's hourly rate
      - `partner_payout` (numeric) - 85% of rate
      - `platform_fee` (numeric) - 15% fee
      - `intent_fee` (numeric) - $1.00 non-refundable
      - `total_amount` (numeric) - total charged
      - `status` (text) - pending, confirmed, checked_in, completed, cancelled
      - `client_checked_in` (boolean)
      - `partner_checked_in` (boolean)
      - `client_checkin_time` (timestamptz)
      - `partner_checkin_time` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `bookings` table
    - Users can view bookings where they are client or partner
    - Users can create bookings as client
    - Users can update bookings where they are client or partner (for check-ins)
*/

CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_date timestamptz NOT NULL,
  session_duration integer NOT NULL DEFAULT 60,
  location_name text NOT NULL,
  location_lat numeric(10, 7) NOT NULL,
  location_lng numeric(10, 7) NOT NULL,
  partner_rate numeric(10, 2) NOT NULL,
  partner_payout numeric(10, 2) NOT NULL,
  platform_fee numeric(10, 2) NOT NULL,
  intent_fee numeric(10, 2) NOT NULL DEFAULT 1.00,
  total_amount numeric(10, 2) NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  client_checked_in boolean DEFAULT false,
  partner_checked_in boolean DEFAULT false,
  client_checkin_time timestamptz,
  partner_checkin_time timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookings"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (
    client_id = (select auth.uid()) OR 
    partner_id = (select auth.uid())
  );

CREATE POLICY "Users can create bookings as client"
  ON bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (client_id = (select auth.uid()));

CREATE POLICY "Users can update own bookings"
  ON bookings
  FOR UPDATE
  TO authenticated
  USING (
    client_id = (select auth.uid()) OR 
    partner_id = (select auth.uid())
  )
  WITH CHECK (
    client_id = (select auth.uid()) OR 
    partner_id = (select auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_partner_id ON bookings(partner_id);
CREATE INDEX IF NOT EXISTS idx_bookings_session_date ON bookings(session_date);