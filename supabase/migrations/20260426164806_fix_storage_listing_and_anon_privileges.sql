/*
  # Fix Security Issues: Storage Listing Policies + Anon Role Privileges

  ## Issues Fixed

  ### 1. Public Bucket Listing Policies (Storage)
  The `avatars`, `partner-photos`, and `profile-photos` buckets are public, meaning
  Supabase serves objects at their public URL without any policy check. However, broad
  SELECT policies on `storage.objects` allow the anon/public role to LIST all files in
  the bucket (enumerate file names), which exposes more data than intended.
  
  Since public buckets do not require a SELECT policy for direct URL access, we drop
  these overly broad policies entirely. Authenticated users can still read their own
  objects if needed for management operations.

  ### 2. Anon Role Has Full Privileges on Sensitive Tables
  The `anon` role currently has SELECT (and more) on:
  - public.booking_audit_log
  - public.bookings
  - public.media_approval_queue
  - public.partner_profiles
  - public.profiles

  This means these tables and their schema are visible via the public GraphQL
  introspection endpoint at /graphql/v1. We revoke all anon privileges on these
  tables. The `authenticated` role retains its grants (managed by RLS policies),
  and the app uses authenticated sessions for all legitimate data access.

  ## Changes
  - DROP: "Public read access for avatars" SELECT policy on storage.objects
  - DROP: "Anyone can view gallery photos" SELECT policy on storage.objects
  - DROP: "Anyone can view photos" SELECT policy on storage.objects
  - REVOKE ALL from anon on: booking_audit_log, bookings, media_approval_queue,
    partner_profiles, profiles
*/

-- 1. Remove overly broad storage SELECT policies that allow bucket listing
DROP POLICY IF EXISTS "Public read access for avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view gallery photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view photos" ON storage.objects;

-- 2. Revoke all anon privileges from sensitive tables
-- These tables are protected by RLS; anon access is not needed.
-- Authenticated users still have their grants managed separately.
REVOKE ALL ON public.booking_audit_log FROM anon;
REVOKE ALL ON public.bookings FROM anon;
REVOKE ALL ON public.media_approval_queue FROM anon;
REVOKE ALL ON public.partner_profiles FROM anon;
REVOKE ALL ON public.profiles FROM anon;
