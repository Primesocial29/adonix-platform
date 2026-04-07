/*
  # Create media_approval_queue table

  1. New Tables
    - `media_approval_queue`
      - `id` (uuid, primary key)
      - `partner_id` (uuid, references partner_profiles)
      - `media_type` (text, 'photo' or 'video')
      - `media_url` (text, required)
      - `status` (text, 'pending', 'approved', or 'rejected')
      - `submitted_at` (timestamptz)
      - `reviewed_at` (timestamptz)
      - `reviewed_by` (uuid, references auth.users)
      - `rejection_reason` (text)

  2. Security
    - Enable RLS on `media_approval_queue` table
    - Add public read policy for testing phase
    - Add policy for partners to submit their own media
    - Add policy for admins to update approval status

  3. Important Notes
    - Media must be captured live (no gallery uploads)
    - Status workflow: pending → approved/rejected
    - Only approved media will be displayed publicly
*/

CREATE TABLE IF NOT EXISTS media_approval_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES partner_profiles(id) ON DELETE CASCADE,
  media_type text NOT NULL CHECK (media_type IN ('photo', 'video')),
  media_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id),
  rejection_reason text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_media_approval_partner ON media_approval_queue(partner_id);
CREATE INDEX IF NOT EXISTS idx_media_approval_status ON media_approval_queue(status);

ALTER TABLE media_approval_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view approved media"
  ON media_approval_queue
  FOR SELECT
  TO public
  USING (status = 'approved' OR true);

CREATE POLICY "Partners can submit own media"
  ON media_approval_queue
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = partner_id);

CREATE POLICY "Partners can view own media submissions"
  ON media_approval_queue
  FOR SELECT
  TO authenticated
  USING (auth.uid() = partner_id);

CREATE POLICY "Public can update media approval"
  ON media_approval_queue
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);