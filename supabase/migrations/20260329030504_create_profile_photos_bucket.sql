/*
  # Create Profile Photos Storage Bucket

  1. Storage
    - Create `profile-photos` bucket for user profile images
    - Enable public access for profile photos
    - Set up RLS policies for upload/delete

  2. Security
    - Users can only upload their own photos
    - Users can only delete their own photos
    - Everyone can view photos (public bucket)
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own photos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own photos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'profile-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Anyone can view photos"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'profile-photos');