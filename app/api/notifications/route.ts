import { NextResponse } from 'next/server';
import { sendServerNotification } from '@/lib/notifications/serverNotificationService';

// Send notification to a user
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, title, body: content, type, data, email = true, push = true } = body;

    if (!userId || !title || !content || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, title, body, and type are required' },
        { status: 400 }
      );
    }

    console.log('Sending notification to user:', userId);
    console.log('Notification details:', { title, content, type, email, push });

    // Send notification using server-side notification service
    const result = await sendServerNotification({
      userId,
      title,
      body: content,
      type,
      data,
      email,
      push,
    });

    console.log('Notification result:', result);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error sending notification:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send notification' },
      { status: 500 }
    );
  }
}
