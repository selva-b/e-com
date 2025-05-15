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
    console.error('Environment variables for Supabase not found. Please check your .env.local file.');
    throw new Error('Supabase environment variables are not set');
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
