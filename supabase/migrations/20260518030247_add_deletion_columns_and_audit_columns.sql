/*
  # Add soft-delete columns to profiles and audit columns to bookings

  1. Modified Tables
    - `profiles`
      - Add `deleted_at` (timestamptz, nullable) — timestamp when user was soft-deleted
      - Add `deletion_requested_at` (timestamptz, nullable) — timestamp when user requested deletion
    - `bookings`
      - Add `created_by` (uuid, FK to profiles, nullable) — who created the booking
      - Add `updated_by` (uuid, FK to profiles, nullable) — who last updated the booking

  2. Security
    - Add UPDATE policy on profiles so authenticated users can update their own soft-delete fields
    - Existing RLS on bookings is preserved; new columns inherit existing policies
*/

-- profiles: soft-delete columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN deleted_at TIMESTAMPTZ;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'deletion_requested_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN deletion_requested_at TIMESTAMPTZ;
  END IF;
END $$;

-- bookings: audit columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE bookings ADD COLUMN created_by UUID REFERENCES profiles(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'updated_by'
  ) THEN
    ALTER TABLE bookings ADD COLUMN updated_by UUID REFERENCES profiles(id);
  END IF;
END $$;

-- Allow authenticated users to update their own profile deletion fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND policyname = 'Users can request deletion of own profile'
  ) THEN
    CREATE POLICY "Users can request deletion of own profile"
      ON profiles FOR UPDATE
      TO authenticated
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;
