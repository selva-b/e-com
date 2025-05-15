import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { sendServerNotification } from '@/lib/notifications/serverNotificationService';

// Update order status and send notifications
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }


    // Update order status
    const { data: order, error: updateError } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .select('*')
      .single();

    if (updateError) throw updateError;

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    console.log('Order status updated to:', status);
    console.log('Sending notification for order:', orderId);

    // Send notification to customer
    const notificationResult = await sendServerNotification({
      userId: order.user_id,
      title: `Order ${status}`,
      body: `Your order #${orderId} has been ${status}.`,
      type: 'order_status',
      data: {
        order_id: orderId,
        status,
        url: `/orders/${orderId}`,
      },
      email: true,
      push: true,
    });

    console.log('Notification result:', notificationResult);

    return NextResponse.json({
      success: true,
      order,
      notification: notificationResult,
    });
  } catch (error: any) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update order status' },
      { status: 500 }
    );
  }
}
