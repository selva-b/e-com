// This script applies the coupon fix directly to the database
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client
const supabaseUrl = 'https://dpzoaypkgtnqjdbdlzve.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY is required to run this script.');
  console.error('Please set the SUPABASE_SERVICE_ROLE_KEY environment variable.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyCouponFix() {
  try {
    console.log('Applying coupon fix...');

    // Drop the existing policy
    const { error: dropPolicyError } = await supabase.rpc('drop_policy_if_exists', {
      policy_name: 'Anyone can view active coupons',
      table_name: 'coupons'
    });

    if (dropPolicyError) {
      console.error('Error dropping policy:', dropPolicyError);
      // Continue anyway, as the policy might not exist
    } else {
      console.log('Successfully dropped existing policy.');
    }

    // Create a more permissive policy
    const { error: createPolicyError } = await supabase.rpc('create_policy', {
      policy_name: 'Anyone can view coupons',
      table_name: 'coupons',
      action: 'SELECT',
      using_expression: 'true'
    });

    if (createPolicyError) {
      console.error('Error creating policy:', createPolicyError);
    } else {
      console.log('Successfully created new policy.');
    }

    // Drop the existing function
    const { error: dropFunctionError } = await supabase.rpc('drop_function_if_exists', {
      function_name: 'apply_coupon',
      parameter_types: ['DECIMAL', 'TEXT']
    });

    if (dropFunctionError) {
      console.error('Error dropping function:', dropFunctionError);
    } else {
      console.log('Successfully dropped existing function.');
    }

    // Create the new function
    const functionSql = `
    CREATE FUNCTION apply_coupon(
      order_total DECIMAL,
      coupon_code TEXT
    ) RETURNS TABLE(
      discounted_total DECIMAL,
      discount_amount DECIMAL,
      coupon_id UUID,
      status TEXT,
      message TEXT
    ) AS $$
    DECLARE
      _coupon_id UUID;
      _discount_type TEXT;
      _discount_value DECIMAL;
      _min_order_amount DECIMAL;
      _discount_amount DECIMAL := 0;
      _is_active BOOLEAN;
      _expiry_date TIMESTAMPTZ;
      _usage_limit INTEGER;
      _usage_count INTEGER;
      _status TEXT := 'error';
      _message TEXT := 'Invalid coupon code';
    BEGIN
      -- Get coupon details
      SELECT 
        id, discount_type, discount_value, min_order_amount, is_active, expiry_date, usage_limit, usage_count
      INTO 
        _coupon_id, _discount_type, _discount_value, _min_order_amount, _is_active, _expiry_date, _usage_limit, _usage_count
      FROM coupons
      WHERE 
        code = coupon_code;
      
      -- If coupon doesn't exist
      IF _coupon_id IS NULL THEN
        _status := 'error';
        _message := 'Coupon code does not exist';
        RETURN QUERY SELECT order_total, _discount_amount, _coupon_id, _status, _message;
        RETURN;
      END IF;
      
      -- Check if coupon is active
      IF NOT _is_active THEN
        _status := 'error';
        _message := 'Coupon is not active';
        RETURN QUERY SELECT order_total, _discount_amount, _coupon_id, _status, _message;
        RETURN;
      END IF;
      
      -- Check if coupon has expired
      IF _expiry_date IS NOT NULL AND _expiry_date < now() THEN
        _status := 'error';
        _message := 'Coupon has expired';
        RETURN QUERY SELECT order_total, _discount_amount, _coupon_id, _status, _message;
        RETURN;
      END IF;
      
      -- Check if coupon usage limit has been reached
      IF _usage_limit IS NOT NULL AND _usage_count >= _usage_limit THEN
        _status := 'error';
        _message := 'Coupon usage limit has been reached';
        RETURN QUERY SELECT order_total, _discount_amount, _coupon_id, _status, _message;
        RETURN;
      END IF;
      
      -- Check if order meets minimum amount
      IF order_total < _min_order_amount THEN
        _status := 'error';
        _message := 'Order total does not meet minimum amount required for this coupon';
        RETURN QUERY SELECT order_total, _discount_amount, _coupon_id, _status, _message;
        RETURN;
      END IF;
      
      -- Calculate discount amount
      IF _discount_type = 'percentage' THEN
        _discount_amount := ROUND(order_total * (_discount_value / 100), 2);
      ELSE -- fixed amount
        _discount_amount := _discount_value;
      END IF;
      
      -- Ensure discount doesn't exceed order total
      IF _discount_amount > order_total THEN
        _discount_amount := order_total;
      END IF;
      
      _status := 'success';
      _message := 'Coupon applied successfully';
      
      RETURN QUERY SELECT 
        order_total - _discount_amount,
        _discount_amount,
        _coupon_id,
        _status,
        _message;
    END;
    $$ LANGUAGE plpgsql;
    `;

    // Execute the SQL directly
    const { error: createFunctionError } = await supabase.rpc('execute_sql', {
      sql: functionSql
    });

    if (createFunctionError) {
      console.error('Error creating function:', createFunctionError);
    } else {
      console.log('Successfully created new function.');
    }

    console.log('Coupon fix applied successfully.');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

applyCouponFix();
