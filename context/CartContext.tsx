'use client';

import React, { createContext, useContext } from 'react';
import { CartItem, useCart } from '@/lib/hooks/useCart';

interface AppliedCoupon {
  code: string;
  discountType: string;
  discountValue: number;
  discountAmount: number;
  couponId: string;
}

type CartContextType = {
  cart: CartItem[];
  cartCount: number;
  cartTotal: number;
  finalTotal: number;
  appliedCoupon: AppliedCoupon | null;
  applyCoupon: (coupon: AppliedCoupon) => void;
  removeCoupon: () => void;
  addToCart: (product: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  removeSelectedItems: (itemIds: string[]) => void;
  isLoading: boolean;
  checkInventory: () => Promise<void>;
  hasOutOfStockItems: boolean;
  isInventoryChecked: boolean;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const cart = useCart();

  return <CartContext.Provider value={cart}>{children}</CartContext.Provider>;
}

export function useCartContext() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
