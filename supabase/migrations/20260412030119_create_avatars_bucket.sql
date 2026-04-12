/*
  # Create avatars storage bucket

  ## Summary
  Creates a public 'avatars' bucket for storing partner profile photos.
  RLS policies allow authenticated users to upload/update their own avatar
  and allow public read access.

  ## Changes
  - New storage bucket: `avatars` (public)
  - Storage policies:
    - Authenticated users can upload to their own folder
    - Authenticated users can update their own files
    - Public read access for all avatar files
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Authenticated users can update own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Public read access for avatars"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'avatars');
