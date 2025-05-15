'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/client';
import { Loader2, X } from 'lucide-react';

interface CouponInputProps {
  onApplyCoupon: (couponData: {
    code: string;
    discountType: string;
    discountValue: number;
    discountAmount: number;
    couponId: string;
  }) => void;
  onRemoveCoupon: () => void;
  orderTotal: number;
  appliedCoupon: {
    code: string;
    discountAmount: number;
  } | null;
}

export default function CouponInput({
  onApplyCoupon,
  onRemoveCoupon,
  orderTotal,
  appliedCoupon
}: CouponInputProps) {
  const [couponCode, setCouponCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const { toast } = useToast();

  async function validateCoupon() {
    if (!couponCode.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a coupon code',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsValidating(true);

      // Call the Supabase function to apply the coupon
      const { data, error } = await supabase.rpc('apply_coupon', {
        order_total: orderTotal,
        coupon_code: couponCode.trim()
      });

      if (error) throw error;

      if (!data || !data.coupon_id) {
        toast({
          title: 'Invalid Coupon',
          description: 'The coupon code is invalid or has expired',
          variant: 'destructive',
        });
        return;
      }

      // Get coupon details
      const { data: couponData, error: couponError } = await supabase
        .from('coupons')
        .select('code, discount_type, discount_value')
        .eq('id', data.coupon_id)
        .single();

      if (couponError) throw couponError;

      // Apply the coupon
      onApplyCoupon({
        code: couponData.code,
        discountType: couponData.discount_type,
        discountValue: couponData.discount_value,
        discountAmount: data.discount_amount,
        couponId: data.coupon_id
      });

      toast({
        title: 'Coupon Applied',
        description: `Discount of $${data.discount_amount.toFixed(2)} applied to your order`,
      });

      // Clear the input
      setCouponCode('');
    } catch (error: any) {
      console.error('Error validating coupon:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to validate coupon',
        variant: 'destructive',
      });
    } finally {
      setIsValidating(false);
    }
  }

  function handleRemoveCoupon() {
    onRemoveCoupon();
    toast({
      title: 'Coupon Removed',
      description: 'The coupon has been removed from your order',
    });
  }

  if (appliedCoupon) {
    return (
      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
        <div>
          <p className="font-medium text-green-700">
            Coupon applied: <span className="font-bold">{appliedCoupon.code}</span>
          </p>
          <p className="text-sm text-green-600">
            Discount: ${appliedCoupon.discountAmount.toFixed(2)}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRemoveCoupon}
          className="text-red-500 hover:text-red-700 hover:bg-red-50"
        >
          <X className="h-4 w-4 mr-1" />
          Remove
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Input
        placeholder="Enter coupon code"
        value={couponCode}
        onChange={(e) => setCouponCode(e.target.value)}
        className="flex-1"
      />
      <Button
        onClick={validateCoupon}
        disabled={isValidating || !couponCode.trim()}
      >
        {isValidating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Validating...
          </>
        ) : (
          'Apply'
        )}
      </Button>
    </div>
  );
}
