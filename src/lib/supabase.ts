import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Profile {
  id: string;
  first_name: string | null;
  display_name: string | null;
  live_photo_url: string | null;
  photo_url: string | null;
  fitness_level: string | null;
  hourly_rate: number | null;
  bio: string | null;
  specialties: string[] | null;
  age: number | null;
  gender: string | null;
  role: 'trainer' | 'client' | 'member' | null;
  city: string | null;
  fitness_goals: string | null;
  profile_complete: boolean | null;
  is_partner: boolean | null;
  created_at: string;
  updated_at: string | null;
  service_areas: { name: string; lat: number | null; lng: number | null }[] | null;
  service_areas_center_lat: number | null;
  service_areas_center_lng: number | null;
  service_types: string[] | null;
  custom_service_types: string[] | null;
  service_rates: Record<string, { hourly: number; halfHour: number }> | null;
  half_hour_enabled: boolean | null;
  min_advance_notice: number | null;
  cancellation_window: number | null;
  certifications: string[] | null;
  photos: string[] | null;
  availability: { day: string; times: string[] }[] | null;
  age_verified: boolean | null;
  onboarding_completed: boolean | null;
}