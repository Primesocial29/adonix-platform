/*
  # Fix RLS Performance Issues

  1. Changes
    - Replace auth.uid() calls with (select auth.uid()) for optimal query performance
    - This prevents re-evaluation of auth functions for each row at scale
    
  2. Affected Policies
    - Users can insert own profile
    - Users can update own profile
*/

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = (select auth.uid()));

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));