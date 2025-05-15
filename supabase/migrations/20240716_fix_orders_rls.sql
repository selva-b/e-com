-- Fix Row Level Security (RLS) policies for orders table

-- First, check if RLS is enabled on the orders table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'orders'
    AND rowsecurity = true
  ) THEN
    -- RLS is enabled, so we need to create appropriate policies
    
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
    DROP POLICY IF EXISTS "Users can insert their own orders" ON orders;
    DROP POLICY IF EXISTS "Service role can manage all orders" ON orders;
    
    -- Create policy for users to view their own orders
    CREATE POLICY "Users can view their own orders"
      ON orders
      FOR SELECT
      USING (auth.uid() = user_id);
    
    -- Create policy for users to insert their own orders
    CREATE POLICY "Users can insert their own orders"
      ON orders
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
    
    -- Create policy for service role to manage all orders
    CREATE POLICY "Service role can manage all orders"
      ON orders
      USING (auth.role() = 'service_role');
    
    -- Create policy for admins to manage all orders
    CREATE POLICY "Admins can manage all orders"
      ON orders
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      );
    
    RAISE NOTICE 'RLS policies for orders table have been updated.';
  ELSE
    -- RLS is not enabled, so we need to enable it and create policies
    ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
    
    -- Create policy for users to view their own orders
    CREATE POLICY "Users can view their own orders"
      ON orders
      FOR SELECT
      USING (auth.uid() = user_id);
    
    -- Create policy for users to insert their own orders
    CREATE POLICY "Users can insert their own orders"
      ON orders
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
    
    -- Create policy for service role to manage all orders
    CREATE POLICY "Service role can manage all orders"
      ON orders
      USING (auth.role() = 'service_role');
    
    -- Create policy for admins to manage all orders
    CREATE POLICY "Admins can manage all orders"
      ON orders
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      );
    
    RAISE NOTICE 'RLS has been enabled for orders table and policies have been created.';
  END IF;
END $$;

-- Also fix RLS for order_items table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'order_items'
    AND rowsecurity = true
  ) THEN
    -- RLS is enabled, so we need to create appropriate policies
    
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view their own order items" ON order_items;
    DROP POLICY IF EXISTS "Users can insert their own order items" ON order_items;
    DROP POLICY IF EXISTS "Service role can manage all order items" ON order_items;
    
    -- Create policy for users to view their own order items
    CREATE POLICY "Users can view their own order items"
      ON order_items
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM orders
          WHERE orders.id = order_items.order_id
          AND orders.user_id = auth.uid()
        )
      );
    
    -- Create policy for users to insert their own order items
    CREATE POLICY "Users can insert their own order items"
      ON order_items
      FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM orders
          WHERE orders.id = order_items.order_id
          AND orders.user_id = auth.uid()
        )
      );
    
    -- Create policy for service role to manage all order items
    CREATE POLICY "Service role can manage all order items"
      ON order_items
      USING (auth.role() = 'service_role');
    
    -- Create policy for admins to manage all order items
    CREATE POLICY "Admins can manage all order items"
      ON order_items
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      );
    
    RAISE NOTICE 'RLS policies for order_items table have been updated.';
  ELSE
    -- RLS is not enabled, so we need to enable it and create policies
    ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
    
    -- Create policy for users to view their own order items
    CREATE POLICY "Users can view their own order items"
      ON order_items
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM orders
          WHERE orders.id = order_items.order_id
          AND orders.user_id = auth.uid()
        )
      );
    
    -- Create policy for users to insert their own order items
    CREATE POLICY "Users can insert their own order items"
      ON order_items
      FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM orders
          WHERE orders.id = order_items.order_id
          AND orders.user_id = auth.uid()
        )
      );
    
    -- Create policy for service role to manage all order items
    CREATE POLICY "Service role can manage all order items"
      ON order_items
      USING (auth.role() = 'service_role');
    
    -- Create policy for admins to manage all order items
    CREATE POLICY "Admins can manage all order items"
      ON order_items
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      );
    
    RAISE NOTICE 'RLS has been enabled for order_items table and policies have been created.';
  END IF;
END $$;
