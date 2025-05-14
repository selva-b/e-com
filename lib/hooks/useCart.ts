'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export type CartItem = {
  id: string;
  name: string;
  price: number;
  image_url: string;
  inventory_count: number;
  quantity: number;
  isOutOfStock?: boolean;
};

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasOutOfStockItems, setHasOutOfStockItems] = useState(false);
  const [isInventoryChecked, setIsInventoryChecked] = useState(false);

  // Load cart from localStorage on initial load
  useEffect(() => {
    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
      setCart(JSON.parse(storedCart));
    }
    setIsLoading(false);
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('cart', JSON.stringify(cart));
    }
  }, [cart, isLoading]);

  // Check inventory for all items in the cart - only called explicitly, not in a loop
  const checkInventory = async () => {
    if (cart.length === 0) {
      setHasOutOfStockItems(false);
      setIsInventoryChecked(true);
      return;
    }

    try {
      // Get all product IDs in the cart
      const productIds = cart.map(item => item.id);
      
      // Make a single batch request to fetch all inventory data
      const { data, error } = await supabase
        .from('products')
        .select('id, inventory_count')
        .in('id', productIds);
      
      if (error) throw error;
      
      if (data) {
        // Create a map of product ID to inventory count
        const inventoryMap = data.reduce((map, product) => {
          map[product.id] = product.inventory_count;
          return map;
        }, {} as Record<string, number>);
        
        // Update cart items with current inventory counts and check if any are out of stock
        const updatedCart = cart.map(item => {
          const currentInventory = inventoryMap[item.id] || 0;
          // An item is out of stock if the quantity in cart exceeds available inventory
          const isOutOfStock = item.quantity > currentInventory;
          
          return {
            ...item,
            inventory_count: currentInventory,
            isOutOfStock
          };
        });
        
        // Check if any items have quantity > inventory
        const outOfStockItems = updatedCart.some(item => item.isOutOfStock);
        setHasOutOfStockItems(outOfStockItems);
        
        // Update the cart with the latest inventory information
        setCart(updatedCart);
        setIsInventoryChecked(true);
      }
    } catch (error) {
      console.error('Error checking inventory:', error);
      setIsInventoryChecked(true);
    }
  };

  const addToCart = (product: Omit<CartItem, 'quantity'>, quantity = 1) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevCart, { ...product, quantity }];
    });
    // Reset inventory check flag when cart changes
    setIsInventoryChecked(false);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
    // Reset inventory check flag when cart changes
    setIsInventoryChecked(false);
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
    // Reset inventory check flag when cart changes
    setIsInventoryChecked(false);
  };

  const clearCart = () => {
    setCart([]);
    setHasOutOfStockItems(false);
    setIsInventoryChecked(true);
  };
  
  // Remove selected items from cart
  const removeSelectedItems = (itemIds: string[]) => {
    setCart(prevCart => prevCart.filter(item => !itemIds.includes(item.id)));
    setIsInventoryChecked(false);
  };

  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);
  
  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  return {
    cart,
    cartCount,
    cartTotal,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    removeSelectedItems,
    isLoading,
    checkInventory,
    hasOutOfStockItems,
    isInventoryChecked
  };
}
