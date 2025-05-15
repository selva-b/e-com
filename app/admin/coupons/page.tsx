'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

const couponSchema = z.object({
  code: z.string().min(3, 'Code must be at least 3 characters'),
  discount_type: z.enum(['percentage', 'fixed']),
  discount_value: z.string().min(1, 'Discount value is required'),
  min_order_amount: z.string().default('0'),
  expiry_date: z.string().optional(),
  is_active: z.boolean().default(true),
  usage_limit: z.string().optional(),
});

type CouponFormValues = z.infer<typeof couponSchema>;

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_order_amount: number;
  expiry_date: string | null;
  is_active: boolean;
  usage_limit: number | null;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export default function CouponsPage() {
  const { user, isAdmin, isLoading } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState<string | null>(null);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const { toast } = useToast();

  const form = useForm<CouponFormValues>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code: '',
      discount_type: 'percentage',
      discount_value: '',
      min_order_amount: '0',
      expiry_date: '',
      is_active: true,
      usage_limit: '',
    },
  });

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      redirect('/login');
    }
  }, [user, isAdmin, isLoading]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchCoupons();
    }
  }, [user, isAdmin]);

  useEffect(() => {
    if (editingCoupon) {
      form.reset({
        code: editingCoupon.code,
        discount_type: editingCoupon.discount_type as 'percentage' | 'fixed',
        discount_value: editingCoupon.discount_value.toString(),
        min_order_amount: editingCoupon.min_order_amount.toString(),
        expiry_date: editingCoupon.expiry_date ? new Date(editingCoupon.expiry_date).toISOString().split('T')[0] : '',
        is_active: editingCoupon.is_active,
        usage_limit: editingCoupon.usage_limit?.toString() || '',
      });
      setDialogOpen(true);
    }
  }, [editingCoupon, form]);

  async function fetchCoupons() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoupons(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch coupons',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(data: CouponFormValues) {
    try {
      const couponData = {
        code: data.code.toUpperCase(),
        discount_type: data.discount_type,
        discount_value: parseFloat(data.discount_value),
        min_order_amount: parseFloat(data.min_order_amount || '0'),
        expiry_date: data.expiry_date ? new Date(data.expiry_date).toISOString() : null,
        is_active: data.is_active,
        usage_limit: data.usage_limit ? parseInt(data.usage_limit) : null,
        updated_at: new Date().toISOString(),
      };

      if (editingCoupon) {
        // Update existing coupon
        const { error } = await supabase
          .from('coupons')
          .update(couponData)
          .eq('id', editingCoupon.id);

        if (error) throw error;

        toast({
          title: 'Coupon updated',
          description: 'The coupon has been updated successfully.',
        });
      } else {
        // Create new coupon
        const { error } = await supabase
          .from('coupons')
          .insert([{
            ...couponData,
            usage_count: 0,
            created_at: new Date().toISOString(),
          }]);

        if (error) throw error;

        toast({
          title: 'Coupon created',
          description: 'The coupon has been created successfully.',
        });
      }

      form.reset();
      setDialogOpen(false);
      setEditingCoupon(null);
      fetchCoupons();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      });
    }
  }

  async function handleDelete(id: string) {
    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Coupon deleted',
        description: 'The coupon has been deleted successfully.',
      });

      fetchCoupons();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete coupon',
        variant: 'destructive',
      });
    } finally {
      setCouponToDelete(null);
      setDeleteDialogOpen(false);
    }
  }

  function handleEdit(coupon: Coupon) {
    setEditingCoupon(coupon);
  }

  function handleCloseDialog() {
    setDialogOpen(false);
    setEditingCoupon(null);
    form.reset();
  }

  async function toggleCouponStatus(id: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from('coupons')
        .update({ is_active: !currentStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: `Coupon ${!currentStatus ? 'activated' : 'deactivated'}`,
        description: `The coupon has been ${!currentStatus ? 'activated' : 'deactivated'} successfully.`,
      });

      fetchCoupons();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update coupon status',
        variant: 'destructive',
      });
    }
  }

  if (isLoading || loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex justify-center items-center h-64">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Coupons</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingCoupon(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Coupon
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingCoupon ? 'Edit Coupon' : 'Create Coupon'}</DialogTitle>
              <DialogDescription>
                {editingCoupon
                  ? 'Edit the coupon details below.'
                  : 'Fill in the details to create a new coupon.'}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Coupon Code</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="SUMMER20" />
                      </FormControl>
                      <FormDescription>
                        Enter a unique code for the coupon (e.g., SUMMER20)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="discount_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select discount type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage</SelectItem>
                          <SelectItem value="fixed">Fixed Amount</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose whether the discount is a percentage or fixed amount
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="discount_value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount Value</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step={form.watch('discount_type') === 'percentage' ? '1' : '0.01'}
                          {...field}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormDescription>
                        {form.watch('discount_type') === 'percentage'
                          ? 'Enter percentage value (e.g., 20 for 20% off)'
                          : 'Enter fixed amount (e.g., 10 for $10 off)'}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="min_order_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Order Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormDescription>
                        Minimum order amount required to use this coupon (0 for no minimum)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expiry_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiry Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        When the coupon expires (leave empty for no expiry)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="usage_limit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Usage Limit</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum number of times this coupon can be used (leave empty for unlimited)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Active</FormLabel>
                        <FormDescription>
                          Whether this coupon is currently active and can be used
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage Coupons</CardTitle>
          <CardDescription>
            Create and manage discount coupons for your store
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Min. Order</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No coupons found. Create your first coupon to get started.
                  </TableCell>
                </TableRow>
              ) : (
                coupons.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell className="font-medium">{coupon.code}</TableCell>
                    <TableCell className="capitalize">{coupon.discount_type}</TableCell>
                    <TableCell>
                      {coupon.discount_type === 'percentage'
                        ? `${coupon.discount_value}%`
                        : `$${coupon.discount_value.toFixed(2)}`}
                    </TableCell>
                    <TableCell>${coupon.min_order_amount.toFixed(2)}</TableCell>
                    <TableCell>
                      {coupon.expiry_date
                        ? new Date(coupon.expiry_date).toLocaleDateString()
                        : 'No expiry'}
                    </TableCell>
                    <TableCell>
                      {coupon.usage_count}
                      {coupon.usage_limit ? ` / ${coupon.usage_limit}` : ''}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={coupon.is_active}
                        onCheckedChange={() => toggleCouponStatus(coupon.id, coupon.is_active)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(coupon)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the coupon
                                "{coupon.code}" and remove it from our servers.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(coupon.id)}
                                className="bg-destructive text-destructive-foreground"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
