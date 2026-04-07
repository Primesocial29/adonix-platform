/*
  # Add Partner Profile Fields

  1. Changes
    - Add `hourly_rate` (numeric) - partner's rate per hour
    - Add `is_partner` (boolean) - whether user offers fitness partner services
    - Add `specialties` (text[]) - array of fitness specialties
    - Add `availability` (jsonb) - partner availability schedule

  2. Notes
    - These fields allow users to become fitness partners and set rates
    - Default is_partner to false for regular users
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'hourly_rate'
  ) THEN
    ALTER TABLE profiles ADD COLUMN hourly_rate numeric(10, 2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_partner'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_partner boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'specialties'
  ) THEN
    ALTER TABLE profiles ADD COLUMN specialties text[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'availability'
  ) THEN
    ALTER TABLE profiles ADD COLUMN availability jsonb;
  END IF;
END $$;