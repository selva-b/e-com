'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, ArrowLeft, ShoppingCart } from 'lucide-react';
import Link from 'next/link';

export default function OrderFailurePage() {
  return (
    <div className="container max-w-md mx-auto py-16 px-4">
      <Card className="border-red-200">
        <CardHeader className="text-center pb-2">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <CardTitle className="text-2xl">Payment Failed</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-4">
            We're sorry, but your payment could not be processed. This could be due to:
          </p>
          <ul className="text-left list-disc pl-6 mb-4 space-y-1">
            <li>Insufficient funds in your account</li>
            <li>Card expired or invalid</li>
            <li>Bank declined the transaction</li>
            <li>Network or connectivity issues</li>
          </ul>
          <p>
            Your order has not been placed and your card has not been charged.
            Please try again or use a different payment method.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button asChild className="w-full">
            <Link href="/checkout">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Checkout
            </Link>
          </Button>
          <Button variant="outline" asChild className="w-full">
            <Link href="/products">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Continue Shopping
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
