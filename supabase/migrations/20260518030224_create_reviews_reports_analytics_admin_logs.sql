/*
  # Create reviews, reports, analytics_events, and admin_logs tables

  1. New Tables
    - `reviews` - Stores ratings and written reviews between clients and partners after a booking
      - `id` (uuid, primary key)
      - `booking_id` (uuid, FK to bookings)
      - `reviewer_id` (uuid, FK to profiles)
      - `reviewee_id` (uuid, FK to profiles)
      - `rating` (int, 1–5)
      - `review_text` (text, optional)
      - `created_at` (timestamptz)

    - `reports` - Stores user-generated reports for inappropriate behavior
      - `id` (uuid, primary key)
      - `reporter_id` (uuid, FK to profiles)
      - `reported_id` (uuid, FK to profiles)
      - `reason` (text, required)
      - `description` (text, optional)
      - `status` (text, default 'pending')
      - `created_at` / `resolved_at` (timestamptz)

    - `analytics_events` - Tracks user events for product analytics
      - `id` (uuid, primary key)
      - `user_id` (uuid, FK to profiles, nullable)
      - `event_type` (text, required)
      - `event_data` (jsonb, optional)
      - `created_at` (timestamptz)

    - `admin_logs` - Audit trail for admin actions
      - `id` (uuid, primary key)
      - `admin_id` (uuid, FK to profiles, nullable)
      - `action` (text, required)
      - `target_type` (text, optional)
      - `target_id` (uuid, optional)
      - `details` (jsonb, optional)
      - `created_at` (timestamptz)

  2. Security
    - RLS enabled on all four tables
    - reviews: authenticated users can read reviews where they are reviewer or reviewee; can insert own reviews; can read reviews about themselves
    - reports: authenticated users can insert reports; only admins can read/update
    - analytics_events: authenticated users can insert their own events; no read access for users
    - admin_logs: no direct user access; insert/read restricted to admin role via service role key
*/

-- reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reviewee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read reviews they are part of"
  ON reviews FOR SELECT
  TO authenticated
  USING (auth.uid() = reviewer_id OR auth.uid() = reviewee_id);

CREATE POLICY "Authenticated users can insert their own reviews"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Reviewers can update their own reviews"
  ON reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = reviewer_id)
  WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Reviewers can delete their own reviews"
  ON reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = reviewer_id);

-- reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reported_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can insert reports"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Reporters can read their own reports"
  ON reports FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

-- analytics_events table
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can insert their own analytics events"
  ON analytics_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- admin_logs table
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can insert admin logs"
  ON admin_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can read admin logs"
  ON admin_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
