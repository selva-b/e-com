// This script creates a guaranteed valid test coupon
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://dpzoaypkgtnqjdbdlzve.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwem9heXBrZ3RucWpkYmRsenZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTU5MjA5NzYsImV4cCI6MjAxMTQ5Njk3Nn0.Kj0vgMQcgN5Kn5NzNYl7vYm6JSTkJGCQ9awB8jcbHXg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function createValidCoupon() {
  try {
    // First, delete any existing coupon with the same code to avoid conflicts
    await supabase
      .from('coupons')
      .delete()
      .eq('code', 'VALID25');

    // Create a new valid coupon
    const { data, error } = await supabase
      .from('coupons')
      .insert([
        {
          code: 'VALID25',
          discount_type: 'percentage',
          discount_value: 25,
          min_order_amount: 0,
          is_active: true,
          expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
          usage_limit: null, // unlimited usage
          usage_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select();

    if (error) {
      console.error('Error creating valid coupon:', error);
      return;
    }

    console.log('Valid coupon created successfully:', data);
    
    // Test the coupon with the apply_coupon function
    const { data: testResult, error: testError } = await supabase.rpc('apply_coupon', {
      order_total: 100, // Test with a $100 order
      coupon_code: 'VALID25'
    });

    if (testError) {
      console.error('Error testing the coupon:', testError);
      return;
    }

    console.log('Coupon test result:', testResult);
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createValidCoupon();
