import { NextResponse } from 'next/server';
import crypto from 'crypto';

// Razorpay configuration
const KEY_ID = 'rzp_test_3eVIB91QVNpqhz';
const SECRET_KEY = 'f97KYA8esSWGqy1z1rsGkmGI';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, currency = 'INR', receipt } = body;

    // In a real implementation, you would create an order with Razorpay API
    // For demo purposes, we'll just return a simulated response
    const orderData = {
      id: `order_${Date.now()}`,
      amount,
      currency,
      receipt,
      status: 'created',
      key: KEY_ID,
    };

    return NextResponse.json(orderData);
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    // Verify the payment signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generatedSignature = crypto
      .createHmac('sha256', SECRET_KEY)
      .update(text)
      .digest('hex');

    if (generatedSignature === razorpay_signature) {
      // Payment is verified
      return NextResponse.json({ verified: true });
    } else {
      // Payment verification failed
      return NextResponse.json(
        { verified: false, error: 'Invalid signature' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}
