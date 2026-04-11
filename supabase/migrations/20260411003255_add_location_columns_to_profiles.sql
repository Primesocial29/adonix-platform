/*
  # Add Missing Location and Profile Columns to profiles table

  ## Problem
  The profiles table is missing all the columns that the application code expects:
  - role (trainer/client/member)
  - city (for client location)
  - service_areas (JSON array of {name, lat, lng})
  - service_areas_center_lat (numeric, primary lat for distance search)
  - service_areas_center_lng (numeric, primary lng for distance search)
  - service_types (array of offered services)
  - custom_service_types (array of custom services)
  - service_rates (JSONB rate map)
  - half_hour_enabled (boolean)
  - min_advance_notice (integer, hours)
  - cancellation_window (integer, hours)
  - certifications (text array)
  - photos (text array)
  - profile_complete (boolean)
  - fitness_goals (text)

  ## Changes
  - Adds all missing columns with appropriate defaults
  - Adds index on service_areas_center_lat/lng for geo queries
  - Adds index on role for partner lookup queries

  ## Security
  - No RLS changes (existing policies remain)
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
    ALTER TABLE profiles ADD COLUMN role text CHECK (role IN ('trainer', 'client', 'member')) DEFAULT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'city') THEN
    ALTER TABLE profiles ADD COLUMN city text DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'service_areas') THEN
    ALTER TABLE profiles ADD COLUMN service_areas jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'service_areas_center_lat') THEN
    ALTER TABLE profiles ADD COLUMN service_areas_center_lat numeric DEFAULT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'service_areas_center_lng') THEN
    ALTER TABLE profiles ADD COLUMN service_areas_center_lng numeric DEFAULT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'service_types') THEN
    ALTER TABLE profiles ADD COLUMN service_types text[] DEFAULT '{}';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'custom_service_types') THEN
    ALTER TABLE profiles ADD COLUMN custom_service_types text[] DEFAULT '{}';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'service_rates') THEN
    ALTER TABLE profiles ADD COLUMN service_rates jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'half_hour_enabled') THEN
    ALTER TABLE profiles ADD COLUMN half_hour_enabled boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'min_advance_notice') THEN
    ALTER TABLE profiles ADD COLUMN min_advance_notice integer DEFAULT 72;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'cancellation_window') THEN
    ALTER TABLE profiles ADD COLUMN cancellation_window integer DEFAULT 24;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'certifications') THEN
    ALTER TABLE profiles ADD COLUMN certifications text[] DEFAULT '{}';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'photos') THEN
    ALTER TABLE profiles ADD COLUMN photos text[] DEFAULT '{}';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'profile_complete') THEN
    ALTER TABLE profiles ADD COLUMN profile_complete boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'fitness_goals') THEN
    ALTER TABLE profiles ADD COLUMN fitness_goals text DEFAULT '';
  END IF;
END $$;

-- Indexes for location-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles(service_areas_center_lat, service_areas_center_lng) WHERE service_areas_center_lat IS NOT NULL;
