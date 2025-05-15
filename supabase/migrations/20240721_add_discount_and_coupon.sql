-- Add discount and flash sale fields to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_percent DECIMAL(5, 2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_on_sale BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sale_start_date TIMESTAMPTZ;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sale_end_date TIMESTAMPTZ;

-- Create coupons table
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10, 2) NOT NULL,
  min_order_amount DECIMAL(10, 2) DEFAULT 0,
  expiry_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  usage_limit INTEGER DEFAULT NULL,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index on coupon code for faster lookups
CREATE INDEX IF NOT EXISTS coupons_code_idx ON coupons(code);

-- Create coupon_usage table to track which users have used which coupons
CREATE TABLE IF NOT EXISTS coupon_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES coupons(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  order_id UUID NOT NULL REFERENCES orders(id),
  used_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(coupon_id, order_id)
);

-- Add coupon_id to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES coupons(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0;

-- Enable Row Level Security
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usage ENABLE ROW LEVEL SECURITY;

-- Create policies for coupons
CREATE POLICY "Anyone can view active coupons"
  ON coupons FOR SELECT USING (is_active = true);

CREATE POLICY "Only admins can insert coupons"
  ON coupons FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can update coupons"
  ON coupons FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete coupons"
  ON coupons FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Create policies for coupon_usage
CREATE POLICY "Users can view their own coupon usage"
  ON coupon_usage FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Only system can insert coupon usage"
  ON coupon_usage FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Create function to calculate discounted price
CREATE OR REPLACE FUNCTION get_discounted_price(
  original_price DECIMAL,
  discount_percent DECIMAL
) RETURNS DECIMAL AS $$
BEGIN
  RETURN ROUND(original_price * (1 - discount_percent / 100), 2);
END;
$$ LANGUAGE plpgsql;

-- Create function to apply coupon discount
CREATE OR REPLACE FUNCTION apply_coupon(
  order_total DECIMAL,
  coupon_code TEXT
) RETURNS TABLE(
  discounted_total DECIMAL,
  discount_amount DECIMAL,
  coupon_id UUID
) AS $$
DECLARE
  _coupon_id UUID;
  _discount_type TEXT;
  _discount_value DECIMAL;
  _min_order_amount DECIMAL;
  _discount_amount DECIMAL := 0;
BEGIN
  -- Get coupon details
  SELECT
    id, discount_type, discount_value, min_order_amount
  INTO
    _coupon_id, _discount_type, _discount_value, _min_order_amount
  FROM coupons
  WHERE
    code = coupon_code
    AND is_active = true
    AND (expiry_date IS NULL OR expiry_date > now())
    AND (usage_limit IS NULL OR usage_count < usage_limit);

  -- If coupon exists and order meets minimum amount
  IF _coupon_id IS NOT NULL AND order_total >= _min_order_amount THEN
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
  END IF;

  RETURN QUERY SELECT
    order_total - _discount_amount,
    _discount_amount,
    _coupon_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to increment coupon usage count
CREATE OR REPLACE FUNCTION increment_coupon_usage(
  _coupon_id UUID
) RETURNS VOID AS $$
BEGIN
  UPDATE coupons
  SET usage_count = usage_count + 1
  WHERE id = _coupon_id;
END;
$$ LANGUAGE plpgsql;
