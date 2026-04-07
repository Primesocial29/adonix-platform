/*
  # Fix Storage RLS Performance Issues

  1. Changes
    - Replace auth.uid() calls with (select auth.uid()) for optimal query performance
    - This prevents re-evaluation of auth functions for each row at scale
    
  2. Affected Policies
    - Users can upload own photos
    - Users can delete own photos
*/

DROP POLICY IF EXISTS "Users can upload own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own photos" ON storage.objects;

CREATE POLICY "Users can upload own photos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile-photos' AND
    (storage.foldername(name))[1] = (select auth.uid()::text)
  );

CREATE POLICY "Users can delete own photos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'profile-photos' AND
    (storage.foldername(name))[1] = (select auth.uid()::text)
  );