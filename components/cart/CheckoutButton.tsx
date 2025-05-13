'use client';

import { Button } from '@/components/ui/button';
import { useCartContext } from '@/context/CartContext';
import { CreditCard } from 'lucide-react';
import Link from 'next/link';

interface CheckoutButtonProps {
  className?: string;
}

export default function CheckoutButton({ className = '' }: CheckoutButtonProps) {
  const { cart } = useCartContext();
  
  if (cart.length === 0) {
    return null;
  }
  
  return (
    <Button asChild className={className}>
      <Link href="/checkout">
        <CreditCard className="mr-2 h-4 w-4" />
        Checkout
      </Link>
    </Button>
  );
}
