import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { sendServerNotification } from '@/lib/notifications/serverNotificationService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      userId,
      items,
      total,
      address,
      city,
      state,
      postalCode,
      country,
      paymentId,
      orderId: externalOrderId
    } = body;

    if (!userId || !items || !total) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, items, and total are required' },
        { status: 400 }
      );
    }


    console.log('Creating order with direct approach...');

    // Create order in database using direct approach
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert([{
        user_id: userId,
        status: 'processing',
        total,
        address,
        city,
        state,
        postal_code: postalCode,
        country,
        payment_id: paymentId || `payment_${Date.now()}`,
        order_id: externalOrderId || `order_${Date.now()}`,
      }])
      .select('id')
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      );
    }

    // Create order items using admin client
    const orderItems = items.map((item: any) => ({
      order_id: orderData.id,
      product_id: item.id,
      quantity: item.quantity,
      price: item.price,
    }));

    console.log('Creating order items...');

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      return NextResponse.json(
        { error: 'Failed to create order items' },
        { status: 500 }
      );
    }

    // Update product inventory
    console.log('Updating product inventory...');

    for (const item of items) {
      const { error: inventoryError } = await supabase
        .from('products')
        .update({
          inventory_count: item.inventory_count - item.quantity
        })
        .eq('id', item.id);

      if (inventoryError) {
        console.error(`Error updating inventory for product ${item.id}:`, inventoryError);
      } else {
        console.log(`Updated inventory for product ${item.id}: new count = ${item.inventory_count - item.quantity}`);
      }
    }

    // Get user profile for notification
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, first_name, last_name')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
    }

    // Send order confirmation notification
    if (profile) {
      console.log('Sending order confirmation notification to user:', userId);

      try {
        const notificationResult = await sendServerNotification({
          userId,
          title: 'Order Confirmation',
          body: `Your order #${orderData.id} has been placed successfully.`,
          type: 'order_placed',
          data: {
            order_id: orderData.id,
            order_total: total.toFixed(2),
            order_items: JSON.stringify(items.map((item: any) => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price,
            }))),
          },
          email: true,
          push: true,
        });

        console.log('Order notification result:', notificationResult);

        // Log notification status
        await supabase.from('notification_logs').insert([
          {
            user_id: userId,
            type: 'order_confirmation',
            status: notificationResult.email?.success ? 'sent' : 'failed',
            details: {
              order_id: orderData.id,
              email_result: notificationResult.email,
              push_result: notificationResult.push,
            },
          },
        ]);
      } catch (notificationError) {
        console.error('Error sending order notification:', notificationError);
        // Continue with order creation even if notification fails
      }
    }

    return NextResponse.json({
      success: true,
      orderId: orderData.id,
    });
  } catch (error: any) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 500 }
    );
  }
}
