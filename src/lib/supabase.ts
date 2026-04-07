import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Profile {
  id: string;
  first_name: string | null;
  live_photo_url: string | null;
  fitness_level: string | null;
  hourly_rate: number | null;
  bio: string | null;
  specialties: string[] | null;
  age: number | null;
  gender: string | null;
  role: 'trainer' | 'client' | null;  // Add this
  created_at: string;
  service_areas?: { name: string; lat: number | null; lng: number | null }[];
  availability?: { day: string; times: string[] }[];
}