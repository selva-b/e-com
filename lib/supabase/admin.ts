import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with admin privileges
export const createAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase URL or service role key');
    console.error('URL:', supabaseUrl);
    console.error('Key exists:', !!supabaseServiceKey);
    throw new Error('Missing Supabase URL or service role key');
  }

  console.log('Creating admin client with URL:', supabaseUrl);
  console.log('Service key length:', supabaseServiceKey.length);

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// Create a single instance of the admin client
let adminClient: ReturnType<typeof createAdminClient> | null = null;

// Get or create the admin client
export const getAdminClient = () => {
  if (!adminClient) {
    adminClient = createAdminClient();
  }
  return adminClient;
};
