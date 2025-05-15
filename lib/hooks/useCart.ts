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
  discount_percent?: number | null;
  is_on_sale?: boolean;
  sale_end_date?: string | null;
  discounted_price?: number;
};

interface AppliedCoupon {
  code: string;
  discountType: string;
  discountValue: number;
  discountAmount: number;
  couponId: string;
}

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasOutOfStockItems, setHasOutOfStockItems] = useState(false);
  const [isInventoryChecked, setIsInventoryChecked] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

  // Load cart and coupon from localStorage on initial load
  useEffect(() => {
    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
      setCart(JSON.parse(storedCart));
    }

    const storedCoupon = localStorage.getItem('appliedCoupon');
    if (storedCoupon) {
      setAppliedCoupon(JSON.parse(storedCoupon));
    }

    setIsLoading(false);
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('cart', JSON.stringify(cart));
    }
  }, [cart, isLoading]);

  // Save applied coupon to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading && appliedCoupon !== null) {
      localStorage.setItem('appliedCoupon', JSON.stringify(appliedCoupon));
    } else if (!isLoading) {
      localStorage.removeItem('appliedCoupon');
    }
  }, [appliedCoupon, isLoading]);

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
    // Calculate discounted price if applicable
    let discounted_price = product.price;
    if (product.discount_percent && product.discount_percent > 0) {
      discounted_price = parseFloat((product.price * (1 - (product.discount_percent / 100))).toFixed(2));
    }

    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: item.quantity + quantity,
                // Update discount info in case it changed
                discount_percent: product.discount_percent,
                is_on_sale: product.is_on_sale,
                sale_end_date: product.sale_end_date,
                discounted_price
              }
            : item
        );
      }
      return [...prevCart, {
        ...product,
        quantity,
        discounted_price
      }];
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
    (total, item) => {
      // Use discounted price if available, otherwise use regular price
      const priceToUse = item.discounted_price !== undefined ? item.discounted_price : item.price;
      return total + priceToUse * item.quantity;
    },
    0
  );

  // Apply a coupon to the cart
  const applyCoupon = (coupon: AppliedCoupon) => {
    setAppliedCoupon(coupon);
  };

  // Remove the applied coupon
  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  // Calculate the final total after coupon discount
  const finalTotal = appliedCoupon
    ? Math.max(0, cartTotal - appliedCoupon.discountAmount)
    : cartTotal;

  return {
    cart,
    cartCount,
    cartTotal,
    finalTotal,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
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
