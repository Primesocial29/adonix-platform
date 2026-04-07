/*
  # Hot Buddies - Initial Schema

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `display_name` (text)
      - `age` (integer)
      - `gender` (text)
      - `fitness_level` (text)
      - `bio` (text)
      - `photo_url` (text) - live camera photo
      - `age_verified` (boolean) - 18+ verification status
      - `onboarding_completed` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `profiles` table
    - Users can read all profiles (for marketplace browsing)
    - Users can only update their own profile
    - Users can only insert their own profile
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  age integer,
  gender text,
  fitness_level text,
  bio text,
  photo_url text,
  age_verified boolean DEFAULT false,
  onboarding_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);