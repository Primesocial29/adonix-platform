/*
  # Booking Audit Log & Profile/Booking Extensions

  1. New Tables
     - `booking_audit_log` — tracks all booking lifecycle actions (accept, decline, cancel, change requests)
       - `id` (uuid, pk)
       - `booking_id` (uuid, fk → bookings)
       - `action` (varchar 50) — e.g. 'accepted', 'declined', 'cancelled', 'change_requested'
       - `initiated_by` (uuid, fk → profiles)
       - `reason` (varchar 255)
       - `message` (text)
       - `old_details` (jsonb) — snapshot before change
       - `new_details` (jsonb) — snapshot after change
       - `client_response` (varchar 50) — 'accepted', 'declined', null (no response)
       - `responded_at` (timestamptz)
       - `created_at` (timestamptz)

  2. Modified Tables — profiles
     - `restricted_until` (timestamptz) — client booking restriction end date
     - `restriction_reason` (text) — why client is restricted
     - `cancellation_count` (int) — lifetime cancel count
     - `monthly_cancellations` (int) — cancels this calendar month
     - `cancellation_rate` (float) — % of booked sessions cancelled
     - `username` (text) — partner/client display username
     - `profile_photos` (text[]) — gallery photos array (if not already added)

  3. Modified Tables — bookings
     - `change_request_details` (jsonb) — proposed new date/time/location/activity
     - `change_request_expires_at` (timestamptz) — 2-hour response window
     - `change_request_status` (varchar 20) — 'pending', 'accepted', 'declined', 'expired'
     - `decline_reason` (text)
     - `declined_at` (timestamptz)
     - `amount` (numeric) — suggested contribution amount
     - `activity_type` (text)
     - `location_name` (text)

  4. Security
     - RLS enabled on booking_audit_log
     - Partners and clients can read their own audit entries
     - System can insert audit entries
*/

-- booking_audit_log table
CREATE TABLE IF NOT EXISTS booking_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  initiated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reason VARCHAR(255),
  message TEXT,
  old_details JSONB,
  new_details JSONB,
  client_response VARCHAR(50),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE booking_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners and clients can read own audit entries"
  ON booking_audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = booking_audit_log.booking_id
        AND (b.partner_id = auth.uid() OR b.client_id = auth.uid())
    )
  );

CREATE POLICY "Authenticated users can insert audit entries"
  ON booking_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (initiated_by = auth.uid());

-- profiles extensions
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='restricted_until') THEN
    ALTER TABLE profiles ADD COLUMN restricted_until TIMESTAMPTZ;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='restriction_reason') THEN
    ALTER TABLE profiles ADD COLUMN restriction_reason TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='cancellation_count') THEN
    ALTER TABLE profiles ADD COLUMN cancellation_count INT DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='monthly_cancellations') THEN
    ALTER TABLE profiles ADD COLUMN monthly_cancellations INT DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='cancellation_rate') THEN
    ALTER TABLE profiles ADD COLUMN cancellation_rate FLOAT DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='username') THEN
    ALTER TABLE profiles ADD COLUMN username TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='profile_photos') THEN
    ALTER TABLE profiles ADD COLUMN profile_photos TEXT[] DEFAULT '{}';
  END IF;
END $$;

-- bookings extensions
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='change_request_details') THEN
    ALTER TABLE bookings ADD COLUMN change_request_details JSONB;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='change_request_expires_at') THEN
    ALTER TABLE bookings ADD COLUMN change_request_expires_at TIMESTAMPTZ;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='change_request_status') THEN
    ALTER TABLE bookings ADD COLUMN change_request_status VARCHAR(20);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='decline_reason') THEN
    ALTER TABLE bookings ADD COLUMN decline_reason TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='declined_at') THEN
    ALTER TABLE bookings ADD COLUMN declined_at TIMESTAMPTZ;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='amount') THEN
    ALTER TABLE bookings ADD COLUMN amount NUMERIC(10,2) DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='activity_type') THEN
    ALTER TABLE bookings ADD COLUMN activity_type TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='location_name') THEN
    ALTER TABLE bookings ADD COLUMN location_name TEXT;
  END IF;
END $$;

-- Index for fast audit log queries
CREATE INDEX IF NOT EXISTS idx_booking_audit_log_booking_id ON booking_audit_log(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_audit_log_initiated_by ON booking_audit_log(initiated_by);
