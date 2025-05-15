// This script fixes any existing coupons that might have issues
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://dpzoaypkgtnqjdbdlzve.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwem9heXBrZ3RucWpkYmRsenZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTU5MjA5NzYsImV4cCI6MjAxMTQ5Njk3Nn0.Kj0vgMQcgN5Kn5NzNYl7vYm6JSTkJGCQ9awB8jcbHXg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixCoupons() {
  try {
    // Get all coupons
    const { data: coupons, error: couponsError } = await supabase
      .from('coupons')
      .select('*');

    if (couponsError) {
      console.error('Error fetching coupons:', couponsError);
      return;
    }

    console.log(`Found ${coupons.length} coupons in the database.`);

    // Fix each coupon
    for (const coupon of coupons) {
      // Ensure the coupon is active
      const updates = {
        is_active: true,
        // Set expiry date to 30 days from now if it's expired or null
        expiry_date: coupon.expiry_date && new Date(coupon.expiry_date) > new Date() 
          ? coupon.expiry_date 
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        // Ensure min_order_amount is set
        min_order_amount: coupon.min_order_amount || 0,
        // Update the updated_at timestamp
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('coupons')
        .update(updates)
        .eq('id', coupon.id)
        .select();

      if (error) {
        console.error(`Error updating coupon ${coupon.code}:`, error);
        continue;
      }

      console.log(`Fixed coupon ${coupon.code}:`, data);
    }

    console.log('All coupons have been fixed.');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

fixCoupons();
