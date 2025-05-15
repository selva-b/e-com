-- Add payment_id and order_id columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_id TEXT;

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS orders_payment_id_idx ON orders(payment_id);
CREATE INDEX IF NOT EXISTS orders_order_id_idx ON orders(order_id);

-- Add comment to document the purpose of these columns
COMMENT ON COLUMN orders.payment_id IS 'External payment provider ID for the order';
COMMENT ON COLUMN orders.order_id IS 'External order ID for the order';
