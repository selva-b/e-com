-- Create a function to update product inventory
-- This function bypasses RLS and can be called by the service role
CREATE OR REPLACE FUNCTION update_product_inventory(product_id UUID, new_inventory INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- This means the function runs with the privileges of the creator
AS $$
BEGIN
  -- Update the product inventory
  UPDATE products
  SET 
    inventory_count = new_inventory,
    updated_at = NOW()
  WHERE id = product_id;
  
  -- Return true if the update was successful
  RETURN FOUND;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_product_inventory TO authenticated;

-- Add comment to document the function
COMMENT ON FUNCTION update_product_inventory IS 'Updates product inventory count, bypassing RLS. Can be called by authenticated users but runs with SECURITY DEFINER privileges.';
