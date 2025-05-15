import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Create a Supabase client for server-side operations
export function createClient() {
  // Check if we're on the server side
  if (typeof window !== 'undefined') {
    console.error('This function should only be called on the server side');
    throw new Error('This function should only be called on the server side');
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('Environment variables for Supabase not found, using fallback credentials. This is fine for development but should be configured properly in production.');
    // Return a client with the fallback credentials
    return createSupabaseClient<Database>(
      'https://dpzoaypkgtnqjdbdlzve.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwem9heXBrZ3RucWpkYmRsenZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwNTMxNzYsImV4cCI6MjA2MjYyOTE3Nn0.vYdq4sGpZL1Lh5sEpXOsGDwQcfvxTgtAY73VwDlKLqk',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );
  }

  return createSupabaseClient<Database>(
    supabaseUrl,
    supabaseKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}
