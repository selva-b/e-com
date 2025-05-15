import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dpzoaypkgtnqjdbdlzve.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET() {
  try {
    if (!supabaseKey) {
      return NextResponse.json(
        { error: 'Supabase key is not configured' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // First, delete any existing coupon with the same code to avoid conflicts
    await supabase
      .from('coupons')
      .delete()
      .eq('code', 'TEST50');

    // Create a new valid coupon
    const { data, error } = await supabase
      .from('coupons')
      .insert([
        {
          code: 'TEST50',
          discount_type: 'percentage',
          discount_value: 50,
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
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Test coupon created successfully',
      coupon: data[0],
      code: 'TEST50'
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
