import { createClient } from '@supabase/supabase-js';

/**
 * Supabase client (AUTH + DB ONLY)
 * Storage is no longer used
 */
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'placeholder-key';

// Check if we have valid configuration
const isValidConfig = supabaseUrl && 
  supabaseUrl !== 'your_supabase_url_here' && 
  supabaseUrl.startsWith('https://') &&
  supabaseAnonKey && 
  supabaseAnonKey !== 'your_supabase_anon_key_here';

export const supabase = isValidConfig 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;

// Flag to check if Supabase is configured
export const isSupabaseConfigured = isValidConfig;

/**
 * Logical folder names
 * These now map to S3 folders
 */
export const BUCKETS = {
  AVATARS: 'avatars',
  ARTWORKS: 'artworks',
  EXHIBITIONS: 'exhibitions',
};
