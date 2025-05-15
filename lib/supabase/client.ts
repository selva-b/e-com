import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Check if Supabase environment variables are set
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('Supabase environment variables are not set. Please check your .env.local file.');
}

// Create and export the Supabase client
export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);