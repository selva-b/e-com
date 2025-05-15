-- Ensure RLS is disabled for orders and order_items tables
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;

-- Log the change
DO $$
BEGIN
  RAISE NOTICE 'RLS has been disabled for orders and order_items tables.';
END $$;
