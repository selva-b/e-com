'use client';

import { useCartContext } from '@/context/CartContext';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Trash2, Plus, Minus, ShoppingBag, AlertTriangle, Loader2, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Currency } from '@/components/ui/currency';
import CouponInput from '@/components/cart/CouponInput';

export default function CartPage() {
  const {
    cart,
    cartTotal,
    updateQuantity,
    removeFromCart,
    isLoading,
    checkInventory,
    hasOutOfStockItems,
    isInventoryChecked,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    finalTotal
  } = useCartContext();

  const [mounted, setMounted] = useState(false);
  const [checkingInventory, setCheckingInventory] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const { toast } = useToast();

  // Calculate total for selected items only
  const selectedItemsTotal = cart
    .filter(item => selectedItems.includes(item.id))
    .reduce((total, item) => total + item.price * item.quantity, 0);

  // Check if any selected items have insufficient stock
  const hasSelectedOutOfStock = cart
    .filter(item => selectedItems.includes(item.id))
    .some(item => item.isOutOfStock);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check inventory only once when the cart page loads
  useEffect(() => {
    const verifyInventory = async () => {
      if (!isInventoryChecked && mounted && !isLoading && cart.length > 0) {
        setCheckingInventory(true);
        await checkInventory();
        setCheckingInventory(false);
      }
    };

    verifyInventory();
  }, [mounted, isLoading, cart.length, checkInventory, isInventoryChecked]);

  // Handle select all checkbox
  useEffect(() => {
    if (selectAll) {
      setSelectedItems(cart.map(item => item.id));
    } else if (selectedItems.length === cart.length) {
      // This condition prevents clearing selections when individual items are checked
      // and they happen to equal the total number of items
      if (!cart.every(item => selectedItems.includes(item.id))) {
        setSelectedItems([]);
      }
    }
  }, [selectAll, cart]);

  // Update selectAll state when individual selections change
  useEffect(() => {
    if (cart.length > 0 && selectedItems.length === cart.length) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [selectedItems, cart]);

  // Handle individual item selection
  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  // Handle select all
  const toggleSelectAll = () => {
    setSelectAll(!selectAll);
  };

  if (!mounted || isLoading || checkingInventory) {
    return (
      <div className="container max-w-4xl mx-auto py-16 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Your Cart</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="py-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              {checkingInventory ? 'Checking inventory...' : 'Loading cart...'}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="container max-w-4xl mx-auto py-16 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Your Cart</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="py-16 text-center">
              <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Your cart is empty</h3>
              <p className="text-muted-foreground mb-6">
                Looks like you haven&apos;t added any products to your cart yet.
              </p>
              <Button asChild>
                <Link href="/products">Continue Shopping</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-16 px-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Your Cart</CardTitle>
            <div className="flex items-center gap-2">
              <Checkbox
                id="selectAll"
                checked={selectAll}
                onCheckedChange={toggleSelectAll}
              />
              <label htmlFor="selectAll" className="text-sm font-medium cursor-pointer">
                Select All
              </label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {hasOutOfStockItems && (
            <div className="mb-6 p-4 border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-900 rounded-md flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800 dark:text-yellow-400">Inventory Alert</h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-500">
                  Some items in your cart exceed available inventory.
                  Please update quantities before proceeding to checkout.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {cart.map((item) => (
              <div key={item.id} className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center">
                  <Checkbox
                    id={`select-${item.id}`}
                    checked={selectedItems.includes(item.id)}
                    onCheckedChange={() => toggleItemSelection(item.id)}
                    disabled={item.isOutOfStock}
                    className="mr-4"
                  />
                </div>
                <div className="w-full sm:w-24 h-24 bg-muted rounded-md overflow-hidden flex-shrink-0">
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{item.name}</h3>
                      {item.isOutOfStock && (
                        <Badge variant="destructive" className="text-xs">
                          Insufficient Stock
                        </Badge>
                      )}
                    </div>
                    <p className="font-semibold">
                      <Currency value={item.price * item.quantity} />
                    </p>
                  </div>
                  <p className="text-muted-foreground">
                    <Currency value={item.price} /> each
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                      className="h-8 w-16 text-center"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.inventory_count}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {item.inventory_count > 0 && item.inventory_count < 5 && (
                    <p className="text-xs text-yellow-600 dark:text-yellow-500">
                      Only {item.inventory_count} left in stock
                    </p>
                  )}
                  {item.isOutOfStock && item.inventory_count > 0 && (
                    <p className="text-xs text-destructive">
                      Please reduce quantity to {item.inventory_count} or less
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {selectedItems.length > 0 && (
            <div className="mt-6 p-4 border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-900 rounded-md flex items-start gap-3">
              <Check className="h-5 w-5 text-green-600 dark:text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-800 dark:text-green-400">Selected Items</h4>
                <p className="text-sm text-green-700 dark:text-green-500">
                  You have selected {selectedItems.length} item(s) for checkout.
                  Total: <Currency value={selectedItemsTotal} />
                </p>
              </div>
            </div>
          )}
        </CardContent>
        <Separator />

        {/* Coupon Section */}
        <div className="p-6 pb-0">
          <h3 className="font-medium mb-2">Apply Coupon</h3>
          <CouponInput
            onApplyCoupon={applyCoupon}
            onRemoveCoupon={removeCoupon}
            orderTotal={selectedItemsTotal}
            appliedCoupon={appliedCoupon ? {
              code: appliedCoupon.code,
              discountAmount: appliedCoupon.discountAmount
            } : null}
          />
        </div>

        <CardFooter className="flex flex-col sm:flex-row justify-between p-6 gap-4">
          <div>
            <p className="text-muted-foreground">Subtotal ({selectedItems.length} of {cart.length} items)</p>
            <p className="text-2xl font-bold">
              {selectedItems.length > 0 ? <Currency value={selectedItemsTotal} /> : <Currency value={0} />}
            </p>

            {appliedCoupon && selectedItems.length > 0 && (
              <>
                <p className="text-sm text-muted-foreground mt-1">
                  Discount: -<Currency value={appliedCoupon.discountAmount} />
                </p>
                <p className="text-lg font-semibold text-green-600 mt-1">
                  Final Total: <Currency value={selectedItemsTotal - appliedCoupon.discountAmount} />
                </p>
              </>
            )}
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" className="flex-1 sm:flex-initial" asChild>
              <Link href="/products">Continue Shopping</Link>
            </Button>
            <Button
              className="flex-1 sm:flex-initial"
              asChild
              disabled={selectedItems.length === 0 || hasSelectedOutOfStock}
            >
              <Link
                href={selectedItems.length > 0 && !hasSelectedOutOfStock
                  ? `/checkout?items=${selectedItems.join(',')}`
                  : "#"
                }
              >
                {selectedItems.length === 0
                  ? "Select Items"
                  : hasSelectedOutOfStock
                    ? "Insufficient Inventory"
                    : "Checkout Selected"
                }
              </Link>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
