/*
  # Create partner_profiles table

  1. New Tables
    - `partner_profiles`
      - `id` (uuid, primary key, references auth.users)
      - `name` (text, required)
      - `email` (text, required, unique)
      - `bio` (text)
      - `hourly_rate` (numeric, required)
      - `is_verified` (boolean, default false)
      - `live_photo_url` (text)
      - `video_intro_url` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `partner_profiles` table
    - Add public read policy for testing phase
    - Add policy for partners to update their own profiles
*/

CREATE TABLE IF NOT EXISTS partner_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  bio text,
  hourly_rate numeric NOT NULL CHECK (hourly_rate >= 0),
  is_verified boolean DEFAULT false,
  live_photo_url text,
  video_intro_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE partner_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view partner profiles"
  ON partner_profiles
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Partners can update own profile"
  ON partner_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Partners can insert own profile"
  ON partner_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);