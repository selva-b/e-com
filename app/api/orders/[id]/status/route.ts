import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { sendNotification } from '@/lib/notifications/notificationService';

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
      .select('*, profiles(*)')
      .single();

    if (updateError) throw updateError;

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Send notification to customer
    const notificationResult = await sendNotification({
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

    return NextResponse.json({
      success: true,
      order,
      notification: notificationResult,
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    );
  }
}
