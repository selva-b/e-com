// This script tests the Supabase connection
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Get Supabase URL and key from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseAnonKey ? '[REDACTED]' : 'Not set');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Supabase environment variables are not set correctly.');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test a simple query
async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Try to get the server timestamp
    const { data, error } = await supabase.rpc('get_server_timestamp');
    
    if (error) {
      console.error('Error connecting to Supabase:', error.message);
      return;
    }
    
    console.log('Connection successful!');
    console.log('Server timestamp:', data);
    
    // Try to query a table
    console.log('\nTesting table access...');
    const { data: tableData, error: tableError } = await supabase
      .from('products')
      .select('id, name')
      .limit(1);
    
    if (tableError) {
      console.error('Error querying table:', tableError.message);
      return;
    }
    
    console.log('Table access successful!');
    console.log('Sample data:', tableData);
    
  } catch (error) {
    console.error('Unexpected error:', error.message);
  }
}

testConnection();
