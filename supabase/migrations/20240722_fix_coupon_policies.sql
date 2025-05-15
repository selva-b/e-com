-- Drop the existing policy that might be too restrictive
DROP POLICY IF EXISTS "Anyone can view active coupons" ON coupons;

-- Create a more permissive policy for viewing coupons
CREATE POLICY "Anyone can view coupons"
  ON coupons FOR SELECT USING (true);

-- Drop the existing function first
DROP FUNCTION IF EXISTS apply_coupon(DECIMAL, TEXT);

-- Create the updated apply_coupon function with better error messages
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
