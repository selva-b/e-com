// This script creates a test coupon in the database
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://dpzoaypkgtnqjdbdlzve.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwem9heXBrZ3RucWpkYmRsenZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTU5MjA5NzYsImV4cCI6MjAxMTQ5Njk3Nn0.Kj0vgMQcgN5Kn5NzNYl7vYm6JSTkJGCQ9awB8jcbHXg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestCoupon() {
  try {
    // Create a test coupon
    const { data, error } = await supabase
      .from('coupons')
      .insert([
        {
          code: 'TEST20',
          discount_type: 'percentage',
          discount_value: 20,
          min_order_amount: 0,
          is_active: true,
          expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        }
      ])
      .select();

    if (error) {
      console.error('Error creating test coupon:', error);
      return;
    }

    console.log('Test coupon created successfully:', data);
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createTestCoupon();
