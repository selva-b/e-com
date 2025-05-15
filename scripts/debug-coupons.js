// This script checks the existing coupons in the database
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://dpzoaypkgtnqjdbdlzve.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwem9heXBrZ3RucWpkYmRsenZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTU5MjA5NzYsImV4cCI6MjAxMTQ5Njk3Nn0.Kj0vgMQcgN5Kn5NzNYl7vYm6JSTkJGCQ9awB8jcbHXg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugCoupons() {
  try {
    // Get all coupons
    const { data: coupons, error: couponsError } = await supabase
      .from('coupons')
      .select('*');

    if (couponsError) {
      console.error('Error fetching coupons:', couponsError);
      return;
    }

    console.log('All coupons in the database:');
    console.log(JSON.stringify(coupons, null, 2));

    // Test each coupon with the apply_coupon function
    if (coupons && coupons.length > 0) {
      console.log('\nTesting each coupon with apply_coupon function:');
      
      for (const coupon of coupons) {
        const { data: result, error: applyError } = await supabase.rpc('apply_coupon', {
          order_total: 100, // Test with a $100 order
          coupon_code: coupon.code
        });

        if (applyError) {
          console.error(`Error testing coupon ${coupon.code}:`, applyError);
          continue;
        }

        console.log(`\nCoupon ${coupon.code} test result:`);
        console.log(JSON.stringify(result, null, 2));
      }
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

debugCoupons();
