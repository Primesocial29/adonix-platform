/*
  # Partner Photos Gallery Setup

  1. New Columns on profiles
     - `profile_photos` (text[]) — array of up to 6 photo URLs for the partner gallery

  2. Storage
     - Creates `partner-photos` bucket (public) for gallery images

  3. Storage Policies
     - Partners can upload/update/delete their own photos
     - Anyone can read (public bucket)

  4. Notes
     - The primary profile photo is still stored in `live_photo_url`
     - Setting a gallery photo as primary updates `live_photo_url`
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'profile_photos'
  ) THEN
    ALTER TABLE profiles ADD COLUMN profile_photos text[] DEFAULT '{}';
  END IF;
END $$;

INSERT INTO storage.buckets (id, name, public)
VALUES ('partner-photos', 'partner-photos', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects' AND policyname = 'Partners can upload their own gallery photos'
  ) THEN
    CREATE POLICY "Partners can upload their own gallery photos"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'partner-photos' AND
        (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects' AND policyname = 'Partners can update their own gallery photos'
  ) THEN
    CREATE POLICY "Partners can update their own gallery photos"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'partner-photos' AND
        (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects' AND policyname = 'Partners can delete their own gallery photos'
  ) THEN
    CREATE POLICY "Partners can delete their own gallery photos"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'partner-photos' AND
        (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects' AND policyname = 'Anyone can view gallery photos'
  ) THEN
    CREATE POLICY "Anyone can view gallery photos"
      ON storage.objects FOR SELECT
      TO public
      USING (bucket_id = 'partner-photos');
  END IF;
END $$;
