/*
  # Add travel_radius column to profiles

  ## Changes
  - New Columns
    - `travel_radius` (integer): Partner's travel/search radius in miles (1–25). Defaults to 5.

  ## Notes
  - Safe additive migration using IF NOT EXISTS check
  - No data loss, no destructive operations
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'travel_radius'
  ) THEN
    ALTER TABLE profiles ADD COLUMN travel_radius integer DEFAULT 5;
  END IF;
END $$;
