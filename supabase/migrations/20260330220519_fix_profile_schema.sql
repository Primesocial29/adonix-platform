/*
  # Fix Profile Schema to Match Application

  1. Changes
    - Add `first_name` column (text)
    - Add `live_photo_url` column (text) for profile photos
    - Migrate existing `display_name` data to `first_name`
    - Keep `display_name` for backward compatibility
  
  2. Notes
    - Uses IF NOT EXISTS to prevent errors on re-run
    - Preserves existing data during migration
*/

-- Add first_name column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'first_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN first_name text;
  END IF;
END $$;

-- Add live_photo_url column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'live_photo_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN live_photo_url text;
  END IF;
END $$;

-- Migrate existing display_name to first_name
UPDATE profiles 
SET first_name = display_name 
WHERE first_name IS NULL AND display_name IS NOT NULL;

-- Migrate existing photo_url to live_photo_url
UPDATE profiles 
SET live_photo_url = photo_url 
WHERE live_photo_url IS NULL AND photo_url IS NOT NULL;
