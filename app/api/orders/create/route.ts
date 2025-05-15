import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendServerNotification } from '@/lib/notifications/serverNotificationService';

// Helper function to send low inventory notifications to admin users
async function sendLowInventoryNotification(productId: string, productName: string, currentInventory: number) {
  try {
    const supabase = createClient();

    // Get all admin users
    const { data: adminUsers, error: adminError } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name')
      .eq('role', 'admin');

    if (adminError) {
      console.error('Error fetching admin users for inventory notification:', adminError);
      return;
    }

    if (!adminUsers || adminUsers.length === 0) {
      console.log('No admin users found to notify about low inventory');
      return;
    }

    // Send notification to each admin
    for (const admin of adminUsers) {
      await sendServerNotification({
        userId: admin.id,
        title: 'Low Inventory Alert',
        body: `Product "${productName}" (ID: ${productId}) has low inventory: ${currentInventory} items remaining.`,
        type: 'stock_alert',
        data: {
          product_id: productId,
          product_name: productName,
          inventory_count: currentInventory.toString(),
          url: `/admin/products/${productId}/edit`,
        },
        email: true,
        push: true,
      });
    }

    console.log(`Low inventory notifications sent to ${adminUsers.length} admin users for product ${productId}`);
  } catch (error) {
    console.error('Error sending low inventory notifications:', error);
    // Continue with order creation even if notification fails
  }
}

export async function POST(request: Request) {
  try {
    // Create server-side Supabase client with admin privileges
    const supabase = createClient();

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

    // Update product inventory - USING SERVER-SIDE CLIENT WITH ADMIN PRIVILEGES
    console.log('Updating product inventory with server-side client...');
    console.log('Order items:', JSON.stringify(items, null, 2));

    // Process each item in the order
    for (const item of items) {
      try {
        console.log(`Processing item: ${item.id}, quantity: ${item.quantity}`);

        // 1. First get the current inventory for this product
        const { data: product, error: fetchError } = await supabase
          .from('products')
          .select('id, name, inventory_count')
          .eq('id', item.id)
          .single();

        if (fetchError) {
          console.error(`Error fetching product ${item.id}:`, fetchError);
          console.error(`Error details:`, JSON.stringify(fetchError));
          continue; // Skip to next item
        }

        if (!product) {
          console.error(`Product ${item.id} not found in database`);
          continue; // Skip to next item
        }

        console.log(`Current inventory for ${product.name} (${product.id}): ${product.inventory_count}`);

        // 2. Calculate new inventory count
        const newInventory = Math.max(0, product.inventory_count - item.quantity);
        console.log(`Calculating new inventory: ${product.inventory_count} - ${item.quantity} = ${newInventory}`);

        // 3. Update the inventory in the database - CRITICAL SECTION
        console.log(`🔄 UPDATING INVENTORY IN DATABASE: Setting product ${product.id} inventory to ${newInventory}`);

        // Use raw SQL for direct update to bypass any potential RLS issues
        const { data: updateResult, error: updateError } = await supabase
          .rpc('update_product_inventory', {
            product_id: item.id,
            new_inventory: newInventory
          });

        if (updateError) {
          console.error(`Error updating inventory for product ${item.id}:`, updateError);
          console.error(`Error details:`, JSON.stringify(updateError));

          // Fallback to direct update if RPC fails
          console.log(`Attempting fallback direct update for product ${item.id}...`);
          const { data: fallbackResult, error: fallbackError } = await supabase
            .from('products')
            .update({ inventory_count: newInventory })
            .eq('id', item.id)
            .select('inventory_count');

          if (fallbackError) {
            console.error(`Fallback update also failed for product ${item.id}:`, fallbackError);
            console.error(`Fallback error details:`, JSON.stringify(fallbackError));
          } else {
            console.log(`✅ Fallback update successful for product ${item.id}:`, fallbackResult);
          }
        } else {
          console.log(`✅ Successfully updated inventory for ${product.name} (${product.id}): ${product.inventory_count} -> ${newInventory}`);
          console.log(`Database response:`, updateResult);

          // 4. Check if inventory is low and send notification if needed
          if (newInventory <= 5) {
            console.log(`Low inventory alert for product ${item.id}: ${newInventory} items remaining`);
            await sendLowInventoryNotification(item.id, product.name, newInventory);
          }
        }

        // 5. Verify the update was successful
        const { data: verifyProduct, error: verifyError } = await supabase
          .from('products')
          .select('id, name, inventory_count')
          .eq('id', item.id)
          .single();

        if (verifyError) {
          console.error(`Error verifying inventory update for product ${item.id}:`, verifyError);
        } else if (verifyProduct) {
          console.log(`✓ Verification: Product ${verifyProduct.name} (${verifyProduct.id}) now has inventory: ${verifyProduct.inventory_count}`);
          if (verifyProduct.inventory_count !== newInventory) {
            console.error(`⚠️ INVENTORY MISMATCH: Expected ${newInventory}, but found ${verifyProduct.inventory_count}`);
          }
        }
      } catch (error) {
        console.error(`Unexpected error processing inventory for item ${item.id}:`, error);
        // Continue with next item even if this one fails
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
